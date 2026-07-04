"""Приёмка ЭТАПА B: ручной режим записи, кабинет (magic-link + JWT + мультиаренда),
деньги, надёжность, редактирование ПДн, лимиты, каскад, follow-up, скидки, /week.

Дополняет tests/test_acceptance.py (базовые 10 сценариев) до полного набора
20 функциональных + 4 безопасности.
"""

from __future__ import annotations

from datetime import timedelta

import httpx
import pytest

from app import utils
from app.auth import create_jwt
from app.config import Clinic
from app.followups import pending_followups, run_followups
from app.lead_ops import LeadOps
from app.main import build_api_app
from app.reliability import compute_streak
from app.scheduler import generate_slots
from tests.conftest import DAY, FakeSms, talk

pytestmark = pytest.mark.usefixtures("day_clock")


def _api(db, clinics, settings, notifier, engine=None, sms=None):
    app = build_api_app()
    app.state.db = db
    app.state.clinics = clinics
    app.state.settings = settings
    app.state.notifier = notifier
    if engine is not None:
        app.state.engine = engine
    if sms is not None:
        app.state.sms = sms
    app.state.bot_username = "podkhvat_bot"
    return app


def _client(app):
    return httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="https://test")


def _auth(clinic_slug, settings):
    return {"Authorization": f"Bearer {create_jwt(clinic_slug, settings.jwt_secret)}"}


async def _make_lead(db, clinic="demo-dent", *, status="pending", est_sum=4500, source="landing", phone="+79170000001"):
    session = await db.get_or_create_session(clinic, "telegram", f"ext-{phone}", source)
    return await db.create_lead(
        session, {"name": "Ирина", "phone": phone, "service": "Профгигиена", "urgency": "planned"},
        status=status, est_sum=est_sum,
    )


# --- 2 / 4 / 5. Слоты: 2-3 конкретных окна в рабочих часах ------------------

async def test_slots_generated_within_hours(clinics):
    from app.config import parse_work_hours

    sched = parse_work_hours(clinics["demo-dent"].work_hours)  # Пн–Сб 9:00–20:00
    slots = generate_slots(sched, DAY, count=3)
    assert len(slots) == 3
    for s in slots:
        assert s > DAY
        assert sched.start <= s.time() < sched.end
        assert s.weekday() in sched.days


# --- 15. Редактирование диагнозов до записи (карточка + transcript) ---------

async def test_redaction_hides_diagnosis(engine, db, session):
    await engine.start_session(session)
    await talk(engine, db, session, "Подскажите по лечению, у меня пульпит и гепатит")
    dialog = await db.full_dialog(session["id"])
    user_msgs = " ".join(m["content"] for m in dialog if m["role"] == "user")
    assert "[скрыто]" in user_msgs
    assert "пульпит" not in user_msgs.lower()
    assert "гепатит" not in user_msgs.lower()


# --- 18. Ручной режим: pending → подтверждение только по кнопке, без дублей --

async def test_manual_pending_confirm_idempotent(engine, db, session, notifier, clinics):
    await engine.start_session(session)
    for t in ("Хочу профгигиену", "планово", "Ирина", "+7 917 123-45-67", "завтра утром"):
        await talk(engine, db, session, t)

    lead = await db._fetchone("SELECT * FROM leads")
    assert lead["status"] == "pending"           # заявка ждёт подтверждения
    assert lead["patient_notified"] == 0

    ops = LeadOps(db, clinics, notifier)
    before = len(notifier.sent)
    res1 = await ops.confirm("demo-dent", lead["id"], slot="чт 09:30")
    assert res1["status"] == "confirmed"
    after_one = len(notifier.sent)
    assert after_one == before + 1              # ровно один cha-ching в Штаб

    # Повторный тап «Подтвердить» — идемпотентно, без второго сообщения/брони
    res2 = await ops.confirm("demo-dent", lead["id"])
    assert res2["status"] == "confirmed"
    assert len(notifier.sent) == after_one       # второго cha-ching нет

    fresh = await db.get_lead(lead["id"], "demo-dent")
    assert fresh["patient_notified"] == 1
    assert "Вернули ≈" in notifier.sent[-1][1]


