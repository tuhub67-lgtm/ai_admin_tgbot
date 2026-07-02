"""Дополнительно к чек-листу: дайджест, /stats-агрегация, deep-link,
устойчивость к падению LLM, маскирование телефонов."""

from __future__ import annotations

import pytest

from app.channels.telegram import parse_start_payload
from app.digest import DigestService
from app.utils import mask_phone
from tests.conftest import talk

pytestmark = pytest.mark.usefixtures("day_clock")


async def test_llm_down_fallbacks(engine, db, session, llm):
    """LLM лежит — бот не молчит, отвечает детерминированными фразами."""
    await engine.start_session(session)
    llm.fail = True
    replies = await talk(engine, db, session, "Хочу профгигиену")
    assert replies and replies[0]  # ответ есть несмотря на падение LLM


async def test_urgent_protocol_works_without_llm(engine, db, session, llm, notifier):
    """Протокол острой боли не зависит от LLM вообще."""
    llm.fail = True
    await engine.start_session(session)
    replies = await talk(engine, db, session, "Острая боль, кровотечение после удаления")
    assert any("103" in r for r in replies)
    assert len(notifier.sent) == 1


def test_deep_link_parsing(clinics):
    assert parse_start_payload("demo-dent__landing", clinics, "demo-dent") == (
        "demo-dent",
        "landing",
    )
    assert parse_start_payload("demo-dent__sms", clinics, "demo-dent") == ("demo-dent", "sms")
    # Неизвестный источник → direct, неизвестная клиника → по умолчанию
    assert parse_start_payload("demo-dent__evil", clinics, "demo-dent") == (
        "demo-dent",
        "direct",
    )
    assert parse_start_payload("nope__landing", clinics, "demo-dent") == (
        "demo-dent",
        "landing",
    )
    assert parse_start_payload(None, clinics, "demo-dent") == ("demo-dent", "direct")


async def test_digest(engine, db, session, notifier, clinics, settings):
    """Дайджест клинике и владельцу: цифры дня + расход токенов."""
    await engine.start_session(session)
    await talk(engine, db, session, "Болит зуб прямо сейчас")  # → срочный лид
    await db.add_token_usage(100, 50, 150)
    notifier.sent.clear()

    digest = DigestService(db, clinics, notifier, settings)
    await digest.send_daily_digests()

    assert len(notifier.sent) == 2  # группа клиники + владелец
    clinic_msg = notifier.sent[0][1]
    assert "Клиника Демо-Дент, за сегодня: диалогов 1 · заявок 1" in clinic_msg
    assert "спасённой рекламы" in clinic_msg
    assert "3 000" in clinic_msg  # 1 лид × lead_cost

    owner_chat, owner_msg = notifier.sent[1]
    assert owner_chat == settings.owner_tg_id
    assert "GigaChat: 150 токенов" in owner_msg


async def test_stats_by_source(engine, db, notifier, clinics):
    from app.channels.telegram import _build_stats

    s1 = await db.get_or_create_session("demo-dent", "telegram", "1", "landing")
    s2 = await db.get_or_create_session("demo-dent", "telegram", "2", "sms")
    for s in (s1, s2):
        await db.create_lead(s, {"name": "X", "phone": "+79001112233"})
    text = await _build_stats(db, clinics)
    assert "landing: 1" in text
    assert "sms: 1" in text
    assert "за 7 дней" in text and "за 30 дней" in text


def test_phone_masking():
    assert mask_phone("+79171234567") == "+7***4567"
    assert mask_phone("89171234567") == "+7***4567"
    assert mask_phone(None) == "неизвестен"
