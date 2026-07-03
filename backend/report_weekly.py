"""Недельный отчёт владельцу: понедельник 09:00 МСК автоматически.

Ценность приходит сама, а не «когда владелец вспомнит спросить». Команда
`/week` в Штабе остаётся как ручной вызов того же отчёта (см. shtab_bot).
"""

from __future__ import annotations

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from loguru import logger

from backend.config import Clinic, Settings
from backend.db import Database
from backend.leads import GroupNotifier
from backend.utils import MSK


async def build_weekly_report(db: Database, clinic: Clinic) -> str:
    """Текст отчёта: обращений, перехвачено, записано, возвращено ₽, потери."""
    leads = await db.list_leads(clinic.slug, limit=1000)
    # За последние 7 дней (по created_at 'YYYY-MM-DD HH:MM:SS')
    from backend.utils import now_msk
    cutoff = (now_msk()).timestamp() - 7 * 86400

    def _ts(row):
        try:
            from datetime import datetime
            return datetime.strptime(row["created_at"], "%Y-%m-%d %H:%M:%S").replace(tzinfo=MSK).timestamp()
        except Exception:
            return 0

    week = [x for x in leads if _ts(x) >= cutoff]
    total = len(week)
    intercepted = sum(1 for x in week if x["status"] in ("pending", "dialog", "booked"))
    booked = [x for x in week if x["status"] == "booked"]
    returned = sum((x.get("sum_rub") or 0) for x in booked)
    lost = sum(1 for x in week if x["status"] == "lost")

    return (
        f"📊 Неделя — {clinic.name}\n"
        f"Обращений: {total}\n"
        f"Подхвачено: {intercepted}\n"
        f"Записано: {len(booked)}\n"
        f"Возвращено ≈ {returned} ₽\n"
        f"Потеряно: {lost}"
    )


class WeeklyReport:
    def __init__(
        self,
        db: Database,
        clinics: dict[str, Clinic],
        notifier: GroupNotifier,
        settings: Settings,
    ):
        self.db = db
        self.clinics = clinics
        self.notifier = notifier
        self.settings = settings

    async def send_all(self) -> None:
        for clinic in self.clinics.values():
            try:
                text = await build_weekly_report(self.db, clinic)
                await self.notifier.send_group_message(clinic.shtab_chat_id, text)
            except Exception as e:
                logger.error("Недельный отчёт {} не отправлен: {}", clinic.slug, e)

    def start_scheduler(self) -> AsyncIOScheduler:
        scheduler = AsyncIOScheduler(timezone=MSK)
        scheduler.add_job(
            self.send_all,
            CronTrigger(day_of_week="mon", hour=9, minute=0, timezone=MSK),
            id="weekly_report",
        )
        scheduler.start()
        return scheduler
