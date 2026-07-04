"""Общие фикстуры: БД во временном файле, FakeLLM (детерминированная эмуляция
function calling GigaChat), фейковые нотификатор и SMS-клиент, управляемые часы.

Все 10 приёмочных сценариев гоняются без сети и без ключей.
"""

from __future__ import annotations

from datetime import datetime

import pytest

from app import utils
from app.config import Settings, load_clinics
from app.core import prompts
from app.core.dialogue import DialogueEngine
from app.core.llm_base import LLMResult
from app.db import Database
from app.leads import LeadService
from app.utils import MSK

# Вторник, рабочий день клиники demo-dent (Пн–Сб 9:00–20:00)
DAY = datetime(2026, 6, 30, 12, 0, tzinfo=MSK)
NIGHT = datetime(2026, 6, 30, 23, 0, tzinfo=MSK)

SERVICE_MAP = {
    "профгигиен": "Профгигиена",
    "имплант": "Имплантация",
    "кариес": "Лечение кариеса",
    "консультац": "Консультация",
}


class FakeLLM:
    """Эмулирует GigaChat: извлекает поля из последней реплики пользователя
    так же, как это делала бы модель через save_lead_fields."""

    def __init__(self):
        self.fail = False
        self.calls = 0

    async def generate(self, *, system, history, extract, max_tokens):
        self.calls += 1
        if self.fail:
            raise RuntimeError("LLM down")
        goal = next((k for k, v in prompts.STEP_GOALS.items() if v in system), "SERVICE")
        last_user = next(
            (m["content"] for m in reversed(history) if m["role"] == "user"), ""
        )
        low = last_user.lower()

        if "ты бот" in low or "ты робот" in low:
            return LLMResult(
                text=(
                    "Да, я цифровой помощник клиники, живой администратор "
                    "подключится сразу после заявки. Какая услуга вас интересует?"
                )
            )

        fields: dict = {}
        if extract:
            for marker, service in SERVICE_MAP.items():
                if marker in low:
                    fields["service"] = service
                    break
            if "планов" in low:
                fields["urgency"] = "planned"
            elif "болит" in low or "беспоко" in low:
                fields["urgency"] = "pain"
            if goal == "NAME" and last_user:
                fields["name"] = last_user.strip()
            if goal == "PHONE" and last_user:
                fields["phone"] = last_user
            if goal == "TIME" and last_user:
                fields["preferred_time"] = last_user.strip()

        if fields:
            return LLMResult(text=None, fields=fields, total_tokens=42)
        text = prompts.FALLBACK_REPLIES.get(goal, prompts.FALLBACK_REPLIES["SERVICE"])
        return LLMResult(
            text=text.format(name="Клиника Демо-Дент", phone_display="+7 (843) 000-00-00"),
            total_tokens=42,
        )

    async def stream(self, *, system, history, max_tokens):
        """Эмулирует потоковую генерацию: реплику под цель шага отдаём по словам
        (как GigaChat client.achat.stream). Только текст, без function calling."""
        self.calls += 1
        if self.fail:
            raise RuntimeError("LLM down")
        goal = next((k for k, v in prompts.STEP_GOALS.items() if v in system), "SERVICE")
        text = prompts.FALLBACK_REPLIES.get(goal, prompts.FALLBACK_REPLIES["SERVICE"]).format(
            name="Клиника Демо-Дент", phone_display="+7 (843) 000-00-00"
        )
        words = text.split(" ")
        for i, w in enumerate(words):
            yield w if i == 0 else " " + w


class FakeNotifier:
    def __init__(self):
        self.sent: list[tuple[int, str]] = []
        self.buttons: list[list[tuple[str, str]] | None] = []

    async def send_group_message(self, chat_id: int, text: str, buttons=None) -> None:
        self.sent.append((chat_id, text))
        self.buttons.append(buttons)


class FakeSms:
    configured = True

    def __init__(self):
        self.sent: list[tuple[str, str, str | None]] = []

    async def send_sms(self, phone: str, text: str, sign: str | None = None) -> dict:
        self.sent.append((phone, text, sign))
        return {"id": 1, "extendStatus": "queue"}


@pytest.fixture
def day_clock():
    utils.set_clock(lambda: DAY)
    yield
    utils.set_clock(lambda: datetime.now(MSK))


@pytest.fixture
def night_clock():
    utils.set_clock(lambda: NIGHT)
    yield
    utils.set_clock(lambda: datetime.now(MSK))


@pytest.fixture
def settings() -> Settings:
    return Settings(
        bot_token="1:test",
        owner_tg_id=777,
        gigachat_credentials="test-key",
        novofon_webhook_secret="hook-secret",
        jwt_secret="test-jwt-secret-please-change",
    )


@pytest.fixture
def clinics():
    return load_clinics()


@pytest.fixture
async def db(tmp_path):
    database = Database(str(tmp_path / "test.db"))
    await database.connect()
    yield database
    await database.close()


@pytest.fixture
def notifier() -> FakeNotifier:
    return FakeNotifier()


@pytest.fixture
def llm() -> FakeLLM:
    return FakeLLM()


@pytest.fixture
def leads(db, clinics, notifier) -> LeadService:
    return LeadService(db, clinics, notifier)


@pytest.fixture
def engine(db, llm, clinics, leads, settings) -> DialogueEngine:
    return DialogueEngine(db, llm, clinics, leads, settings)


@pytest.fixture
async def session(db):
    return await db.get_or_create_session(
        clinic_slug="demo-dent", channel="telegram", external_id="100500", source="landing"
    )


async def talk(engine, db, session, text: str) -> list[str]:
    """Отправить сообщение и вернуть ответы, обновив состояние сессии из БД."""
    fresh = await db._fetchone("SELECT * FROM sessions WHERE id = ?", (session["id"],))
    result = await engine.handle_message(dict(fresh), text)
    return result.replies
