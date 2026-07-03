"""Движок диалога: гибрид state machine + LLM.

State machine держит ЦЕЛЬ шага (какое поле заявки добираем), LLM формулирует
реплики и через function calling извлекает поля из свободного текста.

Порядок шагов: GREETING → SERVICE → URGENCY → NAME → PHONE → TIME → CONFIRM.

Детерминированные контуры, которые НЕ доверены LLM:
- протокол острой боли (триггеры по ключевым словам, лид 🔴 СРОЧНО немедленно;
  срабатывает даже во время антиспам-паузы и после завершения анкеты);
- «позовите человека» → лид «просит живого» немедленно;
- валидация телефона (+7/8 + 10 цифр, мягкий переспрос);
- антиспам (>N сообщений за окно → пауза) и лимит сообщений на сессию.

Ходы одной сессии сериализуются asyncio.Lock: aiogram обрабатывает апдейты
конкурентно (handle_as_tasks=True), а два быстрых сообщения без блокировки
затирали бы друг другу собранные поля.
"""

from __future__ import annotations

import asyncio
import json
import re
from collections import deque
from dataclasses import dataclass, field

from loguru import logger

from backend.config import Clinic, Settings, parse_work_hours
from backend.core import prompts
from backend.core.llm_base import BaseLLM
from backend.db import Database
from backend import qualifier
from backend.leads import LeadService
from backend.scheduler_lite import next_slots_text
from backend.utils import looks_like_phone_attempt, normalize_phone, now_msk

# Поля заявки в порядке заполнения; шаг = первое незаполненное поле.
FIELD_ORDER = [
    ("service", "SERVICE"),
    ("urgency", "URGENCY"),
    ("name", "NAME"),
    ("phone", "PHONE"),
    ("preferred_time", "TIME"),
]

# Отрицания вырезаем ДО поиска триггеров: «ничего не болит», «не опух»,
# «болит, но не сильно» — обычные фразы планового пациента.
_NEG_STRIP_RE = re.compile(
    r"\b(ничего\s+)?не(т|чего)?\s+"
    r"(сильн\w*|бол(ит|ят|ел\w*|ьно)?|опух\w*|отек\w*|отёк\w*|распухл\w*|кровоточ\w*)",
    re.IGNORECASE,
)

_URGENT_PATTERNS = [
    r"остр(ая|о|ый|ейшая)?\W*бол",
    # «сильная (зубная) боль», «адская боль», «ужасно болит»
    r"(сильн\w*|адск\w*|ужасн\w*|невыносим\w*|очень|дик\w*|жутк\w*)\W+(зубн\w+\W+)?бол(ь\b|ит|ят)",
    r"бол(ит|ят)[^.!?]{0,40}(сейчас|прямо|сильн\w*|очень|ужасно|невыносимо)",
    r"(сейчас|прямо|сильн\w*|очень|ужасно|невыносимо)[^.!?]{0,40}бол(ит|ят)",
    r"невыносим",
    # «кровотечение» — всегда срочно; «кровоточит» — только с интенсивностью,
    # иначе ловим «кровоточат дёсны при чистке» (самая частая плановая жалоба)
    r"кровотеч|(идет|идёт|течет|течёт|хлещет)\W*кровь|кровь\W*(идет|идёт|течет|течёт|хлещет)",
    r"(сильн\w*|не\s+останавл\w*)[^.!?]{0,30}кровоточ|кровоточ[^.!?]{0,30}(сильн\w*|не\s+останавл\w*)",
    r"\bтравм(?!атолог)",  # «травма», но не «травматолог»/«атравматичное»
    r"\b(опух|отек|отёк|распухл)",
    r"(выбил\w*|сломал\w*|раскол\w*|откол\w*)\W*зуб\w*|зуб\W*[^.!?]{0,20}(выбил|сломал|раскол|откол)\w*",
    r"\bфлюс\b",
]
_URGENT_RE = re.compile("|".join(_URGENT_PATTERNS), re.IGNORECASE)

