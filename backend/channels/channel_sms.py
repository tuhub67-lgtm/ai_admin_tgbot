"""Адаптер SMS через SMS.ru — только fallback и «мост», НЕ чат.

Первое сообщение = короткий текст + ссылка «продолжить в Telegram/MAX» +
вариант «или перезвоним». Полный диалог в SMS не ведём (дорого, ответы плохо
маршрутизируются). Текст-мост собирает вызывающий код (webhook/dispatcher).
"""

from __future__ import annotations

import httpx
from loguru import logger

from backend.channels.adapter import ChannelAdapter, DeliveryResult

SMSRU_URL = "https://sms.ru/sms/send"


class SmsRuClient:
    """Минимальный async-клиент SMS.ru (авторизация по api_id)."""

    def __init__(self, api_id: str, sender: str | None = None):
        self.api_id = api_id
        self.sender = sender

    @property
    def configured(self) -> bool:
        return bool(self.api_id)

    async def send_sms(self, phone: str, text: str, sign: str | None = None) -> dict:
        params = {
            "api_id": self.api_id,
            "to": phone.lstrip("+") if phone.startswith("+") else phone,
            "msg": text,
            "json": 1,
        }
        sender = sign or self.sender
        if sender:
            params["from"] = sender
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(SMSRU_URL, params=params)
        return self._check(resp)

    @staticmethod
    def _check(resp: httpx.Response) -> dict:
        try:
            payload = resp.json()
        except ValueError:
            raise RuntimeError(f"SMS.ru: не-JSON ответ, HTTP {resp.status_code}")
        if payload.get("status") != "OK":
            raise RuntimeError(f"SMS.ru: {payload.get('status_text') or payload.get('status_code')}")
        # Статус конкретного номера
        for _, info in (payload.get("sms") or {}).items():
            if info.get("status") != "OK":
                raise RuntimeError(f"SMS.ru: номер отклонён: {info.get('status_text')}")
        return payload


class SmsAdapter(ChannelAdapter):
    name = "sms"
    can_message_by_phone = True

    def __init__(self, client: SmsRuClient, sms_sender: str | None = None):
        self.client = client
        self.sms_sender = sms_sender

    @property
    def configured(self) -> bool:
        return self.client.configured

    async def send(self, target: str, text: str, buttons: list | None = None) -> DeliveryResult:
        if not self.client.configured:
            return DeliveryResult(ok=False, channel=self.name, detail="SMS.ru не настроен")
        try:
            await self.client.send_sms(target, text, self.sms_sender)
            return DeliveryResult(ok=True, channel=self.name)
        except Exception as e:
            logger.error("SMS.ru: не отправлено на {}: {}", target, e)
            return DeliveryResult(ok=False, channel=self.name, detail=str(e))
