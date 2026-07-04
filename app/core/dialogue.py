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

from app.config import Clinic, Settings, parse_work_hours
from app.core import prompts
from app.core.llm_base import BaseLLM
from app.db import Database
from app.leads import LeadService
from app.redaction import anonymize_history
from app.scheduler import slots_text
from app.utils import looks_like_phone_attempt, normalize_phone, now_msk

# На этих шагах Анне подмешиваем конкретные свободные окна (scheduler_lite).
_SLOT_STEPS = {"URGENCY", "TIME", "CONFIRM", "CONFIRM_NIGHT"}

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

# Требование скидки: Анна не торгуется и не обещает — переадресует администратору.
_DISCOUNT_RE = re.compile(
    r"скидк\w*|подешевл\w*|дешевл\w*|поторг\w*|\bторг\b|снизь\w*\s+цен|сделай\w*\s+дешев",
    re.IGNORECASE,
)

# Нецелевой запрос (не про стоматологию): вежливый отказ + пометка.
_OFFTOPIC_RE = re.compile(
    r"пицц\w*|такси|достав\w+\s+еды|курьер|кредит\w*|займ\w*|ставк\w*|казино|"
    r"ваканси\w*|работа\w*\s+у\s+вас|трудоустр\w*|реклам\w*\s+услуг|прода(м|ю|ть)\b",
    re.IGNORECASE,
)


def detect_discount(text: str) -> bool:
    return bool(_DISCOUNT_RE.search(text))


def detect_offtopic(text: str) -> bool:
    return bool(_OFFTOPIC_RE.search(text))

# LLM может вернуть только planned|pain; 'urgent' ставит исключительно
# детерминированный протокол острой боли.
_LLM_URGENCY = {"planned", "pain"}

# После этого запаса сообщений в закрытой сессии бот замолкает совсем.
_CLOSED_GRACE = 5


def _looks_like_name(text: str) -> bool:
    """Ответ на «как вас зовут» похож на имя (собираем детерминированно, без LLM)."""
    t = text.strip()
    if not t or len(t) > 40 or "?" in t:
        return False
    return any(ch.isalpha() for ch in t)


def detect_urgent(text: str) -> bool:
    return bool(_URGENT_RE.search(_NEG_STRIP_RE.sub(" ", text)))


def detect_human_request(text: str) -> bool:
    return bool(_HUMAN_RE.search(text))


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

        # 3b. Требование скидки — Анна не торгуется и не обещает: переадресует
        #     администратору, помечает заявку. Шаг не двигаем.
        if detect_discount(text):
            fields["discount_requested"] = True
            await self.db.update_session(session_id, fields=fields)
            reply = prompts.fallback_reply("DISCOUNT", clinic)
            return await self._reply(session_id, [reply])

        # 3c. Нецелевой запрос (не про стоматологию) — вежливый отказ, лид не создаём.
        if detect_offtopic(text):
            reply = prompts.fallback_reply("OFFTOPIC", clinic)
            return await self._reply(session_id, [reply])

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

        step = session["state"]

        # 5a. Имя собираем ДЕТЕРМИНИРОВАННО (не через LLM): ФИО не должно уходить
        #     в GigaChat (соглашение о ПДн). Ответ на «как вас зовут» = имя.
        if step == "NAME" and _looks_like_name(text):
            fields["name"] = text.strip()
            step = self._next_step(fields)
            await self.db.update_session(session_id, state=step, fields=fields)
            # Локальную сессию тоже обновляем — чтобы обезличивание истории для LLM
            # уже знало имя и вырезало его из свежесобранной реплики.
            session = {**session, "state": step, "fields_json": json.dumps(fields, ensure_ascii=False)}
            if step == "CONFIRM":
                return await self._confirm(session, clinic, fields)
            reply = await self._llm_reply(session, clinic, step)
            return await self._reply(session_id, [reply])

        # 5b. Валидация телефона в коде — LLM не доверяем (и номер в модель не шлём).
        if step == "PHONE":
            phone = normalize_phone(text)
            if phone:
                fields["phone"] = phone
                step = self._next_step(fields)
                await self.db.update_session(session_id, state=step, fields=fields)
                session = {**session, "state": step}
                if step == "CONFIRM":
                    return await self._confirm(session, clinic, fields)
                reply = await self._llm_reply(session, clinic, step)
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
        is_night = not self._schedules[clinic.slug].is_open(now_msk())
        await self.db.update_session(session["id"], state="DONE", fields=fields)
        # Ручной режим: плановая заявка ждёт подтверждения администратором (pending).
        await self.leads.submit(session, fields, is_night=is_night, status="pending")
        goal = "CONFIRM_NIGHT" if is_night else "CONFIRM"
        reply = await self._llm_reply(session, clinic, goal)
        result = await self._reply(session["id"], [reply])
        result.lead_created = True
        return result

    # --- LLM ------------------------------------------------------------------

    def _build_system(self, clinic: Clinic, step: str) -> str:
        """Системный промпт шага + свободные окна (для TIME/URGENCY предлагаем слоты)."""
        slots = None
        if step in _SLOT_STEPS:
            slots = slots_text(self._schedules[clinic.slug], now_msk())
        return prompts.build_system_prompt(clinic, step, slots=slots)

    async def _history_for_llm(self, session: dict, fields: dict) -> list[dict]:
        """История для GigaChat — ОБЕЗЛИЧЕННАЯ: телефон/имя/диагнозы вырезаны.
        ФИО и номер остаются только в локальной SQLite, в модель не уходят."""
        history = await self.db.recent_messages(
            session["id"], self.settings.history_window
        )
        return anonymize_history(history, fields.get("name"))

    async def _llm_turn(
        self, session: dict, clinic: Clinic, fields: dict, step: str
    ) -> DialogueResult:
        history = await self._history_for_llm(session, fields)
        try:
            result = await self.llm.generate(
                system=self._build_system(clinic, step),
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
            reply = await self._llm_reply(session, clinic, new_step)
        return await self._reply(session["id"], [reply])

    async def _llm_reply(self, session: dict, clinic: Clinic, goal: str) -> str:
        history = await self._history_for_llm(session, self._session_fields(session))
        try:
            result = await self.llm.generate(
                system=self._build_system(clinic, goal),
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
        merged = dict(current)
        for key in ("service", "urgency", "name", "phone", "preferred_time"):
            value = extracted.get(key)
            if not value or not str(value).strip():
                continue
            value = str(value).strip()
            if key == "phone":
                phone = normalize_phone(value)
                if phone:
                    merged["phone"] = phone
                continue
            if key == "urgency":
                if value in _LLM_URGENCY:
                    merged["urgency"] = value
                continue
            merged[key] = value
        return merged

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
