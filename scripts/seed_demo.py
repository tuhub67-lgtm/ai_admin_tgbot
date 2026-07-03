"""Демо-данные для клиники demo-dent: 8–10 лидов всех статусов.

Для скринов, ручной проверки кабинета и демо-входа модератору. Идемпотентно:
повторный запуск не плодит дубли (сносит прежние демо-лиды demo-dent).

    uv run python -m scripts.seed_demo
"""

from __future__ import annotations

import asyncio
from datetime import timedelta

from backend.config import load_clinics, load_settings
from backend.db import Database
from backend.utils import now_msk

# (имя, телефон, услуга, срочность, статус, дней назад, ночь, повтор)
DEMO_LEADS = [
    ("Марина", "+79170000001", "Профгигиена", "planned", "booked", 6, 0, 0),
    ("Ольга", "+79170000002", "Лечение кариеса", "pain", "booked", 5, 0, 0),
    ("Игорь", "+79170000003", "Имплантация", "planned", "booked", 3, 0, 0),
    ("Анна", "+79170000004", "Профгигиена", "planned", "pending", 1, 0, 0),
    ("Сергей", "+79170000005", "Консультация", "planned", "pending", 0, 1, 0),
    ("Дмитрий", "+79170000006", "Лечение кариеса", "urgent", "new", 0, 0, 0),
    ("Елена", "+79170000007", "Профгигиена", "planned", "dialog", 2, 0, 1),
    ("Павел", "+79170000008", "Имплантация", "planned", "lost", 4, 0, 0),
    ("—", "+79170000009", "нецелевой запрос", "planned", "nontarget", 2, 0, 0),
    ("Ксения", "+79170000010", "Лечение кариеса", "pain", "booked", 0, 0, 0),
]


async def seed() -> None:
    settings = load_settings()
    clinics = load_clinics()
    clinic = clinics[settings.default_clinic_slug]
    db = Database(settings.db_path)
    await db.connect()
    try:
        # Идемпотентность: удаляем прежние демо-лиды и их сессии.
        await db.conn.execute(
            "DELETE FROM leads WHERE clinic_slug = ? AND phone LIKE '+7917000000%'",
            (clinic.slug,),
        )
        await db.conn.execute(
            "DELETE FROM sessions WHERE clinic_slug = ? AND external_id LIKE 'demo-seed-%'",
            (clinic.slug,),
        )
        await db.conn.commit()

        for i, (name, phone, service, urgency, status, days_ago, night, repeat) in enumerate(DEMO_LEADS):
            session = await db.get_or_create_session(
                clinic.slug, "telegram", f"demo-seed-{i}", "landing"
            )
            fields = {"name": name, "phone": phone, "service": service,
                      "urgency": urgency, "preferred_time": "завтра, 11:00"}
            lead_id = await db.create_lead(
                session, fields,
                is_urgent=(urgency == "urgent"), is_night=bool(night),
                status=status, is_repeat=bool(repeat),
                sum_rub=clinic.service_avg_check(service),
            )
            # Раскидываем по датам недели (для графика «Деньги»).
            when = (now_msk() - timedelta(days=days_ago)).strftime("%Y-%m-%d %H:%M:%S")
            confirmed = when if status == "booked" else None
            await db.conn.execute(
                "UPDATE leads SET created_at = ?, confirmed_at = ? WHERE id = ?",
                (when, confirmed, lead_id),
            )
        await db.conn.commit()
        print(f"Демо-данные: {len(DEMO_LEADS)} лидов для клиники {clinic.slug} загружены.")
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(seed())
