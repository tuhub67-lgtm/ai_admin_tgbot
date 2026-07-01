"""Движок диалога: гибрид state machine + LLM.

State machine держит ЦЕЛЬ шага (какое поле заявки добираем), LLM формулирует
реплики и через function calling извлекает поля из свободного текста.

Порядок шагов: GREETING → SERVICE → URGENCY → NAME → PHONE → TIME → CONFIRM.

Детерминированные контуры, которые НЕ доверены LLM:
- протокол острой боли (триггеры по ключевым словам, лид 🔴 СРОЧНО немедленно);
- «позовите человека» → лид «просит живого» немедленно;
- валидация телефона (+7/8 + 10 цифр, мягкий переспрос);
- антиспам (>N сообщений за окно → пауза) и лимит сообщений на сессию.
"""

from __future__ import annotations

import re
from collections import deque
from dataclasses import dataclass, field

from loguru import logger

from app.config import Clinic, Settings, parse_work_hours
from app.core import prompts
from app.core.llm_base import BaseLLM
from app.db import Database
from app.leads import LeadService
from app.utils import looks_like_phone_attempt, normalize_phone, now_msk

# Поля заявки в порядке заполнения; шаг = первое незаполненное поле.
FIELD_ORDER = [
    ("service", "SERVICE"),
    ("urgency", "URGENCY"),
    ("name", "NAME"),
    ("phone", "PHONE"),
    ("preferred_time", "TIME"),
]

_URGENT_PATTERNS = [
    r"остр(ая|о|ый|ейшая)?\W*бол",
    r"болит[^.!?]{0,40}(сейчас|прямо|сил[ьн]|ужасно|невыносимо)",
    r"(сейчас|прямо|сил[ьн]но|ужасно|невыносимо)[^.!?]{0,40}болит",
    r"невыносим",
    r"кровотеч|кровоточ|(идет|идёт|течет|течёт|хлещет)\W*кровь|кровь\W*(идет|идёт|течет|течёт)",
    r"травм",
    r"опух|отек|отёк|распухл",
    r"(выбил|сломал|раскололся|откололся)\W*зуб",
    r"\bфлюс\b",
]
_URGENT_RE = re.compile("|".join(_URGENT_PATTERNS), re.IGNORECASE)

_HUMAN_PATTERNS = [
    r"позов\w*\W+(человек|живо\w+|администратор|оператор|менеджер)",
    r"жив(ой|ого|ым|ому)\W+(человек|администратор|оператор)",
    r"\bоператор\w{0,3}\b",
    r"хочу\W+(поговорить\W+с\W+)?(человеком|живым|администратором)",
    r"соедини\w*\W+с\W+(человеком|администратором|оператором)",
    r"(нужен|дайте)\W+(живой\W+)?(человек|администратор|оператор)",
    r"можно\W+(живого\W+)?(человека|администратора|оператора)\b",
]
_HUMAN_RE = re.compile("|".join(_HUMAN_PATTERNS), re.IGNORECASE)

_VALID_URGENCY = {"planned", "pain", "urgent"}


def detect_urgent(text: str) -> bool:
    return bool(_URGENT_RE.search(text))


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

    # --- Публичный API -----------------------------------------------------

    async def start_session(self, session: dict) -> DialogueResult:
        """Приветствие при /start или первом открытии виджета."""
        clinic = self.clinics[session["clinic_slug"]]
        greeting = prompts.fallback_reply("GREETING", clinic)
        await self.db.add_message(session["id"], "assistant", greeting)
        await self.db.update_session(session["id"], state="SERVICE")
        return DialogueResult(replies=[greeting])

    async def handle_message(self, session: dict, text: str) -> DialogueResult:
        clinic = self.clinics[session["clinic_slug"]]
        session_id = session["id"]
        text = text.strip()
        if not text:
            return DialogueResult()

        # 1. Антиспам — до любых записей в БД и вызовов LLM.
        flood_state = self.flood.check(session_id)
        if flood_state == "mute":
            return DialogueResult()
        if flood_state == "warn":
            reply = prompts.fallback_reply("FLOOD", clinic)
            await self.db.add_message(session_id, "assistant", reply)
            return DialogueResult(replies=[reply])

        count = await self.db.bump_message_count(session_id)
        await self.db.add_message(session_id, "user", text)
        fields = self._session_fields(session)

        # 2. Заявка уже передана — не гоняем LLM, отвечаем коротко.
        if session["state"] == "DONE":
            reply = (
                "Ваша заявка уже у администратора — он свяжется с вами. "
                f"Если вопрос срочный, позвоните: {clinic.phone_display}."
            )
            return await self._reply(session_id, [reply])

        # 3. Протокол острой боли — приоритет над всем остальным.
        if detect_urgent(text):
            return await self._urgent_protocol(session, clinic, fields, text)

        # 4. «Позовите человека» — лид немедленно.
        if detect_human_request(text):
            return await self._human_protocol(session, clinic, fields)

        # 5. Лимит сообщений на сессию.
        if count > self.settings.max_messages_per_session:
            await self.db.update_session(session_id, state="DONE", is_closed=1)
            reply = prompts.fallback_reply("LIMIT", clinic)
            return await self._reply(session_id, [reply])

        # 6. Валидация телефона в коде — LLM не доверяем.
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
                reply = await self._llm_reply(session, clinic, step)
                return await self._reply(session_id, [reply])
            if looks_like_phone_attempt(text):
                reply = await self._llm_reply(session, clinic, "PHONE_RETRY")
                return await self._reply(session_id, [reply])
            # Не похоже на номер — пациент, вероятно, спросил что-то ещё:
            # пусть ответит LLM, шаг не меняем.

        # 7. Обычный ход: LLM извлекает поля и формулирует ответ.
        return await self._llm_turn(session, clinic, fields, step)

    async def request_human_button(self, session: dict) -> DialogueResult:
        """Кнопка «Позвать человека» (Telegram callback или кнопка виджета)."""
        clinic = self.clinics[session["clinic_slug"]]
        fields = self._session_fields(session)
        return await self._human_protocol(session, clinic, fields)

    # --- Протоколы -----------------------------------------------------------

    async def _urgent_protocol(
        self, session: dict, clinic: Clinic, fields: dict, text: str
    ) -> DialogueResult:
        # Вдруг в этом же сообщении есть телефон — заберём в лид.
        phone = normalize_phone(text)
        if phone:
            fields["phone"] = phone
        fields["urgency"] = "urgent"
        if not fields.get("service"):
            fields["service"] = "не уточнена (острая боль)"
        await self.db.update_session(session["id"], state="DONE", fields=fields)
        await self.leads.submit(session, fields, is_urgent=True)
        reply = prompts.fallback_reply("URGENT", clinic)
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
        await self.leads.submit(session, fields, is_night=is_night)
        goal = "CONFIRM_NIGHT" if is_night else "CONFIRM"
        reply = await self._llm_reply(session, clinic, goal)
        result = await self._reply(session["id"], [reply])
        result.lead_created = True
        return result

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
            reply = await self._llm_reply(session, clinic, new_step)
        return await self._reply(session["id"], [reply])

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
                if value in _VALID_URGENCY:
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
        import json

        raw = session.get("fields_json") or "{}"
        return json.loads(raw) if isinstance(raw, str) else dict(raw)

    async def _reply(self, session_id: int, replies: list[str]) -> DialogueResult:
        for r in replies:
            await self.db.add_message(session_id, "assistant", r)
        return DialogueResult(replies=replies)
