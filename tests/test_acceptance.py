"""Чек-лист приёмки — 10 сценариев из ТЗ, в исходном порядке."""

from __future__ import annotations

import httpx
import pytest

from backend.core import prompts
from backend.main import build_api_app
from tests.conftest import talk

pytestmark = pytest.mark.usefixtures("day_clock")


# 1. «Хочу профгигиену» → полная анкета → карточка со всеми полями.
async def test_01_full_flow(engine, db, session, notifier, clinics):
    start = await engine.start_session(session)
    assert "Анна" in start.replies[0]

    await talk(engine, db, session, "Хочу профгигиену")
    await talk(engine, db, session, "Запись плановая")
    await talk(engine, db, session, "Ирина")
    await talk(engine, db, session, "+7 917 123-45-67")
    replies = await talk(engine, db, session, "Завтра после обеда")

    assert any("15 минут" in r for r in replies)

    assert len(notifier.sent) == 1
    chat_id, card = notifier.sent[0]
    assert chat_id == clinics["demo-dent"].tg_group_id
    assert "🦷 НОВАЯ ЗАЯВКА — Клиника Демо-Дент" in card
    assert "Ирина" in card
    assert "+79171234567" in card
    assert "Профгигиена" in card
    assert "планово" in card
    assert "Завтра после обеда" in card
    assert "Канал: Telegram" in card
    assert "Источник: landing" in card
    assert f"диалог #{session['id']}" in card

    lead = await db._fetchone("SELECT * FROM leads")
    assert lead["name"] == "Ирина"
    assert lead["phone"] == "+79171234567"
    assert lead["service"] == "Профгигиена"
    assert lead["urgency"] == "planned"
    assert lead["source"] == "landing"
    assert lead["is_night"] == 0

    # Полный лог диалога сохранён в SQLite
    dialog = await db.full_dialog(session["id"])
    assert len(dialog) >= 10


# 2. «Сколько стоит имплант?» → диапазон из прайса + слот на консультацию
#    (Этап B, ТЗ приложения #5: цены — только диапазоны из прайс-конфига,
#    точную стоимость называет врач на осмотре).
async def test_02_implant_price(engine, db, session, notifier, clinics):
    clinic = clinics["demo-dent"]
    system = prompts.build_system_prompt(clinic, "SERVICE")
    assert "только диапазоны из прайса" in system

    await engine.start_session(session)
    replies = await talk(engine, db, session, "Сколько стоит имплант?")
    text = " ".join(replies).replace(" ", "").replace(" ", "")
    # Диапазон из прайса (25000–45000) + честное «назовёт врач», без выдуманной точной цены
    assert "25000" in text and "45000" in text
    assert "врач" in " ".join(replies)
    assert notifier.sent == []  # заявки/лида ещё нет


# 3. Острая боль → протокол, 🔴 СРОЧНО немедленно.
async def test_03_acute_pain(engine, db, session, notifier, clinics):
    await engine.start_session(session)
    replies = await talk(engine, db, session, "Болит зуб прямо сейчас, опухла щека")

    assert any("Похоже, вам нужна помощь срочно" in r for r in replies)
    assert any(clinics["demo-dent"].phone_display in r for r in replies)
    assert any("103" in r for r in replies)

    assert len(notifier.sent) == 1
    _, card = notifier.sent[0]
    assert "🔴 СРОЧНО" in card

    lead = await db._fetchone("SELECT * FROM leads")
    assert lead["is_urgent"] == 1
    # Анкета не продолжается
    fresh = await db._fetchone("SELECT state FROM sessions WHERE id = ?", (session["id"],))
    assert fresh["state"] == "DONE"


