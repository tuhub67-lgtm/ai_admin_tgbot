"""Карточка лида для Штаба (Telegram-группа) + ручной режим подтверждения.

Формат карточки без медицинских деталей (152-ФЗ). Кнопки:
«Подтвердить запись» (для pending), «Записан / Перезвонить / Потерян».
По тапу «Подтвердить» пациенту уходит финальное сообщение — идемпотентно
(двойной тап не шлёт второе).
"""

from __future__ import annotations

from dataclasses import dataclass

from loguru import logger

from backend.config import Clinic
from backend.db import Database
from backend.utils import now_msk

URGENCY_LABELS = {"planned": "планово", "pain": "болит", "urgent": "🔴 СРОЧНО"}

# Кнопки карточки: (label, action). callback_data = f"lead:{action}:{lead_id}"
CONFIRM_BTN = ("Подтвердить запись", "confirm")
STATUS_BTNS = [
    ("Записан", "booked"),
    ("Перезвонить", "callback"),
    ("Потерян", "lost"),
]


def lead_buttons(lead: dict) -> list[tuple[str, str]]:
    btns: list[tuple[str, str]] = []
    if lead.get("status") == "pending" and not lead.get("confirmed_at"):
        btns.append(CONFIRM_BTN)
    btns.extend(STATUS_BTNS)
    return btns


def format_lead_card(clinic: Clinic, lead: dict) -> str:
    urgency = "urgent" if lead.get("is_urgent") else lead.get("urgency")
    lines = [
        f"🦷 ЗАЯВКА — {clinic.name}",
        f"Имя: {lead.get('name') or '—'} · Телефон: {lead.get('phone') or '—'}",
        f"Услуга: {lead.get('service') or '—'} · Срочность: {URGENCY_LABELS.get(urgency, '—')}",
        f"Желаемое время: {lead.get('preferred_time') or '—'}",
    ]
    if lead.get("summary"):
        lines.append(f"Резюме: {lead['summary']}")
    tags = []
    if lead.get("status") == "pending":
        tags.append("ожидает подтверждения")
    if lead.get("wants_callback"):
        tags.append("просит звонок")
    if lead.get("wants_human"):
        tags.append("просит живого администратора")
    if lead.get("is_repeat"):
        tags.append("повторный пациент")
    if lead.get("is_night"):
        tags.append("🌙 ночная")
    if lead.get("recovered_from_miss"):
        tags.append("спасён из пропущенного")
    if tags:
        lines.append("· " + " · ".join(tags))
    lines.append(f"⏱ {now_msk().strftime('%d.%m.%Y %H:%M')} · лид #{lead.get('id')}")
    return "\n".join(lines)


def final_patient_message(clinic: Clinic, lead: dict) -> str:
    """Финальное подтверждение пациенту после тапа «Подтвердить»."""
    when = lead.get("preferred_time") or "выбранное время"
    return (
        f"Здравствуйте! Клиника {clinic.name}: записали вас на {when}. "
        f"Если планы изменятся — напишите нам. Адрес: {clinic.address}. "
        f"Телефон: {clinic.phone_display}."
    )


def booked_message(clinic: Clinic, lead: dict, *, recovered: bool) -> str:
    """Строка «cha-ching» в Штаб при переходе лида в «Записан»."""
    verb = "Спасено" if recovered else "Вернули"
    total = lead.get("sum_rub") or clinic.service_avg_check(lead.get("service"))
    return f"✅ {lead.get('name') or 'Пациент'} записан(а) — {lead.get('service') or 'приём'}, {lead.get('preferred_time') or ''}\n{verb} ≈ {total} ₽"


def urgent_message(lead: dict) -> str:
    reason = lead.get("service") or "острая боль"
    return f"⚠️ Срочно: {lead.get('name') or 'пациент'}, {reason}"


@dataclass
class ConfirmResult:
    ok: bool
    newly_confirmed: bool
    delivered: bool
    detail: str = ""


async def confirm_and_notify(
    db: Database,
    clinic: Clinic,
    lead_id: int,
    adapters: dict,  # channel -> ChannelAdapter
) -> ConfirmResult:
    """Идемпотентно подтверждает pending-заявку и шлёт пациенту финальное
    сообщение ТОЛЬКО при первом подтверждении. Повторный тап — no-op."""
    newly, lead = await db.confirm_lead(lead_id, clinic.slug)
    if lead is None:
        return ConfirmResult(ok=False, newly_confirmed=False, delivered=False, detail="not-found")
    if not newly:
        # Уже подтверждали — второе финальное сообщение не шлём.
        return ConfirmResult(ok=True, newly_confirmed=False, delivered=False, detail="already")

    channel = lead.get("patient_channel") or "telegram"
    target = lead.get("patient_external_id")
    adapter = adapters.get(channel) or adapters.get("sms")
    delivered = False
    if adapter is not None and target:
        text = final_patient_message(clinic, lead)
        res = await adapter.send(str(target), text)
        delivered = res.ok
        await db.record_delivery_attempt(clinic.slug, lead.get("phone"), adapter.name, res.ok, lead_id)
        if not res.ok:
            logger.warning("Финальное подтверждение лида #{} не доставлено ({})", lead_id, res.detail)
    return ConfirmResult(ok=True, newly_confirmed=True, delivered=delivered)
