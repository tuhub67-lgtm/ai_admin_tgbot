"""Регрессионные тесты на находки adversarial-ревью."""

from __future__ import annotations

import asyncio

import httpx
import pytest

from backend.config import Clinic, Service, Settings
from backend.core.dialogue import detect_human_request, detect_urgent
from backend.main import build_api_app
from backend.utils import normalize_phone
from tests.conftest import talk

pytestmark = pytest.mark.usefixtures("day_clock")


# --- Регэкспы протокола острой боли ------------------------------------------

URGENT_TRUE = [
    "Болит зуб прямо сейчас, опухла щека",
    "Острая боль, кровотечение после удаления",
    "У меня сильная зубная боль",
    "Адская боль",
    "Очень болит зуб",
    "Зуб сломался, что делать?",
    "У меня зуб раскололся",
    "Выбили зуб на тренировке",
    "Кровь идёт и не останавливается",
    "Сильно кровоточит десна",
    "Невыносимо ноет под коронкой",
    "Флюс на щеке",
]

URGENT_FALSE = [
    "Сейчас ничего не болит, хочу плановую чистку",
    "Болит, но не сильно, запись плановая",
    "Зуб не опух, просто скол",
    "У вас есть травматолог?",
    "Интересует атравматичное удаление",
    "Кровоточат дёсны при чистке",
    "Хочу профгигиену",
    "Сколько стоит имплант?",
]


@pytest.mark.parametrize("text", URGENT_TRUE)
def test_urgent_detected(text):
    assert detect_urgent(text), text


@pytest.mark.parametrize("text", URGENT_FALSE)
def test_urgent_not_detected(text):
    assert not detect_urgent(text), text


HUMAN_TRUE = [
    "Позовите человека",
    "Позовите, пожалуйста, человека",
    "Позовите мне живого администратора",
    "Переключите на человека",
    "Свяжите меня с администратором",
    "Хочу поговорить с оператором",
    "Оператор",
    "Человека позовите, а",
    "Нужен живой человек",
]

HUMAN_FALSE = [
    "Я сменил оператора, номер новый",
    "Мой оператор связи блокирует звонки",
    "Позвоните мне завтра",
    "Запишите меня к врачу",
]


@pytest.mark.parametrize("text", HUMAN_TRUE)
def test_human_detected(text):
    assert detect_human_request(text), text


@pytest.mark.parametrize("text", HUMAN_FALSE)
def test_human_not_detected(text):
    assert not detect_human_request(text), text


# --- Телефон в длинной фразе ---------------------------------------------------

def test_phone_embedded_in_text():
    assert normalize_phone("Мой номер 8 917 123-45-67, звоните после 18") == "+79171234567"
    assert normalize_phone("+7 (917) 123-45-67 — после обеда") == "+79171234567"
    assert normalize_phone("завтра в 15:30") is None


# --- Гонка: два сообщения одновременно — поля не теряются ----------------------

async def test_concurrent_messages_do_not_lose_fields(engine, db, session, llm):
    await engine.start_session(session)

    orig = llm.generate

    async def slow_generate(**kwargs):
        await asyncio.sleep(0.05)
        return await orig(**kwargs)

    llm.generate = slow_generate
    await asyncio.gather(
        talk(engine, db, session, "Нужна профгигиена"),
        talk(engine, db, session, "Запись плановая"),
    )
    import json

    fresh = await db._fetchone("SELECT * FROM sessions WHERE id = ?", (session["id"],))
    fields = json.loads(fresh["fields_json"])
    assert fields.get("service") == "Профгигиена"
    assert fields.get("urgency") == "planned"


# --- Срочный сигнал после закрытия анкеты --------------------------------------

async def test_urgent_after_done_creates_lead_once(engine, db, session, notifier):
    await engine.start_session(session)
    await talk(engine, db, session, "Позовите человека")  # → DONE, лид 1
    assert len(notifier.sent) == 1

    replies = await talk(engine, db, session, "У меня кровь идёт и не останавливается!")
    assert any("103" in r for r in replies)  # протокол сработал даже после DONE
    assert len(notifier.sent) == 2  # новый срочный лид

    replies = await talk(engine, db, session, "Кровотечение не проходит!!")
    assert replies  # реплика с телефоном есть
    assert len(notifier.sent) == 2  # но дубль лида не создан


# --- Лимит сообщений: честный ответ + частичный лид ----------------------------

async def test_limit_is_honest_and_saves_partial_lead(
    engine, db, session, settings, clinics, notifier
):
    await db.update_session(
        session["id"],
        state="TIME",
        fields={"service": "Профгигиена", "urgency": "planned", "name": "Ирина",
                "phone": "+79171234567"},
    )
    await db.conn.execute(
        "UPDATE sessions SET message_count = ? WHERE id = ?",
        (settings.max_messages_per_session, session["id"]),
    )
    await db.conn.commit()

    replies = await talk(engine, db, session, "а ещё вопрос")
    assert any(clinics["demo-dent"].phone_display in r for r in replies)
    # Телефон уже был собран — клиника получает частичный лид
    lead = await db._fetchone("SELECT * FROM leads")
    assert lead is not None and lead["phone"] == "+79171234567"

    # Следующие сообщения не врут про «заявку у администратора» — совет позвонить
    replies = await talk(engine, db, session, "ау")
    assert any(clinics["demo-dent"].phone_display in r for r in replies)
    assert not any("уже у администратора" in r for r in replies)


