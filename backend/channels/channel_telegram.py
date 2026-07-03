"""Адаптер Telegram (aiogram): отправка сообщения пациенту в существующий
диалог по chat_id. Первым по номеру телефона Telegram писать не умеет —
can_message_by_phone = False (используется только когда у пациента уже есть
диалог с ботом)."""

from __future__ import annotations

from loguru import logger

from backend.channels.adapter import ChannelAdapter, DeliveryResult


class TelegramAdapter(ChannelAdapter):
    name = "telegram"
    can_message_by_phone = False

    def __init__(self, bot):
        self.bot = bot

    async def send(self, target: str, text: str, buttons: list | None = None) -> DeliveryResult:
        try:
            await self.bot.send_message(int(target), text)
            return DeliveryResult(ok=True, channel=self.name)
        except Exception as e:
            logger.error("Telegram-адаптер: не доставлено в {}: {}", target, e)
            return DeliveryResult(ok=False, channel=self.name, detail=str(e))
