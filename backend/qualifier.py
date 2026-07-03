"""Квалификатор: извлечение и нормализация полей заявки из диалога.

GigaChat через function calling (см. core/llm.py) возвращает поля
{service, urgency, name, phone, preferred_time}; здесь они мержатся в
накопленные поля сессии с нормализацией (телефон → +7XXXXXXXXXX, urgency
только planned|pain — 'urgent' ставит детерминированный протокол боли).
"""

from __future__ import annotations

from backend.utils import normalize_phone

FIELDS = ("service", "urgency", "name", "phone", "preferred_time")
LLM_URGENCY = {"planned", "pain"}


def merge_fields(current: dict, extracted: dict) -> dict:
    """Возвращает новые поля: current + валидные значения из extracted."""
    merged = dict(current)
    for key in FIELDS:
        value = extracted.get(key)
        if not value or not str(value).strip():
            continue
        value = str(value).strip()
        if key == "phone":
            phone = normalize_phone(value)
            if phone:
                merged["phone"] = phone
            continue
        if key == "urgency":
            if value in LLM_URGENCY:
                merged["urgency"] = value
            continue
        merged[key] = value
    return merged