# 4. Телефон «89аб» → мягкий переспрос; валидный → принят.
async def test_04_phone_validation(engine, db, session, notifier):
    await db.update_session(
        session["id"],
        state="PHONE",
        fields={"service": "Профгигиена", "urgency": "planned", "name": "Ирина"},
    )
    replies = await talk(engine, db, session, "89аб")
    assert any("ещё раз" in r or "опечатка" in r for r in replies)
    fresh = await db._fetchone("SELECT state FROM sessions WHERE id = ?", (session["id"],))
    assert fresh["state"] == "PHONE"  # шаг не продвинулся

    replies = await talk(engine, db, session, "89171234567")
    fresh = await db._fetchone("SELECT * FROM sessions WHERE id = ?", (session["id"],))
    assert fresh["state"] == "TIME"
    import json

    assert json.loads(fresh["fields_json"])["phone"] == "+79171234567"
    assert replies  # спросил про время


# 5. «Ты бот?» → честный ответ, диалог продолжается.
async def test_05_are_you_bot(engine, db, session, notifier, clinics):
    system = prompts.build_system_prompt(clinics["demo-dent"], "SERVICE")
    assert "цифровой помощник" in system  # честность зашита железным правилом

    await engine.start_session(session)
    replies = await talk(engine, db, session, "Ты бот?")
    assert any("цифровой помощник" in r for r in replies)
    fresh = await db._fetchone("SELECT * FROM sessions WHERE id = ?", (session["id"],))
    assert fresh["state"] != "DONE"  # диалог продолжается
    assert notifier.sent == []

    replies = await talk(engine, db, session, "Хочу профгигиену")
    assert replies  # анкета идёт дальше


# 6. «Позовите человека» на шаге 2 → лид «просит живого» немедленно.
async def test_06_call_human(engine, db, session, notifier):
    await engine.start_session(session)
    await talk(engine, db, session, "Хочу профгигиену")  # шаг 2 — срочность
    replies = await talk(engine, db, session, "Позовите человека, пожалуйста")

    assert any("администратор" in r.lower() for r in replies)
    assert len(notifier.sent) == 1
    _, card = notifier.sent[0]
    assert "просит живого администратора" in card
    assert "Профгигиена" in card  # уже известные поля — в карточке

    lead = await db._fetchone("SELECT * FROM leads")
    assert lead["wants_human"] == 1


# 7. Грубость/флуд → лимиты и антиспам работают, тон спокойный.
async def test_07_flood_and_limits(engine, db, session, notifier):
    await engine.start_session(session)
    # Флуд: >5 сообщений мгновенно (часы заморожены — всё в одну секунду)
    for _ in range(5):
        await talk(engine, db, session, "эй!!")
    warn = await talk(engine, db, session, "але, ты тут?!")
    assert warn and "по одному сообщению" in warn[0]
    muted = await talk(engine, db, session, "отвечай!!!")
    assert muted == []  # пауза: бот молчит, пока флуд не стихнет
    assert notifier.sent == []  # никакой заявки из мусора


async def test_07b_session_message_limit(engine, db, session, settings, clinics):
    await engine.start_session(session)
    await db.conn.execute(
        "UPDATE sessions SET message_count = ? WHERE id = ?",
        (settings.max_messages_per_session, session["id"]),
    )
    await db.conn.commit()
    replies = await talk(engine, db, session, "и что дальше")
    assert any(clinics["demo-dent"].phone_display in r for r in replies)
    fresh = await db._fetchone("SELECT state FROM sessions WHERE id = ?", (session["id"],))
    assert fresh["state"] == "LIMIT"  # честное состояние: заявки не было


