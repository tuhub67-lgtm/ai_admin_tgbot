"""Адаптер канала MAX (dev.max.ru) — ЗАГЛУШКА в этой версии.

MAX Bot API умеет отправлять сообщения по chat_id и запрашивать контакт
кнопкой request_contact, но НЕ отправляет первым по номеру телефона без
верификации организации и номерных уведомлений. Поэтому отправка первым по
номеру оставлена как send() -> ok=False с TODO: подключить, когда будет
бизнес-аккаунт MAX с номерными уведомлениями (верификация организации).
"""

from __future__ import annotations

from loguru import logger

from backend.channels.adapter import ChannelAdapter, DeliveryResult


class MaxAdapter(ChannelAdapter):
    name = "max"
    # TODO: True после верификации организации в MAX и включения номерных
    #       уведомлений (bring-first-message-by-phone). Пока — не можем.
    can_message_by_phone = False

    def __init__(self, bot_token: str | None = None):
        self.bot_token = bot_token or ""

    async def send(self, target: str, text: str, buttons: list | None = None) -> DeliveryResult:
        # Существующий диалог по chat_id можно было бы поддержать, но в MVP MAX
        # не активен — честно возвращаем «не доставлено», чтобы каскад ушёл в SMS.
        logger.info("MAX-адаптер (заглушка): доставка в {} не выполнена (нужен бизнес-аккаунт)", target)
        return DeliveryResult(ok=False, channel=self.name, detail="MAX stub: not configured")

    async def send_by_phone(self, phone: str, text: str) -> DeliveryResult:
        """TODO: требует бизнес-аккаунт MAX с номерными уведомлениями,
        подключить когда будет верификация организации."""
        return DeliveryResult(ok=False, channel=self.name, detail="MAX send_by_phone: TODO")