_HUMAN_PATTERNS = [
    # до двух слов между глаголом и объектом: «позовите, пожалуйста, человека»
    r"(позов|переключ|свяж|соедин)\w*\W+(?:\w+\W+){0,2}(человек\w*|живо\w+|администратор\w*|оператор\w*|менеджер\w*)",
    r"(человека|администратора|оператора)\W+(?:\w+\W+){0,2}позов\w*",
    r"жив(ой|ого|ым|ому)\W+(человек|администратор|оператор)",
    # голое «оператор» — только если это всё сообщение (упоминание сотового
    # оператора в разговоре не должно обрывать анкету)
    r"^\W*оператор\w{0,3}\W*$",
    r"хочу\W+(поговорить\W+с\W+)?(человеком|живым|администратором|оператором)",
    r"(нужен|дайте)\W+(живой\W+)?(человек|администратор|оператор)",
    r"можно\W+(живого\W+)?(человека|администратора|оператора)\b",
]
_HUMAN_RE = re.compile("|".join(_HUMAN_PATTERNS), re.IGNORECASE)

# LLM может вернуть только planned|pain; 'urgent' ставит исключительно
# детерминированный протокол острой боли.
_LLM_URGENCY = {"planned", "pain"}

# После этого запаса сообщений в закрытой сессии бот замолкает совсем.
_CLOSED_GRACE = 5


def detect_urgent(text: str) -> bool:
    return bool(_URGENT_RE.search(_NEG_STRIP_RE.sub(" ", text)))


def detect_human_request(text: str) -> bool:
    return bool(_HUMAN_RE.search(text))


# --- Этап B: детекторы цены / нецелевого / скидки ------------------------------

_PRICE_RE = re.compile(
    r"скольк\w*\s+стоит|сто(и|ю)т\b|\bцен[аыуе]\b|по\s*ч[её]м|прайс|стоимост",
    re.IGNORECASE,
)
_NONTARGET_RE = re.compile(
    # «кредит/рассрочка» намеренно НЕ здесь — это валидный вопрос про оплату лечения.
    r"пицц|такси|доставк\w*\s*(еды|воды|пицц)|ваканси|"
    r"устро\w*\s+на\s+работ|резюме|рекламн\w*\s+предложен|сотруднич\w*|курьер|"
    r"\bремонт\s+(квартир|телефон)",
    re.IGNORECASE,
)
_DISCOUNT_RE = re.compile(
    r"скидк|подешевл|дешевл|бесплатн\w*\s+(сделай|полечи|постав)|"
    r"особ\w*\s+услови|\bакци\w*|промокод|бонус\w*\s+дад",
    re.IGNORECASE,
)


_AGGRO_RE = re.compile(
    r"\b(идиот\w*|дебил\w*|тупо\w*|урод\w*|придур\w*|ненавиж\w*|заткн\w*|"
    r"бесит|достал\w*|ху[ий]\w*|бл[яэ]\w*|су[кч]\w*|пош[её]л\s+ты|мраз\w*)",
    re.IGNORECASE,
)


def detect_aggression(text: str) -> bool:
    return bool(_AGGRO_RE.search(text))


def detect_price_question(text: str) -> bool:
    return bool(_PRICE_RE.search(text))


def detect_nontarget(text: str) -> bool:
    return bool(_NONTARGET_RE.search(text))


def detect_discount(text: str) -> bool:
    return bool(_DISCOUNT_RE.search(text))


@dataclass
class DialogueResult:
    replies: list[str] = field(default_factory=list)
    lead_created: bool = False