# 8. Виджет: сценарий №1 из браузера → канал «виджет», source=site.
async def test_08_widget_flow(engine, db, clinics, settings, notifier, llm):
    app = build_api_app()
    app.state.db = db
    app.state.clinics = clinics
    app.state.engine = engine
    app.state.settings = settings
    app.state.notifier = notifier

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="https://test") as client:
        r = await client.post("/api/chat/start", json={"clinic": "demo-dent"})
        assert r.status_code == 200
        data = r.json()
        sid = data["session_id"]
        assert data["clinic"]["name"] == "Клиника Демо-Дент"
        assert any("Анна" in m["content"] for m in data["messages"])

        for text in (
            "Хочу профгигиену",
            "Запись плановая",
            "Ирина",
            "+7 917 123-45-67",
        ):
            r = await client.post(
                "/api/chat/message", json={"session_id": sid, "text": text}
            )
            assert r.status_code == 200
        r = await client.post(
            "/api/chat/message", json={"session_id": sid, "text": "Завтра после обеда"}
        )
        assert any("15 минут" in m["content"] for m in r.json()["messages"])

        # Поллинг отдаёт историю ответов ассистента
        r = await client.get("/api/chat/poll", params={"session_id": sid, "after_id": 0})
        assert r.status_code == 200
        assert len(r.json()["messages"]) >= 5

    assert len(notifier.sent) == 1
    _, card = notifier.sent[0]
    assert "Канал: виджет" in card
    assert "Источник: site" in card

    lead = await db._fetchone("SELECT * FROM leads")
    assert lead["channel"] == "widget"
    assert lead["source"] == "site"


# 9. Вебхук Novofon: SMS + уведомление; повторный call_id → игнор.
async def test_09_novofon_webhook(engine, db, clinics, settings, notifier):
    from tests.conftest import FakeSms

    sms = FakeSms()
    app = build_api_app()
    app.state.db = db
    app.state.clinics = clinics
    app.state.engine = engine
    app.state.settings = settings
    app.state.notifier = notifier
    app.state.sms = sms
    app.state.bot_username = "podkhvat_bot"

    payload = {
        "event": "NOTIFY_END",
        "call_start": "2026-06-30 11:59:00",
        "pbx_call_id": "in_171983.123",
        "caller_id": "+79161234567",
        "called_did": "+78430000001",
        "duration": "0",
        "disposition": "cancel",
    }
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="https://test") as client:
        # Валидация URL кабинетом Novofon (zd_echo)
        r = await client.get("/webhook/novofon", params={"zd_echo": "ping123"})
        assert r.status_code == 200 and r.text == "ping123"

        # Без секрета — отлуп
        r = await client.post("/webhook/novofon", data=payload)
        assert r.status_code == 403

        r = await client.post("/webhook/novofon?secret=hook-secret", data=payload)
        assert r.status_code == 200
        assert r.json()["sms_sent"] is True

        # Повторный call_id → игнор, второй SMS нет
        r = await client.post("/webhook/novofon?secret=hook-secret", data=payload)
        assert r.json()["status"] == "duplicate"

    assert len(sms.sent) == 1
    phone, text, sign = sms.sent[0]
    assert phone == "+79161234567"
    assert "Клиника Демо-Дент" in text
    assert "?start=demo-dent__sms" in text
    assert clinics["demo-dent"].phone_display in text
    assert sign == "DemoDent"

    assert len(notifier.sent) == 1
    chat_id, note = notifier.sent[0]
    assert chat_id == clinics["demo-dent"].tg_group_id
    assert "📵 Пропущенный звонок" in note
    assert "+7***4567" in note
    assert "+79161234567" not in note  # в уведомлении телефон замаскирован

    row = await db._fetchone("SELECT * FROM missed_calls")
    assert row["call_id"] == "in_171983.123"
    assert row["sms_sent"] == 1


# 10. Ночная заявка → пометка «ночная», честная фраза в CONFIRM.
async def test_10_night_lead(engine, db, session, notifier, night_clock):
    await db.update_session(
        session["id"],
        state="TIME",
        fields={
            "service": "Профгигиена",
            "urgency": "planned",
            "name": "Ирина",
            "phone": "+79171234567",
        },
    )
    replies = await talk(engine, db, session, "Завтра утром")

    assert any("утром" in r for r in replies)
    assert not any("15 минут" in r for r in replies)  # ночью не обещаем 15 минут

    lead = await db._fetchone("SELECT * FROM leads")
    assert lead["is_night"] == 1
    _, card = notifier.sent[0]
    assert "🌙 Ночная заявка" in card
