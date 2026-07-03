"""Точка входа: FastAPI (виджет + вебхуки Novofon) и aiogram long polling
в одном процессе.

    uv run uvicorn app.main:app --host 0.0.0.0 --port 8000

aiogram запускается фоновой задачей с handle_signals=False — иначе он
перетирает обработчики SIGTERM/SIGINT самого uvicorn (проверено на 3.29).
"""

from __future__ import annotations

import asyncio
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from aiogram import Bot, Dispatcher
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from loguru import logger

from backend.api import router as api_router
from backend.channels.channel_max import MaxAdapter
from backend.channels.channel_sms import SmsAdapter, SmsRuClient
from backend.channels.channel_telegram import TelegramAdapter
from backend.channels.dispatcher import Dispatcher as ChannelDispatcher
from backend.channels.telegram import TelegramNotifier, create_router
from backend.channels.widget_api import router as widget_router
from backend.config import load_clinics, load_settings
from backend.core.dialogue import DialogueEngine
from backend.core.llm import GigaChatLLM
from backend.db import Database
from backend.digest import DigestService
from backend.followups import FollowupService
from backend.leads import LeadService
from backend.missed_calls import SmsAeroClient
from backend.missed_calls import router as novofon_router
from backend.ratelimit import RateLimiter
from backend.report_weekly import WeeklyReport
from backend.webhook_telephony import router as telephony_router

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"


def _setup_logging(level: str, db: Database) -> int:
    logger.remove()
    logger.add(sys.stderr, level=level)

    def db_sink(message) -> None:
        # Ошибки уровня ERROR+ копим в SQLite — вечером они уходят владельцу.
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            return
        record = message.record
        text = f"{record['level'].name} {record['name']}: {record['message']}"
        loop.create_task(db.log_error(text[:500]))

    return logger.add(db_sink, level="ERROR")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = load_settings()
    clinics = load_clinics()

    db = Database(settings.db_path)
    await db.connect()
    sink_id = _setup_logging(settings.log_level, db)

    llm = GigaChatLLM(settings, db)
    bot = Bot(token=settings.bot_token)
    notifier = TelegramNotifier(bot)
    leads = LeadService(db, clinics, notifier)
    engine = DialogueEngine(db, llm, clinics, leads, settings)
    sms = SmsAeroClient(settings.smsaero_email, settings.smsaero_api_key)  # виджет-продукт

    # Этап B: каналы + каскадный диспетчер + лимиты
    ratelimit = RateLimiter(
        telephony_per_min=settings.telephony_per_min,
        sms_daily_per_clinic=settings.sms_daily_limit,
    )
    sms_adapter = SmsAdapter(SmsRuClient(settings.smsru_api_id))
    max_adapter = MaxAdapter(settings.max_bot_token)
    tg_adapter = TelegramAdapter(bot)
    adapters = {"sms": sms_adapter, "max": max_adapter, "telegram": tg_adapter}
    dispatcher = ChannelDispatcher(
        db, max_adapter=max_adapter, sms_adapter=sms_adapter,
        telegram_adapter=tg_adapter, ratelimit=ratelimit,
        notifier=notifier, owner_chat_id=settings.owner_tg_id or None,
    )

    bot_username = None
    try:
        bot_username = (await bot.get_me()).username
    except Exception as e:
        # Не смертельно: missed_calls дозапросит username перед отправкой SMS.
        logger.error("bot.get_me() не удался (нет сети/битый токен?): {}", e)

    app.state.settings = settings
    app.state.clinics = clinics
    app.state.db = db
    app.state.engine = engine
    app.state.notifier = notifier
    app.state.sms = sms
    app.state.bot = bot
    app.state.bot_username = bot_username
    app.state.adapters = adapters
    app.state.dispatcher = dispatcher
    app.state.ratelimit = ratelimit

    dp = Dispatcher()
    dp.include_router(create_router(engine, db, clinics, settings))
    polling_task = asyncio.create_task(
        dp.start_polling(bot, handle_signals=False, close_bot_session=False)
    )

    def _polling_died(task: asyncio.Task) -> None:
        if task.cancelled():
            return
        exc = task.exception()
        if exc:
            # API продолжает работать, но Telegram-канал мёртв — владелец
            # увидит это в вечернем дайджесте (ошибка ляжет в SQLite).
            logger.error("aiogram polling упал: {}", exc)

    polling_task.add_done_callback(_polling_died)

    digest = DigestService(db, clinics, notifier, settings)
    scheduler = digest.start_scheduler()
    weekly = WeeklyReport(db, clinics, notifier, settings)
    weekly_scheduler = weekly.start_scheduler()

    async def _followup_send(session: dict, text: str) -> bool:
        # Пуш возможен только в Telegram-диалог; виджет-пациент опрашивает сам.
        if session.get("channel") == "telegram":
            res = await tg_adapter.send(session["external_id"], text)
            return res.ok
        return False

    followups = FollowupService(db, clinics, _followup_send)
    followups_scheduler = followups.start_scheduler()

    logger.info(
        "Подхват запущен: клиник {}, бот @{}, модель {}",
        len(clinics),
        bot_username or "<неизвестен>",
        settings.gigachat_model,
    )
    try:
        yield
    finally:
        scheduler.shutdown(wait=False)
        weekly_scheduler.shutdown(wait=False)
        followups_scheduler.shutdown(wait=False)
        try:
            await dp.stop_polling()
        except Exception:
            polling_task.cancel()
        try:
            await polling_task
        except (asyncio.CancelledError, Exception):
            pass
        await bot.session.close()
        await llm.close()
        logger.remove(sink_id)
        await db.close()


def build_api_app(lifespan=None) -> FastAPI:
    """FastAPI-приложение без телеграм-обвязки — его же собирают тесты."""
    app = FastAPI(title="Подхват — ИИ-администратор клиники", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        # Виджет живёт на сайтах клиник — origin любой, но БЕЗ credentials:
        # иначе любой сайт мог бы читать диалог пациента по его cookie.
        # Сессия передаётся явным session_id (uuid из localStorage).
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(widget_router)
    app.include_router(novofon_router)
    app.include_router(telephony_router)   # Этап B: вебхук телефонии с clinic_token
    app.include_router(api_router)          # Этап B: REST кабинета

    @app.get("/health")
    async def health():
        db = getattr(app.state, "db", None)
        db_ok = db is not None and db._conn is not None
        return {"status": "ok" if db_ok else "degraded", "db": db_ok, "version": "0.1.0"}

    if STATIC_DIR.is_dir():
        app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
    return app


app = build_api_app(lifespan=lifespan)
