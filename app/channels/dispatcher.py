"""Каскад доставки: MAX → (30с нет доставки) → SMS.

Пробуем каналы по порядку; первый успешный останавливает каскад. Каждую попытку
пишем в delivery_attempts. Если ВСЕ каналы упали — фиксируем инцидент (для
reliability-streak) и уведомляем администратора.
"""

from __future__ import annotations

import asyncio

from loguru import logger

from app.channels.base import ChannelAdapter, DeliveryResult
from app.db import Database

CHANNEL_TIMEOUT_S = 30  # ждём доставку в канале не дольше 30с, потом — следующий


class Dispatcher:
    def __init__(self, db: Database, channels: list[ChannelAdapter], notifier=None):
        self.db = db
        self.channels = channels
        self.notifier = notifier

    async def deliver(
        self,
        clinic,
        phone: str,
        text: str,
        ref: str,
        *,
        sign: str | None = None,
    ) -> DeliveryResult:
        last = DeliveryResult(channel="none", success=False, detail="нет каналов")
        for ch in self.channels:
            if not ch.configured:
                # Незаписанная попытка: канал не подключён — не считаем сбоем канала,
                # просто идём дальше по каскаду.
                continue
            try:
                res = await asyncio.wait_for(
                    ch.send_by_phone(phone, text, sign), timeout=CHANNEL_TIMEOUT_S
                )
            except (asyncio.TimeoutError, Exception) as e:  # noqa: BLE001
                res = DeliveryResult(channel=ch.name, success=False, detail=f"timeout/{e}")
            await self.db.record_delivery(clinic.slug, ref, ch.name, res.success)
            last = res
            if res.success:
                return res
        # Все подключённые каналы упали (или ни один не подключён) → инцидент.
        await self.db.record_incident(clinic.slug, ref)
        logger.error("Каскад доставки: все каналы упали для {} (ref={})", clinic.slug, ref)
        if self.notifier is not None:
            try:
                await self.notifier.send_group_message(
                    clinic.tg_group_id,
                    "⚠️ Не удалось связаться с пациентом ни в MAX, ни по SMS. "
                    "Перезвоните вручную — это учтено в счётчике надёжности.",
                )
            except Exception:  # noqa: BLE001
                pass
        return last