# --- 20. Требование скидки → Анна не обещает, переадресует, карточка помечена

async def test_discount_redirect_and_flag(engine, db, session, notifier):
    # Предзаполняем анкету до шага «время», чтобы уложиться в антифлуд (часы заморожены)
    await db.update_session(
        session["id"], state="TIME",
        fields={"service": "Профгигиена", "urgency": "planned", "name": "Ирина",
                "phone": "+79171234567"},
    )
    replies = await talk(engine, db, session, "А сделайте скидку, подешевле можно?")
    assert any("администратор" in r.lower() for r in replies)
    assert not any(any(ch.isdigit() for ch in r) for r in replies)  # цену не называет

    await talk(engine, db, session, "завтра утром")  # завершаем запись
    assert notifier.sent, "ожидалась карточка лида"
    _, card = notifier.sent[-1]
    assert "скидку" in card.lower()


# --- 7. Нецелевой запрос → вежливый отказ, лид не создаём -------------------

async def test_offtopic_declined(engine, db, session, notifier):
    await engine.start_session(session)
    replies = await talk(engine, db, session, "Почём у вас пицца и можно ли заказать такси?")
    assert any("стоматолог" in r.lower() for r in replies)
    assert notifier.sent == []


# --- 8. Молчание → один follow-up через 2ч, не больше ----------------------

async def test_single_followup_after_idle(engine, db, session, clinics):
    await engine.start_session(session)
    await talk(engine, db, session, "Хочу профгигиену")  # активный незавершённый диалог
    # Сдвигаем «сейчас» на 3 часа вперёд → сессия протухла
    utils.set_clock(lambda: DAY + timedelta(hours=3))
    try:
        stale = await pending_followups(db, idle_hours=2)
        assert any(s["id"] == session["id"] for s in stale)

        sent1 = await run_followups(db, clinics, senders={}, idle_hours=2)
        assert sent1 >= 1
        # Второй прогон — follow-up уже был, повторно не шлём
        sent2 = await run_followups(db, clinics, senders={}, idle_hours=2)
        assert sent2 == 0
    finally:
        utils.set_clock(lambda: DAY)


# --- 14. Деньги: сумма недели и день окупаемости = ручной расчёт ------------

async def test_money_weekly_and_payback(db, clinics, settings, notifier):
    # Три записанных лида: 4500 + 5900 + 5900 = 16 300 ₽
    for i, s in enumerate((4500, 5900, 5900)):
        lead_id = await _make_lead(db, est_sum=s, phone=f"+7917000{i:04d}")
        await db.set_lead_status(lead_id, "demo-dent", "confirmed")

    app = _api(db, clinics, settings, notifier)
    async with _client(app) as c:
        r = await c.get("/api/money/weekly", headers=_auth("demo-dent", settings))
        assert r.status_code == 200
        data = r.json()
    assert data["total"] == 16300
    assert data["pilot_paid_back"] is True
    assert data["payback_day"] is not None      # окупился в первый же день накопления


# --- 17. reliability-streak верен на данных с 1 сбоем -----------------------

async def test_reliability_streak_with_one_incident(db, clinics, settings, notifier):
    # Инцидент 5 дней назад
    old = (DAY - timedelta(days=5)).strftime("%Y-%m-%d %H:%M:%S")
    await db.conn.execute(
        "INSERT INTO incidents (clinic_slug, ref, occurred_at, resolved_in_minutes)"
        " VALUES (?, ?, ?, ?)",
        ("demo-dent", "call-x", old, 12),
    )
    # Активность началась 20 дней назад
    older = (DAY - timedelta(days=20)).strftime("%Y-%m-%d %H:%M:%S")
    await db.conn.execute(
        "INSERT INTO missed_calls (call_id, clinic_slug, caller_phone, created_at)"
        " VALUES (?, ?, ?, ?)",
        ("seed", "demo-dent", "+70000000000", older),
    )
    await db.conn.commit()

    streak = await compute_streak(db, "demo-dent")
    assert streak["current_streak_days"] == 5
    assert streak["record_days"] == 15          # 20 дней активности − инцидент на 5-м с конца
    assert streak["last_incident"]["resolved_in_minutes"] == 12

    app = _api(db, clinics, settings, notifier)
    async with _client(app) as c:
        r = await c.get("/api/reliability-streak", headers=_auth("demo-dent", settings))
        assert r.json()["current_streak_days"] == 5


