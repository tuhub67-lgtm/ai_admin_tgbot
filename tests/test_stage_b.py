"""Приёмочные тесты Этапа B (MMDV_ПРОМПТ_ПРИЛОЖЕНИЕ.md, Фазы 5 и 7):
20 функциональных + 4 безопасности на demo-клинике demo-dent.

Всё гоняется без сети и ключей: FakeLLM/FakeNotifier (conftest) + фейковые
каналы. Тест #12 (онбординг) — фронтенд-критерий, проверяется отдельно
(см. проверку файла кабинета внизу) и сборкой npm.
"""

from __future__ import annotations

from datetime import date, timedelta
from pathlib import Path

import httpx
import pytest

from backend.auth import create_jwt
from backend.card_builder import confirm_and_notify
from backend.channels.adapter import ChannelAdapter, DeliveryResult
from backend.channels.dispatcher import Dispatcher
from backend.config import Clinic
from backend.main import build_api_app
from backend.ratelimit import RateLimiter
from backend.reliability import compute_streak
from backend.report_weekly import build_weekly_report
from tests.conftest import FakeNotifier, talk

pytestmark = pytest.mark.usefixtures("day_clock")


# --- Вспомогательное ---------------------------------------------------------

class FakeChannel(ChannelAdapter):
    def __init__(self, name, ok=True, can_phone=True):
        self.name = name
        self._ok = ok
        self.can_message_by_phone = can_phone
        self.sent: list[tuple[str, str]] = []

    async def send(self, target, text, buttons=None):
        self.sent.append((target, text))
        return DeliveryResult(ok=self._ok, channel=self.name)

    async def send_by_phone(self, phone, text):
        self.sent.append((phone, text))
        return DeliveryResult(ok=self._ok, channel=self.name)


def make_dispatcher(db, *, max_ok=False, max_can_phone=False, sms_ok=True,
                    ratelimit=None, notifier=None, owner_chat_id=None):
    mx = FakeChannel("max", ok=max_ok, can_phone=max_can_phone)
    sms = FakeChannel("sms", ok=sms_ok)
    disp = Dispatcher(db, max_adapter=mx, sms_adapter=sms,
                      telegram_adapter=FakeChannel("telegram"),
                      ratelimit=ratelimit or RateLimiter(),
                      notifier=notifier, owner_chat_id=owner_chat_id)
    return disp, mx, sms


def make_api(db, clinics, settings, *, dispatcher=None, adapters=None,
             ratelimit=None, notifier=None, bot=None):
    app = build_api_app()
    app.state.db = db
    app.state.clinics = clinics
    app.state.settings = settings
    app.state.notifier = notifier or FakeNotifier()
    app.state.ratelimit = ratelimit or RateLimiter()
    app.state.dispatcher = dispatcher
    app.state.adapters = adapters or {}
    app.state.bot = bot
    app.state.bot_username = "podhvat_bot"
    return app


def client(app):
    return httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test")


def auth_header(settings, slug="demo-dent"):
    return {"Authorization": f"Bearer {create_jwt(slug, settings.jwt_secret)}"}


async def run_full_dialogue(engine, db, session, *, service="Хочу профгигиену"):
    await engine.start_session(session)
    await talk(engine, db, session, service)
    await talk(engine, db, session, "Запись плановая")
    await talk(engine, db, session, "Ольга")
    await talk(engine, db, session, "+7 917 123-45-67")
    return await talk(engine, db, session, "Завтра в 11")


# --- 1. Вебхук пропущенного → сообщение пациенту ≤30 сек (мок) ---------------

async def test_01_missed_call_triggers_message(db, clinics, settings):
    disp, mx, sms = make_dispatcher(db)
    app = make_api(db, clinics, settings, dispatcher=disp)
    async with client(app) as c:
        r = await c.post("/webhook/telephony?clinic_token=demo-clinic-token",
                         data={"caller_id": "+79161234567", "call_start": "2026-06-30 12:00:00"})
    assert r.status_code == 200 and r.json()["delivered"] is True
    assert r.json()["channel"] == "sms"
    assert sms.sent and "+79161234567" in sms.sent[0][0]


# --- 2. Полный диалог: услуга → 2–3 слота → имя → карточка pending -----------

