"""Счётчик надёжности: сколько дней подряд каждое обращение получало ответ.

Провал (incident) = день, в который по номеру ВСЕ каналы дали fail (ни одной
успешной доставки). Streak — дни подряд без таких провалов.
"""

from __future__ import annotations

from datetime import date


def _d(s: str) -> date:
    return date.fromisoformat(s[:10])


def compute_streak(
    incident_dates: list[str],
    today: date,
    *,
    first_day: date | None = None,
    last_resolved_minutes: int | None = None,
) -> dict:
    """incident_dates — даты 'YYYY-MM-DD' с полным провалом доставки.

    Возвращает {current_streak_days, record_days, last_incident|null}.
    """
    inc = sorted({_d(x) for x in incident_dates})
    if not inc:
        streak = (today - first_day).days if first_day else 0
        streak = max(0, streak)
        return {"current_streak_days": streak, "record_days": streak, "last_incident": None}

    last = inc[-1]
    current = max(0, (today - last).days)

    gaps = [current]
    if first_day:
        gaps.append(max(0, (inc[0] - first_day).days))
    for a, b in zip(inc, inc[1:]):
        gaps.append(max(0, (b - a).days - 1))
    record = max(gaps + [0])

    return {
        "current_streak_days": current,
        "record_days": record,
        "last_incident": {
            "date": last.isoformat(),
            "resolved_in_minutes": last_resolved_minutes,
        },
    }
