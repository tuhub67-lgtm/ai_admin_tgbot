"""Интерфейс LLM, от которого зависит движок диалога.

Реализация для GigaChat — app/core/llm.py; тесты подставляют FakeLLM.
Разделение позволяет прогонять все 10 приёмочных сценариев без сети и ключей.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol


@dataclass
class LLMResult:
    text: str | None = None
    fields: dict[str, Any] = field(default_factory=dict)
    total_tokens: int = 0


class BaseLLM(Protocol):
    async def generate(
        self,
        *,
        system: str,
        history: list[dict[str, str]],
        extract: bool,
        max_tokens: int,
    ) -> LLMResult:
        """history — [{'role': 'user'|'assistant', 'content': ...}].

        extract=True подключает function calling save_lead_fields: модель может
        вернуть извлечённые поля заявки в LLMResult.fields (и тогда text может
        быть пустым). extract=False — только текст реплики.
        """
        ...