async def test_02_full_dialogue_pending(engine, db, session, notifier):
    await engine.start_session(session)
    await talk(engine, db, session, "Хочу профгигиену")
    await talk(engine, db, session, "Плановая")
    await talk(engine, db, session, "Ольга")
    time_reply = await talk(engine, db, session, "+7 917 123-45-67")
    assert any("свободное время" in r for r in time_reply)  # предложены слоты
    await talk(engine, db, session, "Завтра в 11")

    lead = await db._fetchone("SELECT * FROM leads")
    assert lead["status"] == "pending"
    _, card = notifier.sent[-1]
    assert "Ожидает подтверждения" in card


# --- 3. Ночной запрос → запись на утро, без «записываю сейчас» ---------------

async def test_03_night_request(engine, db, session, notifier, night_clock):
    replies = await run_full_dialogue(engine, db, session)
    assert any("утр" in r.lower() for r in replies)
    assert not any("записываю" in r.lower() for r in replies)
    lead = await db._fetchone("SELECT * FROM leads")
    assert lead["is_night"] == 1 and lead["status"] == "pending"


# --- 4. «Очень болит зуб» → флаг СРОЧНО, ближайший слот ----------------------

async def test_04_acute_pain_urgent(engine, db, session, notifier, clinics):
    await engine.start_session(session)
    replies = await talk(engine, db, session, "Очень болит зуб, опухла щека")
    joined = " ".join(replies)
    assert "103" in joined
    assert "окно" in joined.lower()  # предложено ближайшее свободное окно (ТЗ #4)
    lead = await db._fetchone("SELECT * FROM leads")
    assert lead["is_urgent"] == 1
    _, card = notifier.sent[-1]
    assert "🔴 СРОЧНО" in card


# --- 5. Вопрос цены имплантации → диапазон из прайса + консультация ----------

async def test_05_implant_price_range(engine, db, session, notifier):
    await engine.start_session(session)
    replies = await talk(engine, db, session, "Сколько стоит имплантация?")
    text = " ".join(replies)
    assert "25000" in text.replace(" ", "") and "45000" in text.replace(" ", "")
    assert "врач" in text
    assert notifier.sent == []


# --- 6. Агрессия/мат → вежливая эскалация человеку, пометка в карточке -------

async def test_06_aggression_escalation(engine, db, session, notifier):
    await engine.start_session(session)
    replies = await talk(engine, db, session, "Вы там совсем идиоты, соедините с человеком")
    assert any("администратор" in r.lower() for r in replies)
    lead = await db._fetchone("SELECT * FROM leads")
    assert lead["wants_human"] == 1
    _, card = notifier.sent[-1]
    assert "живого администратора" in card


# --- 7. Нецелевой запрос → вежливый отказ, статус «нецелевой» ----------------

async def test_07_nontarget(engine, db, session, notifier):
    await engine.start_session(session)
    replies = await talk(engine, db, session, "А вы пиццу доставляете?")
    assert any("стоматолог" in r.lower() for r in replies)
    lead = await db._fetchone("SELECT * FROM leads")
    assert lead["status"] == "nontarget"


# --- 8. Молчание → 1 follow-up через 2 часа, не больше ------------------------

async def test_08_single_followup(db, clinics):
    from backend.followups import FollowupService
    from backend.utils import now_msk
    session = await db.get_or_create_session("demo-dent", "telegram", "fu-1", "landing")
    await db.add_message(session["id"], "assistant", "Как к вам обращаться?")
    # Последнее сообщение — 3 часа назад (по тем же «часам», что и запрос)
    old = (now_msk() - timedelta(hours=3)).strftime("%Y-%m-%d %H:%M:%S")
    await db.conn.execute(
        "UPDATE messages SET created_at = ? WHERE session_id = ?", (old, session["id"]),
    )
    await db.conn.commit()

    # Сквозь сервис-планировщик: ровно одно напоминание, второй проход — ноль.
    sent = []
    async def send_fn(s, text):
        sent.append((s["id"], text))
        return True
    svc = FollowupService(db, clinics, send_fn)
    assert await svc.run_once(hours=2) == 1 and len(sent) == 1
    assert await svc.run_once(hours=2) == 0 and len(sent) == 1  # не более одного


# --- 9. Повторный номер → пометка «повторный пациент» ------------------------

