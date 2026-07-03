"""Единый интерфейс канала доставки. Три реализации: Telegram, MAX (заглушка),
SMS (SMS.ru, режим «мост»). Диспетчер (dispatcher.py) выбирает канал каскадом.

Контракт намеренно узкий: send(target, text, buttons) -> DeliveryResult.
`target` — телефон (+7XXXXXXXXXX) либо chat_id существующего диалога.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class DeliveryResult:
    ok: bool
    channel: str
    detail: str = ""


class ChannelAdapter:
    """Базовый адаптер. name — имя канала для логов и delivery_attempts."""

    name: str = "base"

    #: может ли канал написать пациенту ПЕРВЫМ, зная только номер телефона
    can_message_by_phone: bool = False

    async def send(self, target: str, text: str, buttons: list | None = None) -> DeliveryResult:
        raise NotImplementedError

    async def close(self) -> None:  # pragma: no cover - переопределяется по необходимости
        pass
