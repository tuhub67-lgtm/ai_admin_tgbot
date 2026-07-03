"""Штаб-бот: команды и кнопки для владельца/администратора в Telegram.

- /login → magic-link для входа в кабинет (passwordless).
- /week  → недельный отчёт по запросу (тот же, что уходит по понедельникам).
- кнопки карточки лида: «Подтвердить запись» / «Записан» / «Перезвонить» /
  «Потерян». По «Подтвердить» пациенту уходит финальное сообщение (идемпотентно).

Router подключается к тому же боту, что и диалог с пациентами (в этой версии —
единый токен; SHTAB_BOT_TOKEN может задать отдельного бота).
"""

from __future__ import annotations

from aiogram import F, Router
from aiogram.filters import Command
from aiogram.types import CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup, Message
from loguru import logger

from backend.auth import issue_magic_link
from backend.card_builder import confirm_and_notify
from backend.config import Clinic, Settings
from backend.db import Database
from backend.report_weekly import build_weekly_report

ACTION_LABELS = {"booked": "Записан", "callback": "Перезвонить", "lost": "Потерян"}
ACTION_STATUS = {"booked": "booked", "callback": "dialog", "lost": "lost"}


def build_keyboard(lead: dict) -> InlineKeyboardMarkup:
    rows = []
    if lead.get("status") == "pending" and not lead.get("confirmed_at"):
        rows.append([InlineKeyboardButton(
            text="Подтвердить запись", callback_data=f"lead:confirm:{lead['id']}"
        )])
    rows.append([
        InlineKeyboardButton(text="Записан", callback_data=f"lead:booked:{lead['id']}"),
        InlineKeyboardButton(text="Перезвонить", callback_data=f"lead:callback:{lead['id']}"),
        InlineKeyboardButton(text="Потерян", callback_data=f"lead:lost:{lead['id']}"),
    ])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def _clinic_by_chat(clinics: dict[str, Clinic], chat_id: int, default_slug: str) -> Clinic | None:
    for c in clinics.values():
        if c.tg_group_id == chat_id:
            return c
    return clinics.get(default_slug)


def create_shtab_router(
    db: Database,
    clinics: dict[str, Clinic],
    settings: Settings,
    adapters: dict,
) -> Router:
    router = Router(name="shtab")

    @router.message(Command("login"))
    async def cmd_login(message: Message) -> None:
        clinic = _clinic_by_chat(clinics, message.chat.id, settings.default_clinic_slug)
        if clinic is None:
            await message.answer("Не удалось определить клинику для входа.")
            return
        link = await issue_magic_link(db, clinic.slug, settings.public_base_url)
        await message.answer(
            f"Вход в кабинет «{clinic.name}» (ссылка одноразовая, 15 минут):\n{link}"
        )

    @router.message(Command("week"))
    async def cmd_week(message: Message) -> None:
        clinic = _clinic_by_chat(clinics, message.chat.id, settings.default_clinic_slug)
        if clinic is None:
            return
        await message.answer(await build_weekly_report(db, clinic))

    @router.callback_query(F.data.startswith("lead:"))
    async def on_lead_action(cq: CallbackQuery) -> None:
        try:
            _, action, lead_id_s = cq.data.split(":")
            lead_id = int(lead_id_s)
        except ValueError:
            await cq.answer("Некорректная кнопка")
            return
        clinic = _clinic_by_chat(clinics, cq.message.chat.id, settings.default_clinic_slug)
        if clinic is None:
            await cq.answer("Клиника не найдена")
            return

        if action == "confirm":
            result = await confirm_and_notify(db, clinic, lead_id, adapters)
            if not result.ok:
                await cq.answer("Лид не найден")
                return
            if result.newly_confirmed:
                await cq.answer("Подтверждено — пациенту отправлено")
            else:
                await cq.answer("Уже было подтверждено")  # идемпотентность
        elif action in ACTION_STATUS:
            await db.set_lead_status(lead_id, clinic.slug, ACTION_STATUS[action])
            await cq.answer(ACTION_LABELS[action])
        else:
            await cq.answer("Неизвестное действие")
            return

        # Обновим клавиатуру под новый статус лида.
        lead = await db.get_lead(lead_id, clinic.slug)
        if lead is not None and cq.message is not None:
            try:
                await cq.message.edit_reply_markup(reply_markup=build_keyboard(lead))
            except Exception as e:
                logger.debug("Не удалось обновить клавиатуру карточки: {}", e)

    return router
