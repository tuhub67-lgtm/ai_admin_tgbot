"""Единый интерфейс канала доставки. Каскад (MAX→SMS) работает поверх него,
не зная деталей конкретного канала."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass
class DeliveryResult:
    channel: str
    success: bool
    detail: str = ""


class ChannelAdapter(Protocol):
    name: str

    @property
    def configured(self) -> bool: ...

    async def send_by_phone(self, phone: str, text: str, sign: str | None = None) -> DeliveryResult:
        """Отправить сообщение на номер. Не бросать исключения наружу — вернуть
        DeliveryResult(success=False) при неудаче, чтобы каскад пошёл дальше."""
        ...
