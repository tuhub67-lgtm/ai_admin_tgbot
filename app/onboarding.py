"""Тест-прогон онбординга «Позвонить самому себе» — настоящий диалог Анны.

Владелец в мастере подключения жмёт кнопку — бэкенд МОДЕЛИРУЕТ пропущенный
звонок с тестового номера и прогоняет реальный диалог через движок: реплики
Анны генерирует GigaChat потоково (client.achat.stream) по ТЕКУЩЕМУ промпту
клиники (часы/прайс/тон из онбординга). Сценарий «пациента» фиксирован — живого
пациента нет, это самопроверка; слова Анны при этом не сценарные.

ПДн: тестовый номер и имя в GigaChat НЕ уходят — история обезличивается тем же
redaction, что и в бою (см. app.redaction / DialogueEngine._history_for_llm).
Имя/телефон остаются только в локальной SQLite.

Итог прогона — карточка-заявка со статусом pending в ленте «Сегодня» (без
рассылки в Telegram-группу клиники: это тест). Если GigaChat недоступен или
упёрся в лимит — показываем запасную реплику Анны и не падаем.

Оркестратор — async-генератор SSE-событий:
    {"type": "info",       "text": str}          — строка-нарратор
    {"type": "patient",    "text": str}          — реплика «пациента»
    {"type": "anna_start"}                        — начало реплики Анны
    {"type": "anna_delta", "text": str}          — дельта текста Анны (поток)
    {"type": "anna_end",   "text": str, "fallback": bool}
    {"type": "card",       "lead": dict}          — созданная pending-заявка
    {"type": "done",       "fallback": bool}      — прогон завершён
"""

from __future__ import annotations

import asyncio
import json

from loguru import logger

from app.config import Clinic
from app.core import prompts
from app.core.dialogue import DialogueEngine
from app.leads import estimate_sum
from app.utils import normalize_phone, now_msk

# Обезличенный тестовый контакт: в GigaChat не уходит (redaction), живёт только
# в локальной карточке. Канал/источник помечены как test — это не реальный лид.
TEST_CHANNEL = "test"
TEST_SOURCE = "test"
TEST_EXTERNAL_PREFIX = "onboarding-test"
_TEST_NAME = "Мария"
_TEST_PHONE = "+7 900 123-45-67"

# Сценарий «пациента» (самопроверка — живого пациента нет). Каждая реплика
# заполняет одно поле анкеты в порядке FSM; ответы Анны на них — настоящие.
_PATIENT_SCRIPT = [
    {"text": "Здравствуйте! Звонила записаться, но не дозвонилась. "
             "Хотела бы на профгигиену, чистку.", "sets": "service"},
    {"text": "Планово, ничего не беспокоит.", "sets": "urgency", "value": "planned"},
    {"text": f"Меня зовут {_TEST_NAME}.", "sets": "name"},
    {"text": _TEST_PHONE, "sets": "phone"},
    {"text": "Удобно завтра в первой половине дня.", "sets": "preferred_time"},
]


def _match_service(clinic: Clinic, text: str) -> str:
    """Услуга из текущего прайса клиники по реплике пациента (для карточки)."""
    low = text.lower()
    for s in clinic.services:
        if s.name.lower() in low:
            return s.name
    if "чистк" in low or "гигиен" in low:
        for s in clinic.services:
            if "гигиен" in s.name.lower():
                return s.name
    return clinic.services[0].name if clinic.services else "Консультация"


def _public_lead(lead: dict) -> dict:
    """Карточка лида для UI (форма совпадает с app.api._lead_public)."""
    return {
        "id": lead["id"],
        "name": lead.get("name"),
        "phone": lead.get("phone"),
        "service": lead.get("service"),
        "preferred_time": lead.get("preferred_time"),
        "slot": lead.get("slot"),
        "urgency": lead.get("urgency"),
        "status": lead.get("status"),
        "is_urgent": bool(lead.get("is_urgent")),
        "is_night": bool(lead.get("is_night")),
        "est_sum": lead.get("est_sum"),
        "source": lead.get("source"),
        "channel": lead.get("channel"),
        "resume": lead.get("resume"),
        "recovered_from_miss": bool(lead.get("recovered_from_miss")),
        "created_at": lead.get("created_at"),
    }


