"""Доставка лида: мгновенная карточка в TG-группу клиники + запись в SQLite.

Полный лог диалога остаётся в таблицах sessions/messages на VPS —
никаких Google Sheets и внешних таблиц (152-ФЗ).
"""

from __future__ import annotations

from typing import Protocol

from loguru import logger

from app.config import Clinic
from app.db import Database
from app.utils import mask_phone, now_msk

URGENCY_LABELS = {
    "planned": "планово",
    "pain": "болит",
    "urgent": "🔴 СРОЧНО",
}

CHANNEL_LABELS = {
    "telegram": "Telegram",
    "widget": "виджет",
}


class GroupNotifier(Protocol):
    async def send_group_message(self, chat_id: int, text: str) -> None: ...


def channel_label(channel: str, source: str) -> str:
    if source == "sms":
        return "SMS-возврат"
    return CHANNEL_LABELS.get(channel, channel)


def format_lead_card(
    clinic: Clinic,
    session: dict,
    fields: dict,
    *,
    is_urgent: bool,
    is_night: bool,
    wants_human: bool,
) -> str:
    urgency = "urgent" if is_urgent else fields.get("urgency")
    lines = [
        f"🦷 НОВАЯ ЗАЯВКА — {clinic.name}",
        f"Имя: {fields.get('name') or '—'} · Телефон: {fields.get('phone') or '—'}",
        f"Услуга: {fields.get('service') or '—'} · Срочность: {URGENCY_LABELS.get(urgency, '—')}",
        f"Удобное время: {fields.get('preferred_time') or '—'}",
        f"Канал: {channel_label(session['channel'], session['source'])}"
        f" · Источник: {session['source']}",
        f"⏱ {now_msk().strftime('%d.%m.%Y %H:%M')} · диалог #{session['id']}",
    ]
    if wants_human:
        lines.insert(1, "🙋 Пациент просит живого администратора — свяжитесь как можно скорее")
    if is_night:
        lines.append("🌙 Ночная заявка (вне графика клиники)")
    return "\n".join(lines)


class LeadService:
    def __init__(self, db: Database, clinics: dict[str, Clinic], notifier: GroupNotifier):
        self.db = db
        self.clinics = clinics
        self.notifier = notifier

    async def submit(
        self,
        session: dict,
        fields: dict,
        *,
        is_urgent: bool = False,
        is_night: bool = False,
        wants_human: bool = False,
    ) -> int:
        clinic = self.clinics[session["clinic_slug"]]
        lead_id = await self.db.create_lead(
            session,
            fields,
            is_urgent=is_urgent,
            is_night=is_night,
            wants_human=wants_human,
        )
        card = format_lead_card(
            clinic,
            session,
            fields,
            is_urgent=is_urgent,
            is_night=is_night,
            wants_human=wants_human,
        )
        try:
            await self.notifier.send_group_message(clinic.tg_group_id, card)
        except Exception as e:
            # Лид уже в БД — потерять его нельзя, но группу могли не настроить.
            logger.error(
                "Не удалось отправить карточку лида #{} в группу {}: {}",
                lead_id,
                clinic.tg_group_id,
                e,
            )
        logger.info(
            "Лид #{} ({}): {} {}, срочно={}, ночь={}, живой={}",
            lead_id,
            clinic.slug,
            fields.get("name") or "—",
            mask_phone(fields.get("phone")),
            is_urgent,
            is_night,
            wants_human,
        )
        return lead_id
