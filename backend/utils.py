"""Утилиты: телефоны, маскирование персданных в логах, время (Europe/Moscow).

Время берётся только через now_msk() — единая точка, которую подменяют тесты
(сценарий «ночная заявка») и которая гарантирует таймзону клиник в РФ.
"""

from __future__ import annotations

import re
from datetime import datetime
from zoneinfo import ZoneInfo

MSK = ZoneInfo("Europe/Moscow")

# Тесты и эмуляция времени подменяют _clock, остальной код зовёт now_msk().
_clock = lambda: datetime.now(MSK)  # noqa: E731


def now_msk() -> datetime:
    return _clock()


def set_clock(fn) -> None:
    global _clock
    _clock = fn


_PHONE_RE = re.compile(r"(?:\+?7|8)[\s(-]*(\d{3})[\s)-]*(\d{3})[\s-]*(\d{2})[\s-]*(\d{2})")


def normalize_phone(text: str) -> str | None:
    """Достаёт и нормализует российский номер: → «+7XXXXXXXXXX» или None.

    Принимает +7 / 8 / 7 и 10 цифр в любом привычном написании, в том числе
    внутри длинной фразы («Мой номер 8 917 123-45-67, звоните после 18»).
    """
    digits = re.sub(r"\D", "", text)
    if len(digits) == 11 and digits[0] in "78":
        return "+7" + digits[1:]
    if len(digits) == 10 and digits[0] == "9":
        return "+7" + digits
    m = _PHONE_RE.search(text)
    if m:
        return "+7" + "".join(m.groups())
    return None


def looks_like_phone_attempt(text: str) -> bool:
    """Пользователь явно пытался ввести номер: ≥5 цифр в сообщении либо
    строка, начинающаяся как телефон («8…», «+7…»), даже оборванная («89аб»)."""
    if len(re.sub(r"\D", "", text)) >= 5:
        return True
    return bool(re.match(r"\s*\+?[78]\d", text))


def mask_phone(phone: str | None) -> str:
    """+79171234567 → +7***4567. В логи и уведомления — только так (152-ФЗ)."""
    if not phone:
        return "неизвестен"
    digits = re.sub(r"\D", "", phone)
    if len(digits) < 4:
        return "+7***"
    return f"+7***{digits[-4:]}"
