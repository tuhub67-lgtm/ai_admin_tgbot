"""Follow-up молчащему пациенту: ровно 1 напоминание через 2 часа, не больше.

Без авто-отчёта ценность приходит, только если владелец сам вспомнит; аналогично
и пациент — если после ответа Анны он замолчал, одно мягкое напоминание через 2
часа заметно поднимает конверсию. Планировщик дергает run_once каждые 15 минут.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from loguru import logger

from backend.config import Clinic
from backend.db import Database
from backend.utils import MSK

FOLLOWUP_TEXT = (
    "Здравствуйте! Вы писали нам — подскажите, актуальна ли запись? "
    "Помогу подобрать удобное время."
)

# send_fn(session, text) -> Awaitable[bool] (True — доставлено)
SendFn = Callable[[dict, str], Awaitable[bool]]


class FollowupService:
    def __init__(self, db: Database, clinics: dict[str, Clinic], send_fn: SendFn):
        self.db = db
        self.clinics = clinics
        self.send_fn = send_fn

    async def run_once(self, hours: int = 2) -> int:
        """Отправляет по одному follow-up молчащим сессиям. Возвращает число."""
        due = await self.db.sessions_needing_followup(hours=hours)
        sent = 0
        for session in due:
            if session["clinic_slug"] not in self.clinics:
                continue
            try:
                ok = await self.send_fn(session, FOLLOWUP_TEXT)
            except Exception as e:
                logger.error("Follow-up сессии {} не отправлен: {}", session["id"], e)
                ok = False
            # Помечаем в любом случае — «не более одного» важнее повторной попытки.
            await self.db.mark_followup_sent(session["id"])
            if ok:
                sent += 1
        return sent

    def start_scheduler(self) -> AsyncIOScheduler:
        scheduler = AsyncIOScheduler(timezone=MSK)
        scheduler.add_job(self.run_once, IntervalTrigger(minutes=15), id="followups")
        scheduler.start()
        return scheduler
