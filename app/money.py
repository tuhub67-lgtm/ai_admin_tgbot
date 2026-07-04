"""Деньги недели: возвращённые рубли по дням + день окупаемости пилота.

«Возвращено» = сумма est_sum записанных лидов (confirmed|booked). Окупаемость
пилота — первый день, когда накопленная сумма превысила цену пилота.
"""

from __future__ import annotations

from app.db import Database

PILOT_PRICE = 1590  # ₽, из оффера (не менять формулировку/цену)


async def weekly_money(db: Database, clinic_slug: str, *, days: int = 7) -> dict:
    by_day = await db.recovered_by_day(clinic_slug, days)
    total = sum(r["rub"] for r in by_day)
    leads = sum(r["leads"] for r in by_day)

    # День окупаемости пилота: накопительным итогом пересекли цену пилота.
    payback_day = None
    running = 0
    for r in by_day:
        running += r["rub"]
        if payback_day is None and running >= PILOT_PRICE:
            payback_day = r["day"]

    return {
        "total": total,
        "leads": leads,
        "by_day": by_day,
        "pilot_price": PILOT_PRICE,
        "pilot_paid_back": total >= PILOT_PRICE,
        "payback_day": payback_day,
    }
