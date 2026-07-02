"""Telegram-канал: aiogram 3.29+, long polling.

Deep-link формат: t.me/<bot>?start=<clinic_slug>__<src>,
src ∈ {landing, sms, call, qr, site}. Источник хранится в сессии и заявке —
по нему меряется конверсия лендинг→бот→заявка (/stats).

Бот состоит в группах клиник (туда падают карточки лидов), поэтому все
диалоговые хендлеры жёстко отфильтрованы по личным чатам.
"""

from __future__ import annotations

from aiogram import F, Router
from aiogram.enums import ChatType
from aiogram.filters import Command, CommandObject, CommandStart
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
)
from loguru import logger

from app.config import VALID_SOURCES, Clinic, Settings
from app.core.dialogue import DialogueEngine
from app.db import Database

CALL_HUMAN_CB = "call_human"

_human_keyboard = InlineKeyboardMarkup(
    inline_keyboard=[
        [InlineKeyboardButton(text="🙋 Позвать человека", callback_data=CALL_HUMAN_CB)]
    ]
)


class TelegramNotifier:
    """Отправка сообщений в группы клиник (карточки лидов, дайджесты)."""

    def __init__(self, bot):
        self.bot = bot

    async def send_group_message(self, chat_id: int, text: str) -> None:
        await self.bot.send_message(chat_id=chat_id, text=text)


def parse_start_payload(
    payload: str | None, clinics: dict[str, Clinic], default_slug: str
) -> tuple[str, str]:
    """'demo-dent__landing' → (slug, source). Некорректное — клиника по умолчанию."""
    slug, source = default_slug, "direct"
    if payload:
        parts = payload.split("__", 1)
        if parts[0] in clinics:
            slug = parts[0]
        else:
            logger.warning("Deep-link с неизвестной клиникой: {}", payload)
        if len(parts) == 2 and parts[1] in VALID_SOURCES:
            source = parts[1]
    if slug not in clinics:
        slug = next(iter(clinics))
    return slug, source


def create_router(
    engine: DialogueEngine,
    db: Database,
    clinics: dict[str, Clinic],
    settings: Settings,
) -> Router:
    router = Router(name="podkhvat")

    async def _start(message: Message, payload: str | None) -> None:
        slug, source = parse_start_payload(payload, clinics, settings.default_clinic_slug)
        session = await db.reset_session(
            clinic_slug=slug,
            channel="telegram",
            external_id=str(message.chat.id),
            source=source,
        )
        result = await engine.start_session(session)
        for reply in result.replies:
            await message.answer(reply, reply_markup=_human_keyboard)

    @router.message(CommandStart(deep_link=True), F.chat.type == ChatType.PRIVATE)
    async def start_deep_link(message: Message, command: CommandObject) -> None:
        await _start(message, command.args)

    @router.message(CommandStart(), F.chat.type == ChatType.PRIVATE)
    async def start_plain(message: Message) -> None:
        await _start(message, None)

    @router.message(Command("stats"), F.chat.type == ChatType.PRIVATE)
    async def stats(message: Message) -> None:
        if not settings.owner_tg_id or message.from_user.id != settings.owner_tg_id:
            return
        await message.answer(await _build_stats(db, clinics))

    @router.callback_query(F.data == CALL_HUMAN_CB)
    async def call_human(callback: CallbackQuery) -> None:
        await callback.answer()
        if callback.message is None:
            return
        chat_id = callback.message.chat.id
        session = await db.get_or_create_session(
            clinic_slug=settings.default_clinic_slug,
            channel="telegram",
            external_id=str(chat_id),
            source="direct",
        )
        result = await engine.request_human_button(session)
        # Не callback.message.answer(): для сообщений старше 48 ч Telegram
        # отдаёт InaccessibleMessage, у которого нет .answer().
        for reply in result.replies:
            await callback.bot.send_message(chat_id=chat_id, text=reply)

    @router.message(F.chat.type == ChatType.PRIVATE, F.text)
    async def dialogue(message: Message) -> None:
        session = await db.get_or_create_session(
            clinic_slug=settings.default_clinic_slug,
            channel="telegram",
            external_id=str(message.chat.id),
            source="direct",
        )
        result = await engine.handle_message(session, message.text)
        for reply in result.replies:
            await message.answer(reply)

    @router.message(F.chat.type == ChatType.PRIVATE)
    async def non_text(message: Message) -> None:
        await message.answer(
            "Я понимаю только текст 🙂 Напишите, пожалуйста, что вас беспокоит "
            "или какая услуга интересует."
        )

    return router


async def _build_stats(db: Database, clinics: dict[str, Clinic]) -> str:
    """Разбивка заявок по источникам за 7 и 30 дней (команда владельца)."""
    lines = ["📈 Заявки по источникам"]
    for days in (7, 30):
        rows = await db.leads_by_source(days)
        lines.append(f"\n— за {days} дней —")
        if not rows:
            lines.append("пока нет заявок")
            continue
        by_clinic: dict[str, list[str]] = {}
        totals: dict[str, int] = {}
        for r in rows:
            name = clinics[r["clinic_slug"]].name if r["clinic_slug"] in clinics else r["clinic_slug"]
            by_clinic.setdefault(name, []).append(f"{r['source']}: {r['cnt']}")
            totals[r["source"]] = totals.get(r["source"], 0) + r["cnt"]
        for name, parts in by_clinic.items():
            lines.append(f"{name} — " + " · ".join(parts))
        lines.append("Итого: " + " · ".join(f"{s}: {c}" for s, c in sorted(totals.items())))
    return "\n".join(lines)