# --- 13 + БЕЗОП (d). Magic-link: 15 мин, протухший/использованный отклонён ---

async def test_magic_link_and_jwt(db, clinics, settings, notifier):
    app = _api(db, clinics, settings, notifier)
    async with _client(app) as c:
        r = await c.post("/api/auth/magic-link", json={"clinic_slug": "demo-dent"})
        assert r.status_code == 200
        token = r.json()["token"]

        # Первое гашение — выдаёт JWT
        r = await c.get("/api/auth/verify", params={"token": token})
        assert r.status_code == 200
        jwt = r.json()["token"]
        assert r.json()["clinic"]["slug"] == "demo-dent"

        # Повторное использование того же токена — отказ (одноразовый)
        r = await c.get("/api/auth/verify", params={"token": token})
        assert r.status_code == 401

        # JWT работает для кабинета
        r = await c.get("/api/leads", headers={"Authorization": f"Bearer {jwt}"})
        assert r.status_code == 200

        # Протухший токен — отказ
        r2 = await c.post("/api/auth/magic-link", json={"clinic_slug": "demo-dent"})
        stale = r2.json()["token"]
        utils.set_clock(lambda: DAY + timedelta(minutes=16))
        try:
            r = await c.get("/api/auth/verify", params={"token": stale})
            assert r.status_code == 401
        finally:
            utils.set_clock(lambda: DAY)


# --- БЕЗОП (a). Данные клиники A по токену B → отказ ------------------------

async def test_tenant_isolation(db, clinics, settings, notifier):
    lead_id = await _make_lead(db, clinic="demo-dent")

    other = Clinic(
        slug="other-clinic", name="Другая клиника", tg_group_id=-100999, city="Москва",
        address="ул. Тестовая, 1", phone_display="+7 (495) 000-00-00", work_hours="Пн–Пт 9:00–18:00",
    )
    clinics2 = {**clinics, "other-clinic": other}
    app = _api(db, clinics2, settings, notifier)
    async with _client(app) as c:
        # Свой лид клиника видит
        r = await c.get("/api/leads", headers=_auth("demo-dent", settings))
        assert any(x["id"] == lead_id for x in r.json()["leads"])

        # Клиника B не видит лид A и не может открыть его transcript
        r = await c.get("/api/leads", headers=_auth("other-clinic", settings))
        assert all(x["id"] != lead_id for x in r.json()["leads"])
        r = await c.get(f"/api/leads/{lead_id}/transcript", headers=_auth("other-clinic", settings))
        assert r.status_code == 404
        # И не может сменить статус чужого лида
        r = await c.post(
            f"/api/leads/{lead_id}/status", json={"status": "lost"},
            headers=_auth("other-clinic", settings),
        )
        assert r.status_code == 404
        # Без токена — 401
        r = await c.get("/api/leads")
        assert r.status_code == 401


# --- БЕЗОП (b). Вебхук: неверный/отсутствующий clinic_token → отказ ---------

async def test_webhook_clinic_token(db, clinics, settings, notifier):
    app = _api(db, clinics, settings, notifier, sms=FakeSms())
    payload = {
        "event": "NOTIFY_END", "call_start": "2026-06-30 11:59:00",
        "pbx_call_id": "tok.1", "caller_id": "+79161234567",
        "called_did": "+78430000001", "duration": "0", "disposition": "cancel",
    }
    async with _client(app) as c:
        # Неверный clinic_token → 403
        r = await c.post("/webhook/novofon?clinic_token=WRONG", data=payload)
        assert r.status_code == 403
        # Верный clinic_token → 200 (demo-dent имеет токен в YAML)
        r = await c.post("/webhook/novofon?clinic_token=demo-dent-token-123", data=payload)
        assert r.status_code == 200 and r.json()["status"] == "ok"


