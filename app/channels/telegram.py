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

from app.auth import authorized_clinics, issue_magic_token
from app.config import VALID_SOURCES, Clinic, Settings
from app.core.dialogue import DialogueEngine
from app.db import Database
from app.ratelimit import RateLimiter

CALL_HUMAN_CB = "call_human"

_human_keyboard = InlineKeyboardMarkup(
    inline_keyboard=[
        [InlineKeyboardButton(text="🙋 Позвать человека", callback_data=CALL_HUMAN_CB)]
    ]
)


def _markup(buttons: list[tuple[str, str]] | None) -> InlineKeyboardMarkup | None:
    """[(подпись, callback_data), …] → клавиатура по 2 кнопки в ряд."""
    if not buttons:
        return None
    rows, row = [], []
    for label, data in buttons:
        row.append(InlineKeyboardButton(text=label, callback_data=data))
        if len(row) == 2:
            rows.append(row)
            row = []
    if row:
        rows.append(row)
    return InlineKeyboardMarkup(inline_keyboard=rows)


class TelegramNotifier:
    """Отправка сообщений в группы клиник (карточки лидов, дайджесты)."""

    def __init__(self, bot):
        self.bot = bot

    async def send_group_message(self, chat_id: int, text: str, buttons=None) -> None:
        await self.bot.send_message(chat_id=chat_id, text=text, reply_markup=_markup(buttons))


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


def _clinic_by_group(clinics: dict[str, Clinic], chat_id: int) -> Clinic | None:
    for c in clinics.values():
        if c.tg_group_id == chat_id:
            return c
    return None


def create_router(
    engine: DialogueEngine,
    db: Database,
    clinics: dict[str, Clinic],
    settings: Settings,
    lead_ops=None,
) -> Router:
    router = Router(name="podkhvat")
    login_rl = RateLimiter(max_events=5, window_seconds=300)  # анти-перебор /login на пользователя

    async def _deliver_login(message: Message) -> None:
        """Вход в кабинет: выдаём magic-link ТОЛЬКО владельцу (Telegram уже
        аутентифицировал пользователя), доставляем ссылку ему же в чат."""
        user_id = message.from_user.id if message.from_user else 0
        if not login_rl.allow(str(user_id)):
            await message.answer("Слишком часто. Попробуйте через пару минут.")
            return
        allowed = authorized_clinics(user_id, clinics, settings.owner_tg_id)
        if not allowed:
            await message.answer(
                "У вас пока нет доступа к кабинету. Подключение оформляет основатель — "
                "напишите ему, и вас добавят."
            )
            return
        lines = ["Ваши одноразовые ссылки для входа в кабинет (действуют 15 минут):"]
        for clinic in allowed:
            token = await issue_magic_token(db, clinic.slug, user_id)
            lines.append(f"\n• {clinic.name}:\n{settings.public_base_url}/app/enter?token={token}")
        lines.append("\nНикому не пересылайте эти ссылки.")
        await message.answer("\n".join(lines))

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

    @router.message(Command("login"), F.chat.type == ChatType.PRIVATE)
    async def login(message: Message) -> None:
        await _deliver_login(message)

    @router.message(CommandStart(deep_link=True), F.chat.type == ChatType.PRIVATE)
    async def start_deep_link(message: Message, command: CommandObject) -> None:
        # Кнопка «Войти» с витрины ведёт на ?start=login → вход в кабинет.
        if (command.args or "").strip() == "login":
            await _deliver_login(message)
            return
        await _start(message, command.args)

    @router.message(CommandStart(), F.chat.type == ChatType.PRIVATE)
    async def start_plain(message: Message) -> None:
        await _start(message, None)

    @router.message(Command("stats"), F.chat.type == ChatType.PRIVATE)
    async def stats(message: Message) -> None:
        if not settings.owner_tg_id or message.from_user.id != settings.owner_tg_id:
            return
        await message.answer(await _build_stats(db, clinics))

    @router.message(Command("week"), F.chat.type == ChatType.PRIVATE)
    async def week(message: Message) -> None:
        # Ручной еженедельный отчёт владельцу.
        if not settings.owner_tg_id or message.from_user.id != settings.owner_tg_id:
            return
        from app.report_weekly import build_weekly_report

        parts = [await build_weekly_report(db, c) for c in clinics.values()]
        await message.answer("\n\n".join(parts))

    @router.callback_query(F.data.startswith("lead:"))
    async def lead_action(callback: CallbackQuery) -> None:
        # Кнопки Штаба под карточкой лида: подтвердить/записан/перезвонить/потерян.
        await callback.answer()
        if lead_ops is None or callback.message is None:
            return
        try:
            _, action, lead_id_s = callback.data.split(":", 2)
            lead_id = int(lead_id_s)
        except (ValueError, AttributeError):
            return
        clinic = _clinic_by_group(clinics, callback.message.chat.id)
        if clinic is None:
            return
        status = {"confirm": "confirmed", "booked": "booked",
                  "callback": "callback", "lost": "lost"}.get(action)
        if status is None:
            return
        if action == "confirm":
            lead = await lead_ops.confirm(clinic.slug, lead_id)
        else:
            lead = await lead_ops.set_status(clinic.slug, lead_id, status)
        if lead is None:
            return
        labels = {"confirmed": "✅ Запись подтверждена",
                  "booked": "✅ Отмечено: записан", "callback": "📞 На перезвон",
                  "lost": "Отмечено: потерян"}
        await callback.bot.send_message(
            chat_id=callback.message.chat.id, text=f"{labels[status]} (лид #{lead_id})"
        )

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
