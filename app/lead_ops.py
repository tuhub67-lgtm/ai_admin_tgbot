"""Операции над лидом: смена статуса, подтверждение записи (ручной режим),
реалтайм-реакция «cha-ching» в Штаб. Используется и кабинетом (api.py), и
кнопками Штаб-бота — логика одна.

Идемпотентность:
- confirm() создаёт финальное подтверждение пациенту РОВНО один раз
  (флаг patient_notified 0→1 атомарно) — двойной тап «Подтвердить» не плодит
  ни двойную бронь, ни второе сообщение;
- cha-ching в Штаб шлём только на первом переходе в записанный статус.
"""

from __future__ import annotations

from collections import defaultdict, deque

from loguru import logger

from app.config import Clinic
from app.db import Database
from app.leads import GroupNotifier
from app.utils import now_msk

VALID_STATUSES = {"new", "pending", "confirmed", "booked", "callback", "lost"}
_RECOVERED_STATUSES = {"confirmed", "booked"}

# Батчинг cha-ching: если за это окно уже была запись — шлём компактную строку
# с нарастающим итогом, а не полный текст (чтобы не спамить Штаб в час пик).
BATCH_WINDOW_SECONDS = 15 * 60


def cha_ching_text(clinic: Clinic, lead: dict, *, first_ever: bool) -> str:
    name = lead.get("name") or "Пациент"
    service = lead.get("service") or "приём"
    slot = lead.get("slot") or lead.get("preferred_time") or "уточняется"
    rub = lead.get("est_sum") or clinic.lead_cost
    verb = "Спасено" if lead.get("recovered_from_miss") else "Вернули"
    head = f"✅ {name} записан(а) — {service}, {slot}"
    money = f"{verb} ≈ {rub} ₽"
    if first_ever:
        return (
            f"{head}\n{money}\n\n"
            "🎉 Это первая запись через Подхват. Так и будет: пропущенный звонок → "
            "пациент в кресле. Дальше — больше."
        )
    return f"{head}\n{money}"


class LeadOps:
    def __init__(self, db: Database, clinics: dict[str, Clinic], notifier: GroupNotifier):
        self.db = db
        self.clinics = clinics
        self.notifier = notifier
        # clinic_slug -> deque[(timestamp, est_sum)] за окно батчинга
        self._recent: dict[str, deque] = defaultdict(deque)

    async def set_status(self, clinic_slug: str, lead_id: int, status: str) -> dict | None:
        """Меняет статус лида в рамках клиники. Возвращает обновлённый лид или None."""
        if status not in VALID_STATUSES:
            raise ValueError(f"недопустимый статус: {status}")
        lead = await self.db.get_lead(lead_id, clinic_slug)
        if lead is None:
            return None
        await self.db.set_lead_status(lead_id, clinic_slug, status)
        if status in _RECOVERED_STATUSES:
            await self._on_recovered(clinic_slug, lead_id)
        return await self.db.get_lead(lead_id, clinic_slug)

    async def confirm(self, clinic_slug: str, lead_id: int, slot: str | None = None) -> dict | None:
        """Подтверждение записи (pending→confirmed). Идемпотентно: финальное
        уведомление пациенту и cha-ching в Штаб — ровно один раз."""
        lead = await self.db.get_lead(lead_id, clinic_slug)
        if lead is None:
            return None
        await self.db.set_lead_status(lead_id, clinic_slug, "confirmed", slot=slot)
        await self._on_recovered(clinic_slug, lead_id)
        return await self.db.get_lead(lead_id, clinic_slug)

    async def _on_recovered(self, clinic_slug: str, lead_id: int) -> None:
        # Первый переход в записанный статус: одно сообщение пациенту + cha-ching.
        first_time = await self.db.mark_patient_notified(lead_id, clinic_slug)
        if not first_time:
            return  # уже уведомляли — идемпотентность, второй брони/сообщения нет
        clinic = self.clinics[clinic_slug]
        lead = await self.db.get_lead(lead_id, clinic_slug)

        # Батчинг: сколько записей уже было за последние 15 минут у этой клиники.
        now = now_msk().timestamp()
        rec = self._recent[clinic_slug]
        while rec and now - rec[0][0] > BATCH_WINDOW_SECONDS:
            rec.popleft()
        in_window = len(rec)
        rub = lead.get("est_sum") or clinic.lead_cost
        rec.append((now, rub))

        if in_window == 0:
            # Первая за окно — полноценный cha-ching (первая за всё время — тёплый текст).
            confirmed_count = await self.db._scalar(
                "SELECT COUNT(*) FROM leads WHERE clinic_slug = ? AND patient_notified = 1"
                " AND status IN ('confirmed', 'booked')",
                (clinic_slug,),
            )
            text = cha_ching_text(clinic, lead, first_ever=confirmed_count <= 1)
        else:
            # 2+ за 15 минут — компактная строка с нарастающим итогом (батч).
            total = sum(s for _, s in rec)
            name = lead.get("name") or "Пациент"
            service = lead.get("service") or "приём"
            text = (
                f"✅ Ещё запись: {name} — {service}.\n"
                f"За 15 минут: {len(rec)} записей, вернули ≈ {total} ₽"
            )
        try:
            await self.notifier.send_group_message(clinic.tg_group_id, text)
        except Exception as e:
            logger.error("cha-ching не доставлен (лид #{}): {}", lead_id, e)
        logger.info(
            "Лид #{} ({}) записан на {}, вернули ≈ {} ₽",
            lead_id, clinic_slug, lead.get("slot") or lead.get("preferred_time") or "—",
            lead.get("est_sum"),
        )
