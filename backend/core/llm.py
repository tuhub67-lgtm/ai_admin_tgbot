"""Обёртка GigaChat: НОВЫЙ контракт SDK (client.achat.create + ChatCompletionRequest).

Требует gigachat==0.2.2a3 — в стабильном 0.2.1 поверхности chat.create нет
(см. MIGRATION_GUIDE.md репозитория ai-forever/gigachat).

Извлечение полей заявки — function calling (save_lead_fields), а не парсинг
регулярками. Ретраи ×2, таймаут 15 с, лимит токенов на ответ, расход токенов
пишется в SQLite для дайджеста владельцу.

Важно про модели: id «GigaChat-Lite» не существует. Лёгкая (Lite) модель —
это id "GigaChat" (1-е поколение) или "GigaChat-2" (2-е). По умолчанию
используем GigaChat-2.
"""

from __future__ import annotations

import asyncio

from gigachat import GigaChat
from gigachat.models import (
    ChatCompletionRequest,
    ChatFunctionSpecification,
    ChatMessage,
    ChatModelOptions,
    ChatTool,
    ChatToolConfig,
)
from loguru import logger

from backend.config import Settings
from backend.core.llm_base import LLMResult
from backend.db import Database

RETRIES = 2  # повторов после первой попытки
TIMEOUT_SECONDS = 15.0

SAVE_LEAD_FIELDS = ChatFunctionSpecification(
    name="save_lead_fields",
    description=(
        "Сохраняет данные заявки пациента по мере их появления в диалоге. "
        "Вызывай каждый раз, когда пациент сообщил что-то новое: услугу, "
        "срочность, имя, телефон или удобное время. Передавай только те поля, "
        "которые пациент явно назвал."
    ),
    parameters={
        "type": "object",
        "properties": {
            "service": {
                "type": "string",
                "description": "Услуга, которая интересует пациента",
            },
            "urgency": {
                "type": "string",
                "enum": ["planned", "pain"],
                "description": "planned — плановая запись; pain — беспокоит или болит сейчас",
            },
            "name": {"type": "string", "description": "Имя пациента"},
            "phone": {
                "type": "string",
                "description": "Телефон пациента, как он его написал",
            },
            "preferred_time": {
                "type": "string",
                "description": "Удобные день и время визита словами пациента",
            },
        },
    },
)


def _extract_function_call(message) -> dict | None:
    """function_call может лежать на сообщении или внутри content-части."""
    fc = getattr(message, "function_call", None)
    if fc is None:
        for part in message.content or []:
            part_fc = getattr(part, "function_call", None)
            if part_fc is not None:
                fc = part_fc
                break
    if fc is None or fc.name != SAVE_LEAD_FIELDS.name:
        return None
    args = fc.arguments
    return dict(args) if isinstance(args, dict) else None


def _extract_text(message) -> str:
    parts = message.content or []
    if isinstance(parts, str):
        return parts.strip()
    return "".join(getattr(p, "text", None) or "" for p in parts).strip()


class GigaChatLLM:
    def __init__(self, settings: Settings, db: Database | None = None):
        self.settings = settings
        self.db = db
        self._client = GigaChat(
            credentials=settings.gigachat_credentials,
            scope=settings.gigachat_scope,
            model=settings.gigachat_model,
            verify_ssl_certs=settings.gigachat_verify_ssl,
            ca_bundle_file=settings.gigachat_ca_bundle_file,
            timeout=TIMEOUT_SECONDS,
        )

    async def close(self) -> None:
        aclose = getattr(self._client, "aclose", None)
        if aclose:
            await aclose()

    async def generate(
        self,
        *,
        system: str,
        history: list[dict[str, str]],
        extract: bool,
        max_tokens: int,
    ) -> LLMResult:
        messages = [ChatMessage(role="system", content=system)]
        for m in history:
            messages.append(ChatMessage(role=m["role"], content=m["content"]))

        payload = ChatCompletionRequest(
            model=self.settings.gigachat_model,
            messages=messages,
            model_options=ChatModelOptions(temperature=0.5, max_tokens=max_tokens),
        )
        if extract:
            payload.tools = [ChatTool(functions={"specifications": [SAVE_LEAD_FIELDS]})]
            payload.tool_config = ChatToolConfig(mode="auto")

        last_error: Exception | None = None
        for attempt in range(RETRIES + 1):
            try:
                response = await self._client.achat.create(payload)
                return await self._parse_response(response)
            except Exception as e:
                last_error = e
                logger.warning(
                    "GigaChat: попытка {}/{} не удалась: {}", attempt + 1, RETRIES + 1, e
                )
                if attempt < RETRIES:
                    await asyncio.sleep(1 + attempt)
        raise RuntimeError(f"GigaChat недоступен после {RETRIES + 1} попыток: {last_error}")

    async def _parse_response(self, response) -> LLMResult:
        total = 0
        usage = getattr(response, "usage", None)
        if usage is not None:
            total = usage.total_tokens or 0
            if self.db:
                try:
                    await self.db.add_token_usage(
                        getattr(usage, "input_tokens", None) or 0,
                        getattr(usage, "output_tokens", None) or 0,
                        total,
                    )
                except Exception as e:
                    logger.warning("Не записан расход токенов: {}", e)

        if not response.messages:
            return LLMResult(total_tokens=total)
        message = response.messages[0]
        return LLMResult(
            text=_extract_text(message) or None,
            fields=_extract_function_call(message) or {},
            total_tokens=total,
        )
