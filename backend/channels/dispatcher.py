"""Каскад доставки первого сообщения Анны.

Порядок: если у пациента уже есть диалог в Telegram — пишем туда; иначе
пробуем MAX (написать первым по номеру) → нет доставки за `fallback_seconds`
→ SMS.ru (мост). Каждая попытка пишется в delivery_attempts (для каскада,
счётчика надёжности и дневного лимита SMS).

Дневной лимит: не более 1 авто-сообщения на номер за 24 часа (поверх каскада).
"""

from __future__ import annotations

import asyncio

from loguru import logger

from backend.channels.adapter import ChannelAdapter, DeliveryResult
from backend.channels.channel_max import MaxAdapter
from backend.channels.channel_sms import SmsAdapter
from backend.db import Database
from backend.ratelimit import RateLimiter


class Dispatcher:
    def __init__(
        self,
        db: Database,
        *,
        max_adapter: MaxAdapter,
        sms_adapter: SmsAdapter,
        telegram_adapter: ChannelAdapter | None = None,
        ratelimit: RateLimiter | None = None,
        fallback_seconds: float = 30.0,
        notifier=None,
        owner_chat_id: int | None = None,
    ):
        self.db = db
        self.max = max_adapter
        self.sms = sms_adapter
        self.telegram = telegram_adapter
        self.ratelimit = ratelimit or RateLimiter()
        self.fallback_seconds = fallback_seconds
        self.notifier = notifier            # для уведомления админа при лимите
        self.owner_chat_id = owner_chat_id

    async def deliver_first_message(
        self,
        clinic_slug: str,
        phone: str,
        text: str,
        *,
        channels: list[str],
        existing_tg_chat_id: str | None = None,
        respect_daily_limit: bool = True,
    ) -> DeliveryResult:
        """Доставить первое сообщение пациенту каскадом. Возвращает итог доставки."""
        # Дневной лимит на номер: атомарный резерв ДО отправки (не check-then-act) —
        # два одновременных пропущенных с одного номера не дадут двух авто-сообщений.
        # Компромисс: неуспешная доставка тоже расходует слот дня (человек добьёт из
        # Штаба); зато никогда не бывает двойной отправки/двойного списания SMS.
        if respect_daily_limit and not await self.db.reserve_auto_message(clinic_slug, phone):
            logger.info("Дневной лимит авто-сообщений на номер {} — пропуск", phone)
            return DeliveryResult(ok=False, channel="none", detail="daily-limit")

        result = DeliveryResult(ok=False, channel="none", detail="no channel")

        # Слот дня уже зарезервирован выше (reserve_auto_message) — отдельная
        # запись «отправлено» больше не нужна.

        # 1) Существующий диалог в Telegram — самый надёжный путь.
        if existing_tg_chat_id and "telegram" in channels and self.telegram is not None:
            result = await self.telegram.send(existing_tg_chat_id, text)
            await self.db.record_delivery_attempt(clinic_slug, phone, "telegram", result.ok)
            if result.ok:
                return result

        # 2) MAX первым по номеру (в этой версии — заглушка, обычно не доставит).
        if "max" in channels and self.max.can_message_by_phone:
            try:
                result = await asyncio.wait_for(
                    self.max.send_by_phone(phone, text), timeout=self.fallback_seconds
                )
            except asyncio.TimeoutError:
                result = DeliveryResult(ok=False, channel="max", detail="timeout")
            await self.db.record_delivery_attempt(clinic_slug, phone, "max", result.ok)
            if result.ok:
                return result

        # 3) SMS.ru — мост (fallback).
        if "sms" in channels:
            allowed = await self.ratelimit.allow_sms(self.db, clinic_slug)
            if not allowed:
                logger.error("Дневной SMS-лимит клиники {} исчерпан — SMS не отправлена", clinic_slug)
                await self.db.record_delivery_attempt(clinic_slug, phone, "sms", False)
                await self._notify_limit(clinic_slug, "SMS")
                return DeliveryResult(ok=False, channel="sms", detail="sms-daily-limit")
            result = await self.sms.send(phone, text)
            await self.db.record_delivery_attempt(clinic_slug, phone, "sms", result.ok)
            return result

        return result

    async def _notify_limit(self, clinic_slug: str, kind: str) -> None:
        """Уведомление админа при достижении лимита — не молчаливый отказ (Фаза 7)."""
        if self.notifier is None or self.owner_chat_id is None:
            return
        try:
            await self.notifier.send_group_message(
                self.owner_chat_id, f"⚠️ Лимит {kind} по клинике {clinic_slug} исчерпан — доставка остановлена."
            )
        except Exception as e:
            logger.error("Не удалось уведомить админа о лимите: {}", e)
