"""MAX — заглушка. Реальная отправка по номеру требует бизнес-аккаунта MAX и
номерных уведомлений (в этой сессии не реализуем). Всегда `configured=False`,
поэтому каскад сразу уходит на SMS. TODO: подключить MAX Business API.
"""

from __future__ import annotations

from loguru import logger

from app.channels.base import DeliveryResult


class MaxChannel:
    name = "max"

    @property
    def configured(self) -> bool:
        return False  # TODO: бизнес-аккаунт MAX + номерные уведомления

    async def send_by_phone(self, phone: str, text: str, sign: str | None = None) -> DeliveryResult:
        # Заглушка: канал не подключён — доставка невозможна, каскад идёт на SMS.
        logger.debug("MAX-заглушка: доставка на {} не выполнена (канал не подключён)", phone)
        return DeliveryResult(channel=self.name, success=False, detail="MAX не подключён")
