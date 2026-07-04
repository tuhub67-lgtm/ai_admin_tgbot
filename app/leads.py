"""Доставка лида: карточка в TG-группу клиники (Штаб) + запись в SQLite.

Полный лог диалога остаётся в таблицах sessions/messages на VPS (152-ФЗ).
Тексты пациента редактируются до записи (app.redaction), поэтому резюме и
transcript уже без медицинских подробностей.
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


def estimate_sum(clinic: Clinic, service: str | None) -> int:
    """Средний чек услуги: price_from услуги, иначе средний чек клиники (lead_cost)."""
    if service:
        low = service.lower()
        for s in clinic.services:
            if s.name.lower() in low or low in s.name.lower():
                if s.price_from:
                    return s.price_from
                break
    return clinic.lead_cost


def format_lead_card(
    clinic: Clinic,
    session: dict,
    fields: dict,
    *,
    is_urgent: bool,
    is_night: bool,
    wants_human: bool,
    est_sum: int | None = None,
    resume: str | None = None,
    is_repeat: bool = False,
    wants_callback: bool = False,
    status: str = "new",
) -> str:
    urgency = "urgent" if is_urgent else fields.get("urgency")
    lines = [
        f"🦷 НОВАЯ ЗАЯВКА — {clinic.name}",
        f"Имя: {fields.get('name') or '—'} · Телефон: {fields.get('phone') or '—'}",
        f"Услуга: {fields.get('service') or '—'} · Срочность: {URGENCY_LABELS.get(urgency, '—')}",
        f"Удобное время: {fields.get('preferred_time') or '—'}",
        f"Канал: {channel_label(session['channel'], session['source'])}"
        f" · Источник: {session['source']}",
    ]
    if est_sum and not is_urgent:
        lines.append(f"Ожидаемая сумма: ≈ {est_sum} ₽")
    if resume:
        lines.append(f"Резюме: {resume}")
    if wants_human:
        lines.insert(1, "🙋 Пациент просит живого администратора — свяжитесь как можно скорее")
    if wants_callback:
        lines.append("📞 Просит перезвонить (не хочет переписываться)")
    if is_repeat:
        lines.append("🔁 Повторное обращение с этого номера")
    if fields.get("discount_requested"):
        lines.append("💬 Спрашивал(а) про скидку — цену/условия не обещали, к администратору")
    if is_night:
        lines.append("🌙 Ночная заявка (вне графика клиники)")
    if status == "pending":
        lines.append("⏳ Ожидает подтверждения — нажмите «Подтвердить запись»")
    lines.append(f"⏱ {now_msk().strftime('%d.%m.%Y %H:%M')} · диалог #{session['id']}")
    return "\n".join(lines)


class LeadService:
    def __init__(self, db: Database, clinics: dict[str, Clinic], notifier: GroupNotifier):
        self.db = db
        self.clinics = clinics
        self.notifier = notifier

    async def _build_resume(self, session_id: int) -> str | None:
        """Короткое резюме из реплик пациента (тексты уже редактированы при записи)."""
        dialog = await self.db.full_dialog(session_id)
        user_lines = [m["content"].strip() for m in dialog if m["role"] == "user"]
        if not user_lines:
            return None
        picked = user_lines[-3:]
        text = " / ".join(s[:60] for s in picked)
        return text[:200]

    async def submit(
        self,
        session: dict,
        fields: dict,
        *,
        is_urgent: bool = False,
        is_night: bool = False,
        wants_human: bool = False,
        wants_callback: bool = False,
        status: str = "new",
    ) -> int:
        clinic = self.clinics[session["clinic_slug"]]
        est_sum = estimate_sum(clinic, fields.get("service"))
        recovered = session["source"] == "sms"
        resume = await self._build_resume(session["id"])

        lead_id = await self.db.create_lead(
            session,
            fields,
            is_urgent=is_urgent,
            is_night=is_night,
            wants_human=wants_human,
            status=status,
            est_sum=est_sum,
            resume=resume,
            recovered_from_miss=recovered,
            wants_callback=wants_callback,
        )
        is_repeat = await self.db.phone_seen_before(
            clinic.slug, fields.get("phone") or "", lead_id
        )
        card = format_lead_card(
            clinic,
            session,
            fields,
            is_urgent=is_urgent,
            is_night=is_night,
            wants_human=wants_human,
            est_sum=est_sum,
            resume=resume,
            is_repeat=is_repeat,
            wants_callback=wants_callback,
            status=status,
        )
        try:
            await self.notifier.send_group_message(clinic.tg_group_id, card)
        except Exception as e:
            logger.error(
                "Не удалось отправить карточку лида #{} в группу {}: {}",
                lead_id, clinic.tg_group_id, e,
            )
        logger.info(
            "Лид #{} ({}): {} {}, статус={}, срочно={}, ночь={}, живой={}",
            lead_id, clinic.slug, fields.get("name") or "—",
            mask_phone(fields.get("phone")), status, is_urgent, is_night, wants_human,
        )
        return lead_id