async def _emit_anna(engine: DialogueEngine, session: dict, clinic: Clinic, goal: str):
    """Стримит одну реплику Анны, yield-ит SSE-события и сохраняет её в БД.
    Финальный anna_end несёт fallback=True, если ответ пришлось взять запасной
    (GigaChat недоступен/лимит/пустой ответ) — вызывающий это агрегирует."""
    db = engine.db
    yield {"type": "anna_start"}
    full = ""
    ok = True
    try:
        async for delta in engine.stream_reply(session, clinic, goal):
            full += delta
            yield {"type": "anna_delta", "text": delta}
    except Exception as e:  # noqa: BLE001
        ok = False
        logger.warning("Тест-прогон: GigaChat недоступен на шаге {}: {}", goal, e)
    if not full.strip():
        # Пусто (сбой/лимит/пустой ответ) — Анна не молчит: запасная реплика.
        ok = False
        full = prompts.fallback_reply(goal, clinic)
        yield {"type": "anna_delta", "text": full}
    await db.add_message(session["id"], "assistant", full)
    yield {"type": "anna_end", "text": full, "fallback": not ok}


async def _create_pending_lead(
    engine: DialogueEngine, session: dict, clinic: Clinic, fields: dict, is_night: bool
) -> dict:
    """Создаёт демо-заявку pending напрямую в SQLite — БЕЗ рассылки в группу
    клиники (это тест). Деньги она не накручивает: возвращённые ₽ считаются
    только по confirmed/booked."""
    est = estimate_sum(clinic, fields.get("service"))
    resume = "🧪 Тест-прогон Анны из онбординга — можно подтвердить или отметить потерянным."
    lead_id = await engine.db.create_lead(
        session,
        fields,
        is_night=is_night,
        status="pending",
        est_sum=est,
        resume=resume,
        recovered_from_miss=True,
    )
    lead = await engine.db.get_lead(lead_id, clinic.slug)
    logger.info("Тест-прогон онбординга: создана pending-заявка #{} ({})", lead_id, clinic.slug)
    return _public_lead(lead)


async def run_test_run(engine: DialogueEngine, clinic: Clinic, *, pause: float = 0.35):
    """Прогоняет тестовый диалог и yield-ит SSE-события (см. модульный docstring).

    pause — пауза перед репликой «пациента» для читаемости в UI (в тестах 0)."""
    db = engine.db
    slug = clinic.slug
    external_id = f"{TEST_EXTERNAL_PREFIX}:{slug}"
    # Свежая тестовая сессия на каждый прогон (перетираем прошлую).
    session = await db.reset_session(slug, TEST_CHANNEL, external_id, TEST_SOURCE)
    session_id = session["id"]

    yield {
        "type": "info",
        "text": "Смоделировали пропущенный звонок с тестового номера — Анна перезванивает…",
    }

    fields: dict = {}
    fallback_used = False

    # Приветствие Анны (перезвон после пропущенного).
    async for ev in _emit_anna(engine, session, clinic, "GREETING"):
        fallback_used = fallback_used or bool(ev.get("fallback"))
        yield ev

    for turn in _PATIENT_SCRIPT:
        if pause:
            await asyncio.sleep(pause)
        text = turn["text"]
        await db.add_message(session_id, "user", text)
        yield {"type": "patient", "text": text}

        # Детерминированный захват поля. Имя/телефон — БЕЗ LLM: ПДн в GigaChat
        # не уходят (движок в бою фиксирует их так же).
        sets = turn["sets"]
        if sets == "service":
            fields["service"] = _match_service(clinic, text)
        elif sets == "urgency":
            fields["urgency"] = turn.get("value", "planned")
        elif sets == "name":
            fields["name"] = _TEST_NAME
        elif sets == "phone":
            fields["phone"] = normalize_phone(text) or _TEST_PHONE
        elif sets == "preferred_time":
            fields["preferred_time"] = text.strip()

        goal = engine._next_step(fields)
        # Персистим сразу: обезличивание истории для LLM должно уже знать имя
        # и вырезать его из свежесобранной реплики (session["fields_json"]).
        await db.update_session(session_id, state=goal, fields=fields)
        session = {
            **session,
            "state": goal,
            "fields_json": json.dumps(fields, ensure_ascii=False),
        }

        if goal == "CONFIRM":
            is_night = not engine._schedules[slug].is_open(now_msk())
            confirm_goal = "CONFIRM_NIGHT" if is_night else "CONFIRM"
            async for ev in _emit_anna(engine, session, clinic, confirm_goal):
                fallback_used = fallback_used or bool(ev.get("fallback"))
                yield ev
            lead = await _create_pending_lead(engine, session, clinic, fields, is_night)
            yield {"type": "card", "lead": lead}
            break

        async for ev in _emit_anna(engine, session, clinic, goal):
            fallback_used = fallback_used or bool(ev.get("fallback"))
            yield ev

    yield {"type": "done", "fallback": fallback_used}
