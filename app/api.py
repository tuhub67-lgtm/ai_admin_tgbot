"""API веб-кабинета. Все приватные эндпоинты скоупятся по clinic_slug из JWT —
кабинет клиники A не может прочитать данные клиники B (проверяется в тестах).

Публичный эндпоинт один: заявка с витрины (/api/public/lead-request).
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request, Response
from loguru import logger
from pydantic import BaseModel

from app.auth import (
    CSRF_COOKIE,
    JWT_TTL_HOURS,
    SESSION_COOKIE,
    consume_magic_token,
    create_jwt,
    issue_magic_token,
    new_csrf,
    session_payload,
)
from app.lead_ops import VALID_STATUSES, LeadOps
from app.money import weekly_money
from app.ratelimit import RateLimiter, client_ip
from app.reliability import compute_streak
from app.utils import mask_phone

router = APIRouter(prefix="/api", tags=["cabinet"])


def _rl(request: Request, name: str, max_events: int, window: int) -> RateLimiter:
    """Ленивый per-app rate-limiter (свежий на каждый инстанс приложения)."""
    st = request.app.state
    rl = getattr(st, name, None)
    if rl is None:
        rl = RateLimiter(max_events, window)
        setattr(st, name, rl)
    return rl


def _session(request: Request) -> dict:
    """Payload сессии из HttpOnly-cookie. 401 — если cookie нет/протухла/битая."""
    payload = session_payload(request, request.app.state.settings.jwt_secret)
    if not payload or payload.get("clinic") not in request.app.state.clinics:
        raise HTTPException(status_code=401, detail="нужен вход в кабинет")
    return payload


def _clinic_or_401(request: Request) -> str:
    return _session(request)["clinic"]


def _require_csrf(request: Request) -> str:
    """CSRF-защита мутирующих запросов: заголовок X-CSRF-Token должен совпасть с
    csrf-claim подписанной сессии (signed double-submit cookie). Возвращает clinic."""
    payload = _session(request)
    header = request.headers.get("x-csrf-token", "")
    expected = payload.get("csrf", "")
    if not expected or header != expected:
        raise HTTPException(status_code=403, detail="CSRF-токен не совпал")
    return payload["clinic"]


def _cookie_kwargs(settings) -> dict:
    return {
        "secure": True,        # только по HTTPS (в проде — Caddy TLS)
        "samesite": "lax",     # cross-site POST не пришлёт cookie → защита от CSRF
        "path": "/",
    }


def _set_session_cookies(response: Response, jwt: str, csrf: str, settings) -> None:
    max_age = JWT_TTL_HOURS * 3600
    kw = _cookie_kwargs(settings)
    response.set_cookie(SESSION_COOKIE, jwt, httponly=True, max_age=max_age, **kw)
    # CSRF-cookie читаема JS (double-submit) — не HttpOnly.
    response.set_cookie(CSRF_COOKIE, csrf, httponly=False, max_age=max_age, **kw)


def _clear_session_cookies(response: Response, settings) -> None:
    kw = _cookie_kwargs(settings)
    response.delete_cookie(SESSION_COOKIE, **kw)
    response.delete_cookie(CSRF_COOKIE, **kw)


def _lead_ops(request: Request) -> LeadOps:
    s = request.app.state
    return LeadOps(s.db, s.clinics, s.notifier)


# --- Авторизация ----------------------------------------------------------


class MagicLinkReq(BaseModel):
    clinic_slug: str
    tg_user_id: int | None = None


@router.post("/auth/magic-link")
async def auth_magic_link(request: Request, body: MagicLinkReq):
    """Выдать одноразовую ссылку входа. Self-service регистрации нет: клиника
    должна существовать (создаётся оператором через scripts/add_clinic.py).
    Rate-limit защищает от перебора ссылок."""
    if not _rl(request, "magic_link_rl", 5, 300).allow(f"{client_ip(request)}:{body.clinic_slug}"):
        raise HTTPException(status_code=429, detail="слишком часто — попробуйте позже")
    if body.clinic_slug not in request.app.state.clinics:
        raise HTTPException(status_code=404, detail="клиника не найдена")
    token = await issue_magic_token(request.app.state.db, body.clinic_slug, body.tg_user_id)
    base = request.app.state.settings.public_base_url
    return {"link": f"{base}/app/enter?token={token}", "token": token}


@router.get("/auth/verify")
async def auth_verify(request: Request, response: Response, token: str):
    """Погасить magic-токен и завести сессию: JWT в HttpOnly-cookie + CSRF-cookie.
    Токен сессии в теле НЕ возвращаем (браузерный JS его не видит)."""
    clinic = await consume_magic_token(request.app.state.db, token)
    if not clinic:
        raise HTTPException(status_code=401, detail="ссылка недействительна или устарела")
    settings = request.app.state.settings
    csrf = new_csrf()
    jwt = create_jwt(clinic, settings.jwt_secret, csrf=csrf)
    _set_session_cookies(response, jwt, csrf, settings)
    clinic_obj = request.app.state.clinics[clinic]
    return {"clinic": {"slug": clinic, "name": clinic_obj.name}}


@router.get("/auth/session")
async def auth_session(request: Request):
    """Текущая сессия из cookie (фронт узнаёт, авторизован ли и какая клиника)."""
    clinic = _session(request)["clinic"]
    c = request.app.state.clinics[clinic]
    return {"clinic": {"slug": clinic, "name": c.name}}


@router.post("/auth/logout")
async def auth_logout(request: Request, response: Response):
    """Выход: чистим cookie. Если сессия есть — требуем CSRF (защита от
    принудительного логаута); если сессии нет — просто чистим (идемпотентно)."""
    settings = request.app.state.settings
    payload = session_payload(request, settings.jwt_secret)
    if payload:
        if request.headers.get("x-csrf-token", "") != payload.get("csrf", ""):
            raise HTTPException(status_code=403, detail="CSRF-токен не совпал")
    _clear_session_cookies(response, settings)
    return {"ok": True}


# --- Лиды -----------------------------------------------------------------


def _lead_public(lead: dict) -> dict:
    """Лид для кабинета: телефон отдаём как есть (владелец видит своих),
    но без внутренних полей session_id и т.п."""
    return {
        "id": lead["id"],
        "name": lead.get("name"),
        "phone": lead.get("phone"),
        "service": lead.get("service"),
        "preferred_time": lead.get("preferred_time"),
        "slot": lead.get("slot"),
        "urgency": lead.get("urgency"),
        "status": lead.get("status"),
        "is_urgent": bool(lead.get("is_urgent")),
        "is_night": bool(lead.get("is_night")),
        "wants_human": bool(lead.get("wants_human")),
        "wants_callback": bool(lead.get("wants_callback")),
        "recovered_from_miss": bool(lead.get("recovered_from_miss")),
        "est_sum": lead.get("est_sum"),
        "source": lead.get("source"),
        "channel": lead.get("channel"),
        "resume": lead.get("resume"),
        "created_at": lead.get("created_at"),
    }


@router.get("/leads")
async def list_leads(request: Request, status: str | None = None):
    clinic = _clinic_or_401(request)
    leads = await request.app.state.db.list_leads(clinic, status=status)
    return {"leads": [_lead_public(x) for x in leads]}


@router.get("/leads/{lead_id}/transcript")
async def lead_transcript(request: Request, lead_id: int):
    clinic = _clinic_or_401(request)
    msgs = await request.app.state.db.transcript(lead_id, clinic)
    if msgs is None:
        raise HTTPException(status_code=404, detail="лид не найден")
    return {"messages": msgs}


class StatusReq(BaseModel):
    status: str


@router.post("/leads/{lead_id}/status")
async def set_status(request: Request, lead_id: int, body: StatusReq):
    clinic = _require_csrf(request)
    if body.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="недопустимый статус")
    lead = await _lead_ops(request).set_status(clinic, lead_id, body.status)
    if lead is None:
        raise HTTPException(status_code=404, detail="лид не найден")
    return {"lead": _lead_public(lead)}


class ConfirmReq(BaseModel):
    slot: str | None = None


@router.post("/leads/{lead_id}/confirm")
async def confirm_lead(request: Request, lead_id: int, body: ConfirmReq | None = None):
    clinic = _require_csrf(request)
    slot = body.slot if body else None
    lead = await _lead_ops(request).confirm(clinic, lead_id, slot)
    if lead is None:
        raise HTTPException(status_code=404, detail="лид не найден")
    return {"lead": _lead_public(lead)}


# --- Деньги и надёжность --------------------------------------------------


@router.get("/money/weekly")
async def money_weekly(request: Request):
    clinic = _clinic_or_401(request)
    return await weekly_money(request.app.state.db, clinic)


@router.get("/reliability-streak")
async def reliability_streak(request: Request):
    clinic = _clinic_or_401(request)
    return await compute_streak(request.app.state.db, clinic)


# --- Настройки ------------------------------------------------------------


@router.get("/settings")
async def get_settings(request: Request):
    clinic = _clinic_or_401(request)
    c = request.app.state.clinics[clinic]
    overrides = await request.app.state.db.get_clinic_settings(clinic)
    base = {
        "name": c.name,
        "work_hours": c.work_hours,
        "tone": c.tone,
        "phone_display": c.phone_display,
        "services": [{"name": s.name, "price_from": s.price_from} for s in c.services],
        "channels": {"max": False, "telegram": True, "sms": True},
        "sound_success": False,  # по умолчанию выкл (РФ-аудитория)
        "theme": "light",
    }
    base.update(overrides)
    return {"settings": base}


@router.post("/settings")
async def save_settings(request: Request):
    clinic = _require_csrf(request)
    data = await request.json()
    settings = data.get("settings", data)
    if not isinstance(settings, dict):
        raise HTTPException(status_code=400, detail="ожидался объект настроек")
    await request.app.state.db.set_clinic_settings(clinic, settings)
    return {"ok": True, "settings": settings}


# --- Публичная заявка с витрины -------------------------------------------


class LeadRequest(BaseModel):
    name: str
    clinic: str | None = None
    phone: str
    city: str | None = None
    source: str = "landing"


@router.post("/public/lead-request")
async def public_lead_request(request: Request, body: LeadRequest):
    """Заявка «Подключить клинику» с витрины → уведомление владельцу. Это НЕ
    лид-пациент и не самостоятельная регистрация клиники — заявку обрабатывает
    основатель вручную. Rate-limit защищает от спама заявок."""
    if not _rl(request, "lead_request_rl", 8, 3600).allow(client_ip(request)):
        raise HTTPException(status_code=429, detail="слишком много заявок — попробуйте позже")
    owner = request.app.state.settings.owner_tg_id
    text = (
        "🆕 Заявка с витрины «Подключить клинику»\n"
        f"Имя: {body.name}\n"
        f"Клиника: {body.clinic or '—'}\n"
        f"Телефон: {body.phone}\n"
        f"Город: {body.city or '—'}\n"
        f"Источник: {body.source}"
    )
    try:
        if owner:
            await request.app.state.notifier.send_group_message(owner, text)
    except Exception as e:  # noqa: BLE001
        logger.error("Заявка с витрины не доставлена владельцу: {}", e)
    logger.info("Заявка с витрины: {} {} ({})", body.name, mask_phone(body.phone), body.clinic)
    return {"ok": True}
