"""Ежедневные дайджесты (APScheduler, 20:00 Europe/Moscow).

Клинике — цифры дня и «спасённые ₽» за месяц (это удержание — клиника каждый
вечер видит, за что платит). Владельцу — сводка по всем клиникам, все ошибки
за день и расход токенов GigaChat в рублях.
"""

from __future__ import annotations

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from loguru import logger

from backend.config import Clinic, Settings
from backend.db import Database
from backend.leads import GroupNotifier
from backend.utils import MSK, now_msk


def _fmt_rub(value: int) -> str:
    """12345 → «12 345» (русская типографика, без запятых)."""
    return f"{value:,}".replace(",", " ")


class DigestService:
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

    def start_scheduler(self) -> AsyncIOScheduler:
        scheduler = AsyncIOScheduler(timezone=MSK)
        scheduler.add_job(
            self.send_daily_digests,
            CronTrigger(hour=20, minute=0, timezone=MSK),
            id="daily_digest",
            misfire_grace_time=3600,
        )
        scheduler.start()
        return scheduler

    async def send_daily_digests(self) -> None:
        today = now_msk().strftime("%Y-%m-%d")
        month = now_msk().strftime("%Y-%m")
        owner_lines = [f"📊 Сводка за {now_msk().strftime('%d.%m.%Y')}"]

        for clinic in self.clinics.values():
            try:
                stats = await self.db.clinic_day_stats(clinic.slug, today)
                month_leads = await self.db.clinic_month_leads(clinic.slug, month)
                saved_rub = _fmt_rub(month_leads * clinic.lead_cost)
                text = (
                    f"📊 {clinic.name}, за сегодня: диалогов {stats['dialogs']}"
                    f" · заявок {stats['leads']}"
                    f" (ночью/вне графика {stats['night']},"
                    f" из пропущенных звонков {stats['from_sms']}).\n"
                    f"За месяц: {month_leads} заявок ≈ {saved_rub} ₽ спасённой рекламы"
                    f" ({month_leads} × {_fmt_rub(clinic.lead_cost)} ₽)."
                )
                await self.notifier.send_group_message(clinic.tg_group_id, text)
                owner_lines.append(
                    f"• {clinic.name}: диалогов {stats['dialogs']},"
                    f" заявок {stats['leads']} (🌙 {stats['night']},"
                    f" 📵→💬 {stats['from_sms']}),"
                    f" пропущенных звонков {stats['missed_calls']}"
                )
            except Exception as e:
                logger.error("Дайджест для {} не отправлен: {}", clinic.slug, e)
                owner_lines.append(f"• {clinic.name}: ошибка дайджеста — {e}")

        await self._send_owner_digest(owner_lines, today)

    async def _send_owner_digest(self, clinic_lines: list[str], today: str) -> None:
        if not self.settings.owner_tg_id:
            return
        tokens = await self.db.tokens_for_date(today)
        cost_rub = tokens / 1000 * self.settings.gigachat_rub_per_1k_tokens
        lines = list(clinic_lines)
        lines.append(f"\n🤖 GigaChat: {tokens} токенов ≈ {cost_rub:.2f} ₽")

        errors = await self.db.errors_for_date(today)
        if errors:
            lines.append(f"\n⚠️ Ошибки за день ({len(errors)}):")
            # В Telegram влезает ~4096 символов — берём последние 20 ошибок.
            for err in errors[-20:]:
                lines.append(f"— {err[:180]}")
        else:
            lines.append("\n✅ Ошибок за день нет")

        text = "\n".join(lines)
        try:
            await self.notifier.send_group_message(self.settings.owner_tg_id, text[:4000])
        except Exception as e:
            logger.error("Дайджест владельцу не отправлен: {}", e)
