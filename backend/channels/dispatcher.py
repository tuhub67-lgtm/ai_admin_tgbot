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
    ):
        self.db = db
        self.max = max_adapter
        self.sms = sms_adapter
        self.telegram = telegram_adapter
        self.ratelimit = ratelimit or RateLimiter()
        self.fallback_seconds = fallback_seconds

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
        # Дневной лимит на номер (идемпотентность + защита от спама/атаки).
        if respect_daily_limit and not await self.db.auto_message_allowed(clinic_slug, phone):
            logger.info("Дневной лимит авто-сообщений на номер {} — пропуск", phone)
            return DeliveryResult(ok=False, channel="none", detail="daily-limit")

        result = DeliveryResult(ok=False, channel="none", detail="no channel")

        # 1) Существующий диалог в Telegram — самый надёжный путь.
        if existing_tg_chat_id and "telegram" in channels and self.telegram is not None:
            result = await self.telegram.send(existing_tg_chat_id, text)
            await self.db.record_delivery_attempt(clinic_slug, phone, "telegram", result.ok)
            if result.ok:
                await self._mark_sent(clinic_slug, phone)
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
                await self._mark_sent(clinic_slug, phone)
                return result

        # 3) SMS.ru — мост (fallback).
        if "sms" in channels:
            allowed = await self.ratelimit.allow_sms(self.db, clinic_slug)
            if not allowed:
                logger.error("Дневной SMS-лимит клиники {} исчерпан — SMS не отправлена", clinic_slug)
                await self.db.record_delivery_attempt(clinic_slug, phone, "sms", False)
                return DeliveryResult(ok=False, channel="sms", detail="sms-daily-limit")
            result = await self.sms.send(phone, text)
            await self.db.record_delivery_attempt(clinic_slug, phone, "sms", result.ok)
            if result.ok:
                await self._mark_sent(clinic_slug, phone)
            return result

        return result

    async def _mark_sent(self, clinic_slug: str, phone: str) -> None:
        await self.db.record_auto_message(clinic_slug, phone)
