"""Тест-прогон онбординга «Позвонить самому себе»: реальный диалог Анны.

Проверяем: (1) настоящий потоковый диалог даёт pending-заявку в ленте;
(2) ПДн (имя/телефон) в GigaChat не уходят — только в локальную SQLite;
(3) при недоступном GigaChat прогон не падает и показывает запасные реплики.
"""

from __future__ import annotations

import pytest

from app.core.dialogue import DialogueEngine
from app.leads import LeadService
from app.onboarding import run_test_run
from tests.conftest import FakeLLM
from tests.test_acceptance_b import _api, _client, _login

pytestmark = pytest.mark.usefixtures("day_clock")


async def _drain(engine, clinic):
    events = []
    async for ev in run_test_run(engine, clinic, pause=0):
        events.append(ev)
    return events


class _StreamSpyLLM:
    """Записывает, что реально ушло бы в GigaChat при потоковой генерации."""

    def __init__(self):
        self.inner = FakeLLM()
        self.seen: list[str] = []

    async def generate(self, *, system, history, extract, max_tokens):
        return await self.inner.generate(
            system=system, history=history, extract=extract, max_tokens=max_tokens
        )

    async def stream(self, *, system, history, max_tokens):
        self.seen.append(system)
        self.seen.extend(m["content"] for m in history)
        async for d in self.inner.stream(system=system, history=history, max_tokens=max_tokens):
            yield d

    def all_text(self):
        return "\n".join(self.seen)


async def test_test_run_creates_pending_lead(db, clinics, leads, settings):
    engine = DialogueEngine(db, FakeLLM(), clinics, leads, settings)
    events = await _drain(engine, clinics["demo-dent"])

    types = [e["type"] for e in events]
    assert types[0] == "info"
    assert types[-1] == "done"
    assert types.count("patient") == 5
    assert types.count("anna_start") == 6  # приветствие + 5 шагов до подтверждения
    assert any(e["type"] == "anna_delta" for e in events)

    card = next(e for e in events if e["type"] == "card")
    assert card["lead"]["status"] == "pending"
    assert card["lead"]["service"]

    # Заявка реально в БД (со scope клиники), pending, помечена как тестовая.
    pending = await db.list_leads("demo-dent", status="pending")
    test_leads = [x for x in pending if x["source"] == "test"]
    assert len(test_leads) == 1
    assert test_leads[0]["name"] == "Мария"


async def test_test_run_no_pii_to_llm(db, clinics, leads, settings):
    spy = _StreamSpyLLM()
    engine = DialogueEngine(db, spy, clinics, leads, settings)
    await _drain(engine, clinics["demo-dent"])

    seen = spy.all_text()
    # В GigaChat не ушли ни имя, ни номер (ни в каком виде).
    assert "Мария" not in seen
    assert "9001234567" not in seen
    assert "+79001234567" not in seen

    # Но локально имя и телефон сохранены в заявке.
    lead = (await db.list_leads("demo-dent", status="pending"))[0]
    assert lead["name"] == "Мария"
    assert lead["phone"] == "+79001234567"


async def test_test_run_fallback_when_llm_down(db, clinics, leads, settings):
    llm = FakeLLM()
    llm.fail = True
    engine = DialogueEngine(db, llm, clinics, leads, settings)
    events = await _drain(engine, clinics["demo-dent"])

    done = events[-1]
    assert done["type"] == "done"
    assert done["fallback"] is True
    # Анна не молчит: показаны запасные реплики, и заявка всё равно создана.
    assert any(e["type"] == "anna_delta" and e["text"] for e in events)
    assert any(e["type"] == "card" for e in events)
    assert len(await db.list_leads("demo-dent", status="pending")) == 1


async def test_test_run_endpoint_streams(db, clinics, settings, notifier):
    engine = DialogueEngine(db, FakeLLM(), clinics, LeadService(db, clinics, notifier), settings)
    app = _api(db, clinics, settings, notifier, engine=engine)
    async with _client(app) as c:
        csrf = _login(c, "demo-dent", settings)
        r = await c.get(f"/api/onboarding/test-run?csrf={csrf}")
        assert r.status_code == 200
        assert "text/event-stream" in r.headers["content-type"]
        body = r.text
        assert "data:" in body
        assert '"type": "card"' in body
        assert '"type": "done"' in body


async def test_test_run_endpoint_requires_csrf(db, clinics, settings, notifier):
    engine = DialogueEngine(db, FakeLLM(), clinics, LeadService(db, clinics, notifier), settings)
    app = _api(db, clinics, settings, notifier, engine=engine)
    async with _client(app) as c:
        _login(c, "demo-dent", settings)
        r = await c.get("/api/onboarding/test-run")  # без csrf-параметра
        assert r.status_code == 403