# --- Кнопка «Позвать человека» идемпотентна ------------------------------------

async def test_human_button_idempotent(engine, db, session, notifier):
    await engine.start_session(session)
    await engine.request_human_button(session)
    assert len(notifier.sent) == 1
    replies = (await engine.request_human_button(session)).replies
    assert len(notifier.sent) == 1  # второй лид не создан
    assert any("уже у администратора" in r for r in replies)


# --- Виджет: смена клиники не разрушает чужую сессию ---------------------------

async def test_widget_clinic_switch_keeps_other_session(
    engine, db, clinics, settings, notifier
):
    clinics["vita-dent"] = Clinic(
        slug="vita-dent",
        name="Вита-Дент",
        tg_group_id=-100999,
        city="Казань",
        address="ул. Другая, 2",
        phone_display="+7 (843) 111-11-11",
        work_hours="Пн–Сб 9:00–20:00",
        services=[Service(name="Консультация", price_from=0)],
    )
    engine._schedules["vita-dent"] = engine._schedules["demo-dent"]

    app = build_api_app()
    app.state.db = db
    app.state.clinics = clinics
    app.state.engine = engine
    app.state.settings = settings
    app.state.notifier = notifier

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="https://test") as client:
        r1 = await client.post("/api/chat/start", json={"clinic": "demo-dent"})
        sid1 = r1.json()["session_id"]
        await client.post(
            "/api/chat/message", json={"session_id": sid1, "text": "Хочу профгигиену"}
        )

        # Тот же браузер (cookie) открывает виджет другой клиники
        r2 = await client.post("/api/chat/start", json={"clinic": "vita-dent"})
        sid2 = r2.json()["session_id"]
        assert sid2 != sid1

    # Сессия первой клиники жива вместе с собранными полями
    import json

    row = await db._fetchone(
        "SELECT * FROM sessions WHERE channel='widget' AND external_id = ?", (sid1,)
    )
    assert row is not None
    assert json.loads(row["fields_json"]).get("service") == "Профгигиена"


# --- Вебхук Novofon: fail closed и незнакомые события --------------------------

async def test_novofon_unknown_event_not_403_with_signature_check(
    engine, db, clinics, notifier
):
    from tests.conftest import FakeSms

    settings = Settings(
        bot_token="1:test",
        owner_tg_id=777,
        gigachat_credentials="x",
        novofon_webhook_secret="hook-secret",
        novofon_api_secret="api-secret",
    )
    app = build_api_app()
    app.state.db = db
    app.state.clinics = clinics
    app.state.engine = engine
    app.state.settings = settings
    app.state.notifier = notifier
    app.state.sms = FakeSms()
    app.state.bot_username = "podkhvat_bot"

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="https://test") as client:
        # Незнакомое событие без подписи → мягкий ignore, не 403
        # (Novofon отключает вебхуки, которые постоянно отвечают ошибками)
        r = await client.post(
            "/webhook/novofon?secret=hook-secret",
            data={"event": "NOTIFY_INTERNAL_END", "pbx_call_id": "x"},
        )
        assert r.status_code == 200
        assert r.json()["status"] == "ignored"

        # NOTIFY_END без подписи при включённой проверке → 403
        r = await client.post(
            "/webhook/novofon?secret=hook-secret",
            data={
                "event": "NOTIFY_END",
                "caller_id": "+79161234567",
                "called_did": "+78430000001",
                "call_start": "2026-06-30 11:00:00",
                "pbx_call_id": "y",
                "disposition": "cancel",
            },
        )
        assert r.status_code == 403


async def test_novofon_fails_closed_without_secret(engine, db, clinics, notifier):
    from tests.conftest import FakeSms

    settings = Settings(
        bot_token="1:test",
        owner_tg_id=777,
        gigachat_credentials="x",
        novofon_webhook_secret="",  # секрет не настроен
    )
    app = build_api_app()
    app.state.db = db
    app.state.clinics = clinics
    app.state.engine = engine
    app.state.settings = settings
    app.state.notifier = notifier
    app.state.sms = FakeSms()
    app.state.bot_username = "podkhvat_bot"

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="https://test") as client:
        r = await client.post(
            "/webhook/novofon", data={"event": "NOTIFY_END", "disposition": "cancel"}
        )
        assert r.status_code == 403


# --- YAML с кавычками в названии не ломает загрузку ----------------------------

def test_add_clinic_yaml_escaping(tmp_path, monkeypatch):
    import scripts.add_clinic as ac

    monkeypatch.setattr(ac, "CLINICS_DIR", tmp_path)
    clinic = Clinic(
        slug="ulybka",
        name='Стоматология "Улыбка"',
        tg_group_id=-100123,
        city="Казань",
        address='ТЦ "Центр", офис 5',
        phone_display="+7 (843) 222-22-22",
        work_hours="Пн–Сб 9:00–20:00",
        services=[Service(name='Чистка "AirFlow"', price_from=3000)],
    )
    path = ac.write_yaml(clinic)
    from backend.config import load_clinics

    loaded = load_clinics(tmp_path)
    assert loaded["ulybka"].name == 'Стоматология "Улыбка"'
    assert loaded["ulybka"].services[0].name == 'Чистка "AirFlow"'
    assert path.exists()
