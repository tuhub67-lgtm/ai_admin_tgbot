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

from app.api import router as cabinet_router
from app.channels.telegram import TelegramNotifier, create_router
from app.channels.widget_api import router as widget_router
from app.config import load_clinics, load_settings
from app.core.dialogue import DialogueEngine
from app.core.llm import GigaChatLLM
from app.db import Database
from app.digest import DigestService
from app.leads import LeadService
from app.missed_calls import SmsAeroClient
from app.missed_calls import router as novofon_router

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
APP_VERSION = "0.2.0"


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
    sms = SmsAeroClient(settings.smsaero_email, settings.smsaero_api_key)

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
    app.include_router(cabinet_router)

    @app.get("/health")
    async def health():
        # Healthcheck: доступность БД + версия (для мониторинга/деплоя).
        db = getattr(app.state, "db", None)
        db_ok = None
        if db is not None:
            try:
                await db._scalar("SELECT 1")
                db_ok = True
            except Exception:  # noqa: BLE001
                db_ok = False
        return {
            "status": "degraded" if db_ok is False else "ok",
            "db": db_ok,
            "version": APP_VERSION,
        }

    if STATIC_DIR.is_dir():
        app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
    return app


app = build_api_app(lifespan=lifespan)
