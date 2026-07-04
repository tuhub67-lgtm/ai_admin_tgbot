"""Один follow-up молчащему пациенту через N часов — и больше никогда.

Пациент начал диалог, но замолчал, не оставив заявку → через 2 часа Анна один
раз мягко напоминает о себе. Повторно НЕ пишем (флаг followup_sent в fields).
Активные шаги: сессия не закрыта, не в DONE/LIMIT, без созданного лида.
"""

from __future__ import annotations

import json
from datetime import timedelta

from loguru import logger

from app.config import Clinic
from app.db import Database
from app.utils import now_msk

FOLLOWUP_TEXT = (
    "Это Анна из клиники «{name}». Вы начинали запись — подсказать свободное время "
    "или ответить на вопрос? Если уже не актуально, просто не отвечайте 🙂"
)


async def pending_followups(db: Database, idle_hours: int = 2) -> list[dict]:
    cutoff = (now_msk() - timedelta(hours=idle_hours)).strftime("%Y-%m-%d %H:%M:%S")
    rows = await db._fetchall(
        "SELECT s.* FROM sessions s"
        " WHERE s.is_closed = 0 AND s.state NOT IN ('DONE', 'LIMIT', 'GREETING')"
        " AND s.message_count > 0 AND s.updated_at < ?"
        " AND s.fields_json NOT LIKE '%\"followup_sent\"%'"
        " AND NOT EXISTS (SELECT 1 FROM leads l WHERE l.session_id = s.id)",
        (cutoff,),
    )
    return [dict(r) for r in rows]


async def run_followups(
    db: Database, clinics: dict[str, Clinic], senders: dict, idle_hours: int = 2
) -> int:
    """senders: {channel: async fn(external_id, text) -> None}. Возвращает число
    отправленных follow-up. Идемпотентно: помечает followup_sent сразу."""
    sent = 0
    for s in await pending_followups(db, idle_hours):
        clinic = clinics.get(s["clinic_slug"])
        if clinic is None:
            continue
        fields = json.loads(s.get("fields_json") or "{}")
        fields["followup_sent"] = True
        await db.update_session(s["id"], fields=fields)  # метим ДО отправки — без дублей
        text = FOLLOWUP_TEXT.format(name=clinic.name)
        await db.add_message(s["id"], "assistant", text)
        send = senders.get(s["channel"])
        if send is not None:
            try:
                await send(s["external_id"], text)
            except Exception as e:  # noqa: BLE001
                logger.error("Follow-up не доставлен (сессия {}): {}", s["id"], e)
        sent += 1
    return sent