async def test_09_repeat_patient(db, clinics, leads):
    s1 = await db.get_or_create_session("demo-dent", "telegram", "rp-1", "landing")
    await leads.submit(s1, {"name": "Пётр", "phone": "+79990001122", "service": "Профгигиена"})
    s2 = await db.get_or_create_session("demo-dent", "telegram", "rp-2", "landing")
    lead_id = await leads.submit(s2, {"name": "Пётр", "phone": "+79990001122", "service": "Профгигиена"})
    lead = await db.get_lead(lead_id, "demo-dent")
    assert lead["is_repeat"] == 1


# --- 10. /week в Штабе → верные суммы ----------------------------------------

async def test_10_week_report(db, clinics, leads):
    s = await db.get_or_create_session("demo-dent", "telegram", "wk-1", "landing")
    for _ in range(2):
        lid = await leads.submit(s, {"name": "N", "phone": "+79990000000", "service": "Имплантация"})
        await db.set_lead_status(lid, "demo-dent", "booked")
    report = await build_weekly_report(db, clinics["demo-dent"])
    assert "Записано: 2" in report
    # Имплантация: середина диапазона 25000–45000 = 35000 × 2 = 70000 ₽ (точная сумма)
    assert "70000 ₽" in report


# --- 11. Каскад: MAX недоступен → SMS fallback ≤30 сек -----------------------

async def test_11_cascade_max_to_sms(db, clinics):
    disp, mx, sms = make_dispatcher(db, max_ok=False, max_can_phone=True, sms_ok=True)
    res = await disp.deliver_first_message("demo-dent", "+79161112233", "текст",
                                           channels=["max", "sms"])
    assert res.ok and res.channel == "sms"
    assert mx.sent and sms.sent  # MAX попробован, затем SMS
    rows = await db._fetchall("SELECT channel, success FROM delivery_attempts ORDER BY id")
    assert [(r["channel"], r["success"]) for r in rows] == [("max", 0), ("sms", 1)]


# --- 12. Онбординг: 4 шага (фронтенд-кабинет) --------------------------------

def test_12_onboarding_four_steps():
    onboarding = Path(__file__).resolve().parent.parent / "src" / "app" / "screens" / "Onboarding.jsx"
    assert onboarding.exists(), "экран онбординга кабинета отсутствует"
    text = onboarding.read_text(encoding="utf-8")
    for marker in ("Телефони", "Расписан", "Прайс", "прогон"):
        assert marker in text, f"шаг онбординга «{marker}» не найден"


# --- 13. Magic-link: 15 минут, протухший отклоняется ------------------------

async def test_13_magic_link_lifecycle(db, clinics, settings):
    ok = "tok-ok"
    await db.create_magic_token(ok, "demo-dent", ttl_minutes=15)
    assert await db.consume_magic_token(ok) == "demo-dent"
    assert await db.consume_magic_token(ok) is None  # одноразовый

    expired = "tok-old"
    await db.create_magic_token(expired, "demo-dent", ttl_minutes=-1)
    assert await db.consume_magic_token(expired) is None  # протух

    app = make_api(db, clinics, settings)
    await db.create_magic_token("tok-api", "demo-dent", ttl_minutes=15)
    async with client(app) as c:
        r = await c.get("/api/auth/verify", params={"token": "tok-api"})
        assert r.status_code == 200 and r.json()["jwt"]
        r2 = await c.get("/api/auth/verify", params={"token": "tok-api"})  # уже использован
        assert r2.status_code == 401


# --- 14. Экран «Деньги»: сумма пилота и день окупаемости --------------------

async def test_14_money_weekly(db, clinics, settings, leads):
    s = await db.get_or_create_session("demo-dent", "telegram", "mn-1", "landing")
    for _ in range(2):
        lid = await leads.submit(s, {"name": "N", "phone": "+79990000001", "service": "Имплантация"})
        await db.set_lead_status(lid, "demo-dent", "booked")
    app = make_api(db, clinics, settings)
    async with client(app) as c:
        r = await c.get("/api/money/weekly", headers=auth_header(settings))
    data = r.json()
    assert data["total"] == 2 * 35000  # середина диапазона 25000–45000
    assert data["payback_day"] == 1    # окупился в первый же день (> 1590 ₽)


