"""Счётчик надёжности: дни подряд, когда каждое обращение получило ответ.

Инцидент = обращение (пропущенный/лид), где ВСЕ каналы доставки упали. Их мы
пишем в таблицу incidents. Streak — дни от последнего инцидента до сегодня;
рекорд — самый длинный такой промежуток за всю историю.
"""

from __future__ import annotations

from datetime import date, datetime

from app.db import Database
from app.utils import now_msk


def _day(ts: str) -> date:
    return datetime.strptime(ts[:10], "%Y-%m-%d").date()


async def compute_streak(db: Database, clinic_slug: str) -> dict:
    today = now_msk().date()
    rows = await db._fetchall(
        "SELECT occurred_at, resolved_in_minutes FROM incidents"
        " WHERE clinic_slug = ? ORDER BY occurred_at",
        (clinic_slug,),
    )
    incident_days = [_day(r["occurred_at"]) for r in rows]

    first_activity_ts = await db.clinic_first_activity(clinic_slug)
    start_day = _day(first_activity_ts) if first_activity_ts else today

    if not incident_days:
        current = (today - start_day).days
        return {
            "current_streak_days": max(0, current),
            "record_days": max(0, current),
            "last_incident": None,
        }

    last = incident_days[-1]
    current = (today - last).days

    # Рекорд — максимальный промежуток без инцидентов за историю.
    record = 0
    prev = start_day
    for d in incident_days:
        record = max(record, (d - prev).days)
        prev = d
    record = max(record, current)

    last_row = rows[-1]
    return {
        "current_streak_days": max(0, current),
        "record_days": max(0, record),
        "last_incident": {
            "date": last_row["occurred_at"][:10],
            "resolved_in_minutes": last_row["resolved_in_minutes"],
        },
    }