# --- 16. Тот же номер 2 пропущенных/день → второе автосообщение не шлётся ----

async def test_per_number_daily_cap(db, clinics, settings, notifier):
    sms = FakeSms()
    app = _api(db, clinics, settings, notifier, sms=sms)
    base = {
        "event": "NOTIFY_END", "call_start": "2026-06-30 10:00:00",
        "caller_id": "+79161112233", "called_did": "+78430000001",
        "duration": "0", "disposition": "cancel",
    }
    async with _client(app) as c:
        r = await c.post("/webhook/novofon?secret=hook-secret", data={**base, "pbx_call_id": "a1"})
        assert r.json()["sms_sent"] is True
        # Другой звонок (новый call_id), тот же номер, тот же день → SMS не шлём
        r = await c.post("/webhook/novofon?secret=hook-secret", data={**base, "pbx_call_id": "a2"})
        assert r.json()["sms_sent"] is False
    assert len(sms.sent) == 1


# --- БЕЗОП (c). Превышение суточного SMS-лимита → блок + уведомление --------

async def test_sms_daily_cap(db, clinics, settings, notifier):
    settings.sms_daily_cap_per_clinic = 1
    sms = FakeSms()
    app = _api(db, clinics, settings, notifier, sms=sms)
    base = {
        "event": "NOTIFY_END", "call_start": "2026-06-30 10:00:00",
        "called_did": "+78430000001", "duration": "0", "disposition": "cancel",
    }
    async with _client(app) as c:
        r = await c.post("/webhook/novofon?secret=hook-secret",
                         data={**base, "pbx_call_id": "b1", "caller_id": "+79160000001"})
        assert r.json()["sms_sent"] is True
        # Второй номер — лимит уже исчерпан → блок
        r = await c.post("/webhook/novofon?secret=hook-secret",
                         data={**base, "pbx_call_id": "b2", "caller_id": "+79160000002"})
        assert r.json()["sms_sent"] is False
    assert len(sms.sent) == 1
    assert any("лимит SMS" in note for _, note in notifier.sent)


# --- 11. Каскад: MAX недоступен → SMS -------------------------------------

async def test_cascade_max_then_sms(db, clinics):
    from app.channels.dispatcher import Dispatcher
    from app.channels.max_channel import MaxChannel
    from app.channels.sms_channel import SmsChannel

    sms = FakeSms()
    disp = Dispatcher(db, [MaxChannel(), SmsChannel(sms)])
    clinic = clinics["demo-dent"]
    res = await disp.deliver(clinic, "+79161234567", "текст", ref="lead:1", sign="DemoDent")
    assert res.channel == "sms" and res.success is True
    assert len(sms.sent) == 1
    # Зафиксирована успешная доставка по SMS
    row = await db._fetchone(
        "SELECT * FROM delivery_attempts WHERE clinic_slug = ? AND channel = 'sms'", ("demo-dent",)
    )
    assert row["success"] == 1


# --- 10. /week: верные суммы -----------------------------------------------

async def test_weekly_report_sums(db, clinics):
    from app.report_weekly import build_weekly_report

    for i, s in enumerate((4500, 5900)):
        lead_id = await _make_lead(db, est_sum=s, phone=f"+7917111{i:04d}")
        await db.set_lead_status(lead_id, "demo-dent", "confirmed")
    text = await build_weekly_report(db, clinics["demo-dent"])
    assert "Возвращено: ≈ 10400 ₽" in text
    assert "Записано: 2" in text


# --- Витрина: публичная заявка → уведомление владельцу ---------------------

async def test_public_lead_request(db, clinics, settings, notifier):
    app = _api(db, clinics, settings, notifier)
    async with _client(app) as c:
        r = await c.post("/api/public/lead-request", json={
            "name": "Пётр", "clinic": "Улыбка", "phone": "+7 900 111-22-33", "city": "Казань",
        })
        assert r.status_code == 200 and r.json()["ok"] is True
    assert notifier.sent and notifier.sent[-1][0] == settings.owner_tg_id
    assert "Пётр" in notifier.sent[-1][1]
