"""Еженедельный отчёт владельцу: обращений / записано / возвращено ₽ + окупаемость.

Cron: понедельник 09:00 МСК (авто-отправка в личку владельцу). Ручная команда
/week у бота вызывает тот же билдер.
"""

from __future__ import annotations

from app.config import Clinic
from app.db import Database
from app.money import weekly_money


async def build_weekly_report(db: Database, clinic: Clinic) -> str:
    money = await weekly_money(db, clinic.slug, days=7)
    obrasheny = await db.count_leads(clinic.slug, 7)
    zapisano = await db.count_booked(clinic.slug, 7)
    missed = await _missed_week(db, clinic.slug)

    lines = [
        f"📊 Итоги недели — {clinic.name}",
        f"Обращений: {obrasheny}",
        f"Перехвачено пропущенных: {missed}",
        f"Записано: {zapisano}",
        f"Возвращено: ≈ {money['total']} ₽",
    ]
    if money["payback_day"]:
        lines.append(f"✅ Пилот окупился {money['payback_day']}")
    elif not money["pilot_paid_back"]:
        lines.append(f"Пилот пока не окупился (нужно ≈ {money['pilot_price']} ₽)")
    return "\n".join(lines)


async def _missed_week(db: Database, clinic_slug: str) -> int:
    from app.db import _ts

    return await db._scalar(
        "SELECT COUNT(*) FROM missed_calls WHERE clinic_slug = ? AND created_at >= datetime(?, ?)",
        (clinic_slug, _ts(), "-7 days"),
    )