# --- 15. Диагноз → [скрыто] в карточке и transcript -------------------------

async def test_15_redaction(db, clinics):
    s = await db.get_or_create_session("demo-dent", "telegram", "rd-1", "landing")
    await db.add_message(s["id"], "user", "Кажется, у меня пульпит и киста на десне")
    dialog = await db.full_dialog(s["id"])
    body = " ".join(m["content"] for m in dialog)
    assert "[скрыто]" in body
    assert "пульпит" not in body and "киста" not in body

    # Redaction также для summary карточки лида (не только transcript)
    s2 = await db.get_or_create_session("demo-dent", "telegram", "rd-2", "landing")
    lid = await db.create_lead(s2, {"name": "N", "phone": "+79990000002"},
                               summary="Со слов пациента — пульпит")
    lead = await db.get_lead(lid, "demo-dent")
    assert "[скрыто]" in (lead["summary"] or "") and "пульпит" not in (lead["summary"] or "")


# --- 16. Тот же номер, 2 пропущенных/день → 2-е автосообщение не уходит ------

async def test_16_daily_message_limit(db, clinics):
    disp, mx, sms = make_dispatcher(db)
    r1 = await disp.deliver_first_message("demo-dent", "+79162223344", "1", channels=["sms"])
    r2 = await disp.deliver_first_message("demo-dent", "+79162223344", "2", channels=["sms"])
    assert r1.ok is True
    assert r2.ok is False and r2.detail == "daily-limit"
    assert len(sms.sent) == 1  # второе сообщение не отправлено


# --- 17. /api/reliability-streak с одним искусственным сбоем ------------------

async def test_17_reliability_streak(db, clinics, settings):
    # Один провальный день 3 дня назад (по номеру все каналы fail)
    await db.conn.execute(
        "INSERT INTO delivery_attempts (clinic_slug, phone, lead_id, channel, success, created_at)"
        " VALUES ('demo-dent','+79160000000',NULL,'sms',0, datetime('now','-3 days'))"
    )
    await db.conn.commit()
    incidents = await db.delivery_incidents("demo-dent")
    assert len(incidents) == 1
    streak = compute_streak([i["date"] for i in incidents], date.today())
    assert streak["current_streak_days"] == 3
    app = make_api(db, clinics, settings)
    async with client(app) as c:
        r = await c.get("/api/reliability-streak", headers=auth_header(settings))
    assert r.json()["current_streak_days"] == 3


# --- 18. Ручной режим: pending → финал только после «Подтвердить» ------------

async def test_18_manual_confirm_idempotent(engine, db, session, notifier):
    await run_full_dialogue(engine, db, session)
    lead = await db._fetchone("SELECT * FROM leads")
    assert lead["status"] == "pending" and lead["confirmed_at"] is None

    tg = FakeChannel("telegram")
    adapters = {"telegram": tg, "sms": FakeChannel("sms")}
    assert tg.sent == []  # до подтверждения пациенту финал НЕ ушёл

    clinic = (await engine_clinic(engine))
    r1 = await confirm_and_notify(db, clinic, lead["id"], adapters)
    assert r1.newly_confirmed is True and len(tg.sent) == 1
    r2 = await confirm_and_notify(db, clinic, lead["id"], adapters)
    assert r2.newly_confirmed is False and len(tg.sent) == 1  # двойного бронирования нет

    booked = await db.get_lead(lead["id"], "demo-dent")
    assert booked["status"] == "booked" and booked["confirmed_at"]


async def engine_clinic(engine):
    return engine.clinics["demo-dent"]


# --- 19. SMS-мост: ссылка в мессенджер + вариант перезвона -------------------

async def test_19_sms_bridge(db, clinics, settings):
    disp, mx, sms = make_dispatcher(db)
    app = make_api(db, clinics, settings, dispatcher=disp)
    async with client(app) as c:
        await c.post("/webhook/telephony?clinic_token=demo-clinic-token",
                     data={"caller_id": "+79164445566", "call_start": "t"})
    assert len(sms.sent) == 1
    _, text = sms.sent[0]
    assert "t.me/" in text and "__call" in text          # ссылка в мессенджер
    assert "перезвон" in text.lower()                     # вариант перезвона


# --- 20. Требование скидки → Анна не обещает, переадресует, карточка помечена -

