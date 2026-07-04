"""Демо-данные для клиники demo-dent: 8–10 лидов всех статусов, немного истории
денег и один устранённый инцидент — чтобы кабинет и /api были «живыми» на демо.

Запуск:  uv run python -m scripts.seed_demo   (использует DB_PATH из .env)
Идемпотентно-ish: чистит прежние демо-данные demo-dent перед вставкой.
"""

from __future__ import annotations

import asyncio
from datetime import timedelta

from app.config import load_settings
from app.db import Database
from app.utils import now_msk

SLUG = "demo-dent"

# (имя, телефон, услуга, срочность, время, статус, сумма, источник, recovered, urgent, callback)
LEADS = [
    ("Ольга", "+79170001111", "Профгигиена", "planned", "чт 09:30", "confirmed", 4500, "sms", True, False, False),
    ("Марина", "+79170002222", "Лечение кариеса", "planned", "пт 15:00", "confirmed", 5900, "landing", False, False, False),
    ("Игорь", "+79170003333", "Имплантация", "planned", "консультация пн 11:00", "booked", 3000, "call", False, False, False),
    ("Сергей", "+79170004444", "Профгигиена", "planned", "сегодня вечером", "pending", 4500, "sms", True, False, False),
    ("Анна", "+79170005555", "Лечение кариеса", "planned", "завтра утром", "pending", 5900, "landing", False, False, False),
    ("Дмитрий", "+79170006666", "не уточнена (острая боль)", "urgent", "сейчас", "callback", 3000, "call", False, True, False),
    ("Елена", "+79170007777", "Профгигиена", "planned", "перезвоните после 18", "callback", 4500, "sms", True, False, True),
    ("Павел", "+79170008888", "Консультация", "planned", "не дозвонились", "new", 3000, "sms", True, False, False),
    ("Наталья", "+79170009999", "Имплантация", "planned", "на след. неделе", "lost", 3000, "landing", False, False, False),
]


async def main() -> None:
    settings = load_settings()
    db = Database(settings.db_path)
    await db.connect()
    try:
        # Чистим прежние демо-данные
        for table in ("leads", "sessions", "missed_calls", "incidents", "delivery_attempts"):
            await db.conn.execute(f"DELETE FROM {table} WHERE clinic_slug = ?", (SLUG,))
        await db.conn.commit()

        for i, (name, phone, service, urg, when, status, rub, src, rec, urgent, cb) in enumerate(LEADS):
            session = await db.get_or_create_session(SLUG, "telegram", f"demo-{i}", src)
            await db.add_message(session["id"], "user", f"Здравствуйте, интересует {service}")
            await db.add_message(session["id"], "assistant", "Здравствуйте! Записываю вас. Уточните удобное время?")
            await db.add_message(session["id"], "user", when)
            lead_id = await db.create_lead(
                session,
                {"name": name, "phone": phone, "service": service, "urgency": urg,
                 "preferred_time": when},
                is_urgent=urgent, status=status, est_sum=rub,
                recovered_from_miss=rec, wants_callback=cb,
                resume=f"{service} · {when}",
            )
            if status in ("confirmed", "booked"):
                await db.set_lead_status(lead_id, SLUG, status, slot=when)
                await db.mark_patient_notified(lead_id, SLUG)

        # История денег/надёжности: пропущенный + устранённый инцидент 3 дня назад
        old = (now_msk() - timedelta(days=3)).strftime("%Y-%m-%d %H:%M:%S")
        await db.conn.execute(
            "INSERT INTO missed_calls (call_id, clinic_slug, caller_phone, created_at)"
            " VALUES (?, ?, ?, ?)",
            ("demo-miss-1", SLUG, "+79170001111", old),
        )
        await db.conn.execute(
            "INSERT INTO incidents (clinic_slug, ref, occurred_at, resolved_in_minutes)"
            " VALUES (?, ?, ?, ?)",
            (SLUG, "demo-miss-1", old, 8),
        )
        await db.conn.commit()

        total = await db._scalar("SELECT COUNT(*) FROM leads WHERE clinic_slug = ?", (SLUG,))
        print(f"Демо готово: {total} лидов для {SLUG}")
    finally:
        await db.close()


if __name__ == "__main__":
    asyncio.run(main())
