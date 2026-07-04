"""scheduler_lite: слоты из графика клиники + ручной режим записи.

Ручной режим (по умолчанию): Анна собирает заявку → лид создаётся со статусом
`pending` → администратор в Штабе/кабинете жмёт «Подтвердить» → только тогда
пациенту уходит финальное подтверждение (идемпотентно, без двойной брони).

Слоты нужны, чтобы Анна предлагала пациенту 2–3 конкретных окна. Здесь —
детерминированная генерация ближайших окон в рабочих часах; их подмешиваем
в системный промпт. Синхронизации с реальным календарём клиники нет (ручной
режим): двойную бронь исключает подтверждение живым администратором.
"""

from __future__ import annotations

from datetime import datetime, timedelta

from app.config import WorkSchedule

_WD = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"]
SLOT_STEP_MINUTES = 30


def _ceil_to_step(dt: datetime, step_min: int) -> datetime:
    dt = dt.replace(second=0, microsecond=0)
    rem = dt.minute % step_min
    if rem:
        dt += timedelta(minutes=step_min - rem)
    return dt


def generate_slots(
    schedule: WorkSchedule,
    now: datetime,
    *,
    count: int = 3,
    step_min: int = SLOT_STEP_MINUTES,
    horizon_days: int = 7,
) -> list[datetime]:
    """Ближайшие `count` рабочих окон, начиная не раньше чем через 1 час от now."""
    start = _ceil_to_step(now + timedelta(hours=1), step_min)
    slots: list[datetime] = []
    cur = start
    limit = now + timedelta(days=horizon_days)
    while cur <= limit and len(slots) < count:
        if schedule.open_always or (
            cur.weekday() in schedule.days and schedule.start <= cur.time() < schedule.end
        ):
            slots.append(cur)
            cur += timedelta(minutes=step_min)
        else:
            # Прыгаем к следующему открытию (началу следующего рабочего дня).
            nxt = (cur + timedelta(days=1)).replace(
                hour=schedule.start.hour, minute=schedule.start.minute, second=0, microsecond=0
            )
            cur = nxt if not schedule.open_always else cur + timedelta(minutes=step_min)
    return slots


def format_slot(dt: datetime) -> str:
    """datetime → «чт 09:30» (человеческий формат для Анны и карточки)."""
    return f"{_WD[dt.weekday()]} {dt:%H:%M}"


def slots_text(schedule: WorkSchedule, now: datetime, count: int = 3) -> str:
    """Строка слотов для системного промпта: «чт 09:30, чт 10:00, пт 09:00»."""
    slots = generate_slots(schedule, now, count=count)
    return ", ".join(format_slot(s) for s in slots) if slots else "ближайшее рабочее время"