async def test_20_discount_refused(engine, db, session, notifier):
    await engine.start_session(session)
    reply = await talk(engine, db, session, "Сделайте скидку, дорого у вас")
    assert any("администратор" in r.lower() for r in reply)
    # Дальше — компактно (фикс-часы теста: держимся в пределах антиспам-окна)
    await talk(engine, db, session, "профгигиена, плановая")
    await talk(engine, db, session, "Оля")
    await talk(engine, db, session, "+7 917 000 00 00")
    await talk(engine, db, session, "завтра")
    lead = await db._fetchone("SELECT * FROM leads")
    assert lead["wants_callback"] == 1
    assert lead["summary"] and "скид" in lead["summary"].lower()


# ============================================================================
# Тесты безопасности (Фаза 7)
# ============================================================================

def _second_clinic(clinics):
    data = clinics["demo-dent"].model_dump()
    data.update(slug="vita-dent", name="Вита-Дент", tg_group_id=-100999, clinic_token="vita-token")
    two = dict(clinics)
    two["vita-dent"] = Clinic.model_validate(data)
    return two


# --- (a) Данные клиники A по токену клиники B → отказ ------------------------

async def test_sec_a_tenant_isolation(db, clinics, settings, leads):
    s = await db.get_or_create_session("demo-dent", "telegram", "iso-1", "landing")
    lead_id = await leads.submit(s, {"name": "A", "phone": "+79990009999", "service": "Профгигиена"})
    two = _second_clinic(clinics)
    app = make_api(db, two, settings)
    async with client(app) as c:
        # Токен vita-dent не видит лид demo-dent
        r = await c.get(f"/api/leads/{lead_id}/transcript", headers=auth_header(settings, "vita-dent"))
        assert r.status_code == 404
        r2 = await c.get("/api/leads", headers=auth_header(settings, "vita-dent"))
        assert r2.json()["leads"] == []
        # А своим токеном demo-dent видит
        r3 = await c.get("/api/leads", headers=auth_header(settings, "demo-dent"))
        assert len(r3.json()["leads"]) == 1


# --- (b) Вебхук без валидного clinic_token → отказ --------------------------

async def test_sec_b_webhook_requires_token(db, clinics, settings):
    disp, *_ = make_dispatcher(db)
    app = make_api(db, clinics, settings, dispatcher=disp)
    async with client(app) as c:
        r = await c.post("/webhook/telephony", data={"caller_id": "+79161111111"})
        assert r.status_code == 403
        r2 = await c.post("/webhook/telephony?clinic_token=nope", data={"caller_id": "+79161111111"})
        assert r2.status_code == 403


# --- (c) Превышение SMS-лимита → блок, не молчаливый слив баланса ------------

async def test_sec_c_sms_daily_limit(db, clinics):
    rl = RateLimiter(sms_daily_per_clinic=0)  # лимит исчерпан
    notifier = FakeNotifier()
    disp, mx, sms = make_dispatcher(db, ratelimit=rl, notifier=notifier, owner_chat_id=777)
    res = await disp.deliver_first_message("demo-dent", "+79167778899", "текст", channels=["sms"])
    assert res.ok is False and res.detail == "sms-daily-limit"
    assert sms.sent == []  # ни одной SMS не ушло
    rows = await db._fetchall("SELECT * FROM delivery_attempts WHERE channel='sms'")
    assert rows and rows[0]["success"] == 0  # факт блокировки зафиксирован
    # Не молчаливый отказ: админ уведомлён (Фаза 7)
    assert notifier.sent and any("лимит" in t.lower() for _, t in notifier.sent)


# --- (d) Протухший/использованный magic-link → отказ ------------------------

async def test_sec_d_magic_link_reject(db, clinics, settings):
    app = make_api(db, clinics, settings)
    await db.create_magic_token("used", "demo-dent", ttl_minutes=15)
    await db.consume_magic_token("used")
    await db.create_magic_token("expired2", "demo-dent", ttl_minutes=-5)
    async with client(app) as c:
        assert (await c.get("/api/auth/verify", params={"token": "used"})).status_code == 401
        assert (await c.get("/api/auth/verify", params={"token": "expired2"})).status_code == 401
        assert (await c.get("/api/auth/verify", params={"token": "nonexist"})).status_code == 401