class _FloodGuard:
    """Антиспам: > max сообщений за window секунд → пауза с одним предупреждением."""

    def __init__(self, max_messages: int, window_seconds: int):
        self.max = max_messages
        self.window = window_seconds
        self._hits: dict[int, deque] = {}
        self._warned: dict[int, float] = {}

    def check(self, session_id: int) -> str:
        """'ok' | 'warn' (первое превышение) | 'mute' (продолжает флудить)."""
        now = now_msk().timestamp()
        hits = self._hits.setdefault(session_id, deque())
        hits.append(now)
        while hits and now - hits[0] > self.window:
            hits.popleft()
        if len(hits) <= self.max:
            return "ok"
        if now - self._warned.get(session_id, 0) > self.window:
            self._warned[session_id] = now
            return "warn"
        return "mute"


class DialogueEngine:
    def __init__(
        self,
        db: Database,
        llm: BaseLLM,
        clinics: dict[str, Clinic],
        leads: LeadService,
        settings: Settings,
    ):
        self.db = db
        self.llm = llm
        self.clinics = clinics
        self.leads = leads
        self.settings = settings
        self.flood = _FloodGuard(settings.flood_max_messages, settings.flood_window_seconds)
        self._schedules = {
            slug: parse_work_hours(c.work_hours) for slug, c in clinics.items()
        }
        self._locks: dict[int, asyncio.Lock] = {}

    def _lock(self, session_id: int) -> asyncio.Lock:
        return self._locks.setdefault(session_id, asyncio.Lock())

    async def _fresh_session(self, session_id: int) -> dict | None:
        row = await self.db._fetchone(
            "SELECT * FROM sessions WHERE id = ?", (session_id,)
        )
        return dict(row) if row else None

    # --- Публичный API -----------------------------------------------------

    async def start_session(self, session: dict) -> DialogueResult:
        """Приветствие при /start или первом открытии виджета."""
        clinic = self.clinics[session["clinic_slug"]]
        async with self._lock(session["id"]):
            greeting = prompts.fallback_reply("GREETING", clinic)
            await self.db.add_message(session["id"], "assistant", greeting)
            await self.db.update_session(session["id"], state="SERVICE")
            return DialogueResult(replies=[greeting])

    async def handle_message(self, session: dict, text: str) -> DialogueResult:
        text = text.strip()
        if not text:
            return DialogueResult()
        clinic = self.clinics[session["clinic_slug"]]
        session_id = session["id"]

        # Антиспам — до блокировки, БД и LLM. Сообщение с триггером острой
        # боли сквозь паузу пропускаем: его нельзя молча выбросить.
        flood_state = self.flood.check(session_id)
        if flood_state != "ok" and not detect_urgent(text):
            if flood_state == "mute":
                return DialogueResult()
            reply = prompts.fallback_reply("FLOOD", clinic)
            await self.db.add_message(session_id, "assistant", reply)
            return DialogueResult(replies=[reply])

        # Ходы одной сессии — строго по одному: параллельные сообщения
        # затирали бы друг другу поля и состояние.
        async with self._lock(session_id):
            fresh = await self._fresh_session(session_id)
            if fresh is None:
                return DialogueResult()
            return await self._turn(fresh, clinic, text)

    async def request_human_button(self, session: dict) -> DialogueResult:
        """Кнопка «Позвать человека» (Telegram callback или кнопка виджета)."""
        clinic = self.clinics[session["clinic_slug"]]
        async with self._lock(session["id"]):
            fresh = await self._fresh_session(session["id"])
            if fresh is None:
                return DialogueResult()
            if fresh["state"] in ("DONE", "LIMIT"):
                # Лид уже передан (или сессия закрыта) — не плодим дубли
                # от повторных нажатий кнопки.
                reply = (
                    "Ваша заявка уже у администратора — он свяжется с вами. "
                    f"Если вопрос срочный, позвоните: {clinic.phone_display}."
                )
                return await self._reply(fresh["id"], [reply])
            fields = self._session_fields(fresh)
            return await self._human_protocol(fresh, clinic, fields)

    # --- Один ход диалога (под блокировкой сессии) ---------------------------

    async def _turn(self, session: dict, clinic: Clinic, text: str) -> DialogueResult:
        session_id = session["id"]
        count = await self.db.bump_message_count(session_id)
        await self.db.add_message(session_id, "user", text)
        fields = self._session_fields(session)

        # 1. Протокол острой боли — приоритет над всем, включая закрытые
        #    сессии: «у меня кровь идёт» после оформленной заявки — это
        #    новый срочный сигнал клинике.
        if detect_urgent(text):
            return await self._urgent_protocol(session, clinic, fields, text)

        # 2. Закрытые сессии: отвечаем коротко, после запаса — молчим.
        if session["state"] in ("DONE", "LIMIT"):
            if count > self.settings.max_messages_per_session + _CLOSED_GRACE:
                return DialogueResult()
            if session["state"] == "LIMIT":
                reply = prompts.fallback_reply("LIMIT", clinic)
            else:
                reply = (
                    "Ваша заявка уже у администратора — он свяжется с вами. "
                    f"Если вопрос срочный, позвоните: {clinic.phone_display}."
                )
            return await self._reply(session_id, [reply])

        # 3. «Позовите человека» — лид немедленно.
        if detect_human_request(text):
            return await self._human_protocol(session, clinic, fields)

        # 3a. Агрессия/мат → вежливая эскалация человеку, пометка в карточке.
        if detect_aggression(text):
            return await self._human_protocol(session, clinic, fields)

        # 3b. Нецелевой запрос (пицца/кредит/вакансия…) — вежливый отказ,
        #     статус «нецелевой». Только пока не поняли услугу.
        if detect_nontarget(text) and not fields.get("service"):
            return await self._nontarget_protocol(session, clinic, fields)

        # 3c. Вопрос цены — диапазон из прайса + слот на консультацию (не обрывая анкету).
        if detect_price_question(text):
            return await self._price_protocol(session, clinic, fields, text)

        # 3d. Требование скидки/особых условий — Анна не обещает, переадресует
        #     администратору; карточка потом помечается.
        if detect_discount(text):
            return await self._discount_protocol(session, clinic, fields)

        # 4. Лимит сообщений на сессию: честное завершение с телефоном
        #    клиники. Если телефон уже собран — отдаём клинике частичный лид,
        #    чтобы она перезвонила сама.
        if count > self.settings.max_messages_per_session:
            await self.db.update_session(session_id, state="LIMIT", is_closed=1)
            result = DialogueResult()
            if fields.get("phone"):
                session = {**session, "state": "LIMIT"}
                await self.leads.submit(session, fields)
                result.lead_created = True
            reply = prompts.fallback_reply("LIMIT", clinic)
            replies = await self._reply(session_id, [reply])
            result.replies = replies.replies
            return result

        # 5. Валидация телефона в коде — LLM не доверяем.
        step = session["state"]
        if step == "PHONE":
            phone = normalize_phone(text)
            if phone:
                fields["phone"] = phone
                step = self._next_step(fields)
                await self.db.update_session(session_id, state=step, fields=fields)
                session = {**session, "state": step}
                if step == "CONFIRM":
                    return await self._confirm(session, clinic, fields)
                reply = await self._step_reply(session, clinic, step)
                return await self._reply(session_id, [reply])
            if looks_like_phone_attempt(text):
                reply = await self._llm_reply(session, clinic, "PHONE_RETRY")
                return await self._reply(session_id, [reply])
            # Не похоже на номер — пациент, вероятно, спросил что-то ещё:
            # пусть ответит LLM, шаг не меняем.

        # 6. Обычный ход: LLM извлекает поля и формулирует ответ.
        return await self._llm_turn(session, clinic, fields, step)

    # --- Протоколы -----------------------------------------------------------

    async def _urgent_protocol(
        self, session: dict, clinic: Clinic, fields: dict, text: str
    ) -> DialogueResult:
        reply = prompts.fallback_reply("URGENT", clinic)
        # При острой боли — сразу телефон/103 И ближайшее окно (ТЗ #4).
        slots = next_slots_text(clinic, now_msk(), 1)
        if slots:
            reply += f" Ближайшее свободное окно — {slots[0]}, придержим для вас."
        # Повторный срочный сигнал в уже оповещённой сессии — только реплика
        # с телефоном, без дублирующего лида в группу.
        if fields.get("urgency") == "urgent":
            return await self._reply(session["id"], [reply])
        # Вдруг в этом же сообщении есть телефон — заберём в лид.
        phone = normalize_phone(text)
        if phone:
            fields["phone"] = phone
        fields["urgency"] = "urgent"
        if not fields.get("service"):
            fields["service"] = "не уточнена (острая боль)"
        await self.db.update_session(session["id"], state="DONE", fields=fields)
        await self.leads.submit(session, fields, is_urgent=True)
        result = await self._reply(session["id"], [reply])
        result.lead_created = True
        return result

    async def _human_protocol(
        self, session: dict, clinic: Clinic, fields: dict
    ) -> DialogueResult:
        await self.db.update_session(session["id"], state="DONE", fields=fields)
        await self.leads.submit(session, fields, wants_human=True)
        reply = prompts.fallback_reply("HUMAN", clinic)
        result = await self._reply(session["id"], [reply])
        result.lead_created = True
        return result

    async def _confirm(self, session: dict, clinic: Clinic, fields: dict) -> DialogueResult:
        # Ручной режим: создаём заявку в статусе pending. Финальное подтверждение
        # пациенту уходит ТОЛЬКО после тапа администратора «Подтвердить».
        is_night = not self._schedules[clinic.slug].is_open(now_msk())
        discount = bool(fields.get("discount_asked"))
        await self.db.update_session(session["id"], state="DONE", fields=fields)
        await self.leads.submit(
            session,
            fields,
            is_night=is_night,
            status="pending",
            wants_callback=discount,
            summary="Просил скидку/особые условия — переадресовано администратору" if discount else None,
        )
        goal = "CONFIRM_NIGHT" if is_night else "CONFIRM"
        reply = await self._llm_reply(session, clinic, goal)
        result = await self._reply(session["id"], [reply])
        result.lead_created = True
        return result

    # --- Этап B: детерминированные протоколы цены / нецелевого / скидки --------

    def _match_service(self, clinic: Clinic, text: str):
        low = text.lower()
        for s in clinic.services:
            head = s.name.lower().split()[0][:5]
            if head and head in low:
                return s
        # частые синонимы
        if "имплант" in low:
            return next((s for s in clinic.services if "имплант" in s.name.lower()), None)
        if "чистк" in low or "гигиен" in low:
            return next((s for s in clinic.services if "гигиен" in s.name.lower()), None)
        return None

    def _price_text(self, clinic: Clinic, service) -> str:
        if service and service.price_from and service.price_to:
            return f"Ориентир по услуге «{service.name}»: {service.price_from}–{service.price_to} ₽."
        if service and service.price_from:
            return f"«{service.name}» — от {service.price_from} ₽."
        return "По этой услуге точную стоимость назовёт врач на осмотре."

    async def _price_protocol(self, session, clinic: Clinic, fields, text) -> DialogueResult:
        service = self._match_service(clinic, text)
        price = self._price_text(clinic, service)
        slots = ", ".join(next_slots_text(clinic, now_msk(), 2)) or "ближайшее удобное время"
        reply = (
            f"{price} Точную стоимость назовёт врач на осмотре — приходите на консультацию. "
            f"Есть время: {slots}. Как вас зовут?"
        )
        if service and not fields.get("service"):
            fields["service"] = service.name
            await self.db.update_session(session["id"], fields=fields)
        return await self._reply(session["id"], [reply])

    async def _nontarget_protocol(self, session, clinic: Clinic, fields) -> DialogueResult:
        await self.db.update_session(session["id"], state="DONE", fields=fields)
        await self.leads.submit(session, fields, status="nontarget", summary="Нецелевой запрос")
        reply = (
            f"Мы стоматология «{clinic.name}» — с этим, к сожалению, не поможем. "
            f"Если нужна стоматологическая помощь, подскажу и запишу."
        )
        result = await self._reply(session["id"], [reply])
        result.lead_created = True
        return result

    async def _discount_protocol(self, session, clinic: Clinic, fields) -> DialogueResult:
        fields["discount_asked"] = True
        await self.db.update_session(session["id"], fields=fields)
        reply = (
            "По скидкам и особым условиям решает администратор — обязательно передам "
            "ему ваш вопрос. А пока подберём удобное время? Как вас зовут?"
        )
        return await self._reply(session["id"], [reply])

    # --- LLM ------------------------------------------------------------------

    async def _llm_turn(
        self, session: dict, clinic: Clinic, fields: dict, step: str
    ) -> DialogueResult:
        history = await self.db.recent_messages(
            session["id"], self.settings.history_window
        )
        try:
            result = await self.llm.generate(
                system=prompts.build_system_prompt(clinic, step),
                history=history,
                extract=True,
                max_tokens=self.settings.max_response_tokens,
            )
        except Exception as e:
            logger.error("LLM недоступен (сессия {}): {}", session["id"], e)
            reply = prompts.fallback_reply(step, clinic)
            return await self._reply(session["id"], [reply])

        if result.fields:
            fields = self._merge_fields(fields, result.fields)
        new_step = self._next_step(fields)
        await self.db.update_session(session["id"], state=new_step, fields=fields)
        session = {**session, "state": new_step}

        if new_step == "CONFIRM":
            return await self._confirm(session, clinic, fields)

        if result.text and new_step == step:
            reply = result.text
        else:
            # Поля продвинули шаг вперёд (или модель вернула только function
            # call) — формулируем реплику уже под новую цель.
            reply = await self._step_reply(session, clinic, new_step)
        return await self._reply(session["id"], [reply])

    async def _step_reply(self, session: dict, clinic: Clinic, step: str) -> str:
        """Реплика под цель шага. Для TIME предлагаем 2–3 конкретных слота."""
        if step == "TIME":
            slots = ", ".join(next_slots_text(clinic, now_msk(), 3))
            if slots:
                return (
                    f"Когда удобно прийти? Ближайшее свободное время: {slots}. "
                    f"Или напишите свой вариант."
                )
        return await self._llm_reply(session, clinic, step)

    async def _llm_reply(self, session: dict, clinic: Clinic, goal: str) -> str:
        history = await self.db.recent_messages(
            session["id"], self.settings.history_window
        )
        try:
            result = await self.llm.generate(
                system=prompts.build_system_prompt(clinic, goal),
                history=history,
                extract=False,
                max_tokens=self.settings.max_response_tokens,
            )
            if result.text:
                return result.text
        except Exception as e:
            logger.error("LLM недоступен (сессия {}): {}", session["id"], e)
        return prompts.fallback_reply(goal, clinic)

    # --- Вспомогательное --------------------------------------------------------

    def _merge_fields(self, current: dict, extracted: dict) -> dict:
        return qualifier.merge_fields(current, extracted)

    def _next_step(self, fields: dict) -> str:
        for key, step in FIELD_ORDER:
            if not fields.get(key):
                return step
        return "CONFIRM"

    def _session_fields(self, session: dict) -> dict:
        raw = session.get("fields_json") or "{}"
        return json.loads(raw) if isinstance(raw, str) else dict(raw)

    async def _reply(self, session_id: int, replies: list[str]) -> DialogueResult:
        for r in replies:
            await self.db.add_message(session_id, "assistant", r)
        return DialogueResult(replies=replies)
