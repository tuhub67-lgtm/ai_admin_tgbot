"""Защита от перерасхода — это и безопасность, и деньги.

- телефония: N событий/мин с одного номера (фейковые «пропущенные» жгут баланс SMS);
- SMS: дневной лимит на клинику (баг или атака не должны слить баланс);
- GigaChat: лимит на диалог (max_messages_per_session в движке диалога).

При достижении лимита — стоп + лог + уведомление админа, не молчаливый отказ.
"""

from __future__ import annotations

from collections import deque

from backend.db import Database
from backend.utils import now_msk


class RateLimiter:
    def __init__(
        self,
        *,
        telephony_per_min: int = 5,
        sms_daily_per_clinic: int = 100,
    ):
        self.telephony_per_min = telephony_per_min
        self.sms_daily_per_clinic = sms_daily_per_clinic
        self._tel_hits: dict[str, deque] = {}

    def allow_telephony(self, phone: str) -> bool:
        """Скользящее окно 60 секунд на номер."""
        now = now_msk().timestamp()
        hits = self._tel_hits.setdefault(phone, deque())
        hits.append(now)
        while hits and now - hits[0] > 60:
            hits.popleft()
        return len(hits) <= self.telephony_per_min

    async def allow_sms(self, db: Database, clinic_slug: str) -> bool:
        """Дневной лимит SMS на клинику — считаем реальные попытки в БД."""
        sent = await db.count_channel_attempts_today(clinic_slug, "sms")
        return sent < self.sms_daily_per_clinic
