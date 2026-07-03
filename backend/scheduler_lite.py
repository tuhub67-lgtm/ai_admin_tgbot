"""Лёгкое расписание: слоты из графика клиники (без интеграции с МИС).

Ручной режим по умолчанию: Анна не бронирует слот жёстко, а предлагает 2–3
ближайших свободных окна и создаёт заявку в статусе pending. Финальное
подтверждение пациенту уходит только после тапа администратора «Подтвердить».
"""

from __future__ import annotations

from datetime import datetime, timedelta

from backend.config import Clinic, parse_work_hours
from backend.utils import now_msk

_WEEKDAYS = ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"]


def _day_label(slot: datetime, today: datetime) -> str:
    delta = (slot.date() - today.date()).days
    if delta == 0:
        return "сегодня"
    if delta == 1:
        return "завтра"
    if delta == 2:
        return "послезавтра"
    return _WEEKDAYS[slot.weekday()]


def format_slot(slot: datetime, today: datetime) -> str:
    return f"{_day_label(slot, today)}, {slot.strftime('%H:%M')}"


def next_slots(clinic: Clinic, now: datetime | None = None, count: int = 3) -> list[datetime]:
    """Ближайшие `count` свободных окон (по шагу clinic.slot_step_min) в рабочие часы.

    «Свободны» здесь = попадают в рабочие часы клиники и в будущем. Реально
    занятые слоты клиника отмечает вручную через кабинет (в MVP не вычитаем —
    жёсткой брони нет, администратор подтверждает конкретное время сам).
    """
    now = now or now_msk()
    step = max(5, clinic.slot_step_min)
    schedule = parse_work_hours(clinic.work_hours)

    # Округляем текущее время вверх до следующего шага + небольшой буфер.
    minute = (now.minute // step + 1) * step
    cursor = now.replace(second=0, microsecond=0, minute=0) + timedelta(minutes=minute)

    slots: list[datetime] = []
    guard = 0
    while len(slots) < count and guard < 24 * 60 * 14 // step:  # не дольше 2 недель вперёд
        guard += 1
        if schedule.open_always or schedule.is_open(cursor):
            slots.append(cursor)
        cursor += timedelta(minutes=step)
        # Если ушли за конец рабочего дня — перепрыгнем на начало следующего.
        if not schedule.open_always and cursor.time() >= schedule.end:
            nxt = (cursor + timedelta(days=1)).replace(
                hour=schedule.start.hour, minute=schedule.start.minute, second=0, microsecond=0
            )
            cursor = nxt
    return slots


def next_slots_text(clinic: Clinic, now: datetime | None = None, count: int = 3) -> list[str]:
    now = now or now_msk()
    return [format_slot(s, now) for s in next_slots(clinic, now, count)]
