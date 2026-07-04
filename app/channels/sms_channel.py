"""SMS-канал в режиме МОСТ: одно сервисное сообщение со ссылкой в мессенджер и
предложением перезвонить — НЕ полный диалог по SMS. Оборачивает SmsAeroClient
в единый интерфейс канала.
"""

from __future__ import annotations

from loguru import logger

from app.channels.base import DeliveryResult


class SmsChannel:
    name = "sms"

    def __init__(self, sms_client):
        self._sms = sms_client

    @property
    def configured(self) -> bool:
        return bool(self._sms and getattr(self._sms, "configured", False))

    async def send_by_phone(self, phone: str, text: str, sign: str | None = None) -> DeliveryResult:
        if not self.configured:
            return DeliveryResult(channel=self.name, success=False, detail="SMS не настроен")
        try:
            await self._sms.send_sms(phone, text, sign)
            return DeliveryResult(channel=self.name, success=True)
        except Exception as e:
            logger.error("SMS-канал: отправка на {} не удалась: {}", phone, e)
            return DeliveryResult(channel=self.name, success=False, detail=str(e))
