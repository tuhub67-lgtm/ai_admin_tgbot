"""REST API кабинета владельца. Все ресурсы жёстко изолированы по clinic_slug
из JWT — данные одной клиники нельзя получить по токену другой.

Эндпоинты: auth/verify, leads (лента/transcript/status/confirm),
money/weekly, reliability-streak, settings, public/lead-request.
"""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Header, HTTPException, Request
from loguru import logger
from pydantic import BaseModel

from backend.auth import clinic_from_auth_header, create_jwt, verify_magic_token
from backend.card_builder import confirm_and_notify
from backend.reliability import compute_streak

router = APIRouter(prefix="/api", tags=["cabinet"])

PILOT_COST = 1590
SUBSCRIPTION_COST = 14900
VALID_STATUSES = {"new", "dialog", "pending", "booked", "lost", "nontarget"}


def _clinic(request: Request, authorization: str | None) -> str:
    """clinic_slug из Bearer JWT (или 401)."""
    secret = request.app.state.settings.jwt_secret
    return clinic_from_auth_header(authorization, secret)


def _lead_public(lead: dict) -> dict:
    """Только поля, нужные кабинету (без session_id и внутренностей)."""
    keys = (
        "id", "name", "phone", "service", "urgency", "preferred_time", "status",
        "source", "is_urgent", "is_night", "wants_human", "wants_callback",
        "is_repeat", "recovered_from_miss", "sum_rub", "summary", "confirmed_at",
        "created_at",
    )
    return {k: lead.get(k) for k in keys}


# --- Авторизация -------------------------------------------------------------

@router.get("/auth/verify")
async def auth_verify(request: Request, token: str):
    """Обмен одноразового magic-токена на JWT-сессию."""
    db = request.app.state.db
    settings = request.app.state.settings
    clinic_slug = await verify_magic_token(db, token)
    if not clinic_slug:
        raise HTTPException(status_code=401, detail="Ссылка недействительна или устарела")
    jwt_token = create_jwt(clinic_slug, settings.jwt_secret, settings.jwt_days)
    clinic = request.app.state.clinics.get(clinic_slug)
    return {"jwt": jwt_token, "clinic": clinic.name if clinic else clinic_slug}


# --- Лиды --------------------------------------------------------------------

@router.get("/leads")
async def list_leads(request: Request, status: str | None = None,
                     authorization: str | None = Header(default=None)):
    clinic_slug = _clinic(request, authorization)
    if status and status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Неизвестный статус")
    leads = await request.app.state.db.list_leads(clinic_slug, status)
    return {"leads": [_lead_public(x) for x in leads]}


@router.get("/leads/{lead_id}/transcript")
async def lead_transcript(request: Request, lead_id: int,
                          authorization: str | None = Header(default=None)):
    clinic_slug = _clinic(request, authorization)
    lead = await request.app.state.db.get_lead(lead_id, clinic_slug)
    if lead is None:
        raise HTTPException(status_code=404, detail="Лид не найден")
    messages = await request.app.state.db.lead_transcript(lead_id, clinic_slug)
    return {"messages": messages}


class StatusBody(BaseModel):
    status: str


@router.post("/leads/{lead_id}/status")
async def set_status(request: Request, lead_id: int, body: StatusBody,
                     authorization: str | None = Header(default=None)):
    clinic_slug = _clinic(request, authorization)
    if body.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Неизвестный статус")
    lead = await request.app.state.db.get_lead(lead_id, clinic_slug)
    if lead is None:
        raise HTTPException(status_code=404, detail="Лид не найден")
    updated = await request.app.state.db.set_lead_status(lead_id, clinic_slug, body.status)
    return {"lead": _lead_public(updated)}


@router.post("/leads/{lead_id}/confirm")
async def confirm(request: Request, lead_id: int,
                  authorization: str | None = Header(default=None)):
    clinic_slug = _clinic(request, authorization)
    db = request.app.state.db
    clinic = request.app.state.clinics.get(clinic_slug)
    lead = await db.get_lead(lead_id, clinic_slug)
    if lead is None or clinic is None:
        raise HTTPException(status_code=404, detail="Лид не найден")
    adapters = getattr(request.app.state, "adapters", {})
    result = await confirm_and_notify(db, clinic, lead_id, adapters)
    updated = await db.get_lead(lead_id, clinic_slug)
    return {"lead": _lead_public(updated), "delivered": result.delivered,
            "newly_confirmed": result.newly_confirmed}


# --- Деньги и надёжность -----------------------------------------------------

@router.get("/money/weekly")
async def money_weekly(request: Request, authorization: str | None = Header(default=None)):
    clinic_slug = _clinic(request, authorization)
    db = request.app.state.db
    by_day = await db.money_by_day(clinic_slug, 7)
    total = await db.money_week_total(clinic_slug, 7)
    # День окупаемости пилота: первый день, где накопленная сумма ≥ цены пилота.
    payback_day = None
    cumulative = 0
    for i, row in enumerate(by_day, start=1):
        cumulative += row["sum"]
        if cumulative >= PILOT_COST:
            payback_day = i
            break
    return {
        "total": total,
        "by_day": [{"date": r["date"], "sum": r["sum"]} for r in by_day],
        "payback_day": payback_day,
        "pilot_cost": PILOT_COST,
        "subscription_cost": SUBSCRIPTION_COST,
    }


@router.get("/reliability-streak")
async def reliability_streak(request: Request, authorization: str | None = Header(default=None)):
    clinic_slug = _clinic(request, authorization)
    db = request.app.state.db
    incidents = await db.delivery_incidents(clinic_slug)
    incident_dates = [i["date"] for i in incidents]
    return compute_streak(incident_dates, date.today())


# --- Настройки ---------------------------------------------------------------

@router.get("/settings")
async def get_settings(request: Request, authorization: str | None = Header(default=None)):
    clinic_slug = _clinic(request, authorization)
    clinic = request.app.state.clinics.get(clinic_slug)
    if clinic is None:
        raise HTTPException(status_code=404, detail="Клиника не найдена")
    return {
        "work_hours": clinic.work_hours,
        "services": [
            {"name": s.name, "price_from": s.price_from, "price_to": s.price_to}
            for s in clinic.services
        ],
        "anna_tone": clinic.tone,
        "channels": {c: (c in clinic.channels) for c in ("max", "telegram", "sms")},
    }


class SettingsBody(BaseModel):
    work_hours: str | None = None
    anna_tone: str | None = None
    channels: dict | None = None


@router.post("/settings")
async def post_settings(request: Request, body: SettingsBody,
                        authorization: str | None = Header(default=None)):
    clinic_slug = _clinic(request, authorization)
    clinic = request.app.state.clinics.get(clinic_slug)
    if clinic is None:
        raise HTTPException(status_code=404, detail="Клиника не найдена")
    # В MVP настройки применяются в памяти процесса (YAML — источник истины при
    # рестарте). Полноценное сохранение в YAML/БД — отдельная задача.
    if body.work_hours:
        clinic.work_hours = body.work_hours
    if body.anna_tone:
        clinic.tone = body.anna_tone
    if body.channels is not None:
        clinic.channels = [c for c in ("max", "telegram", "sms") if body.channels.get(c)]
    return {"ok": True}


# --- Публичная заявка с сайта (Этап B) ---------------------------------------

class LeadRequest(BaseModel):
    name: str
    clinic: str | None = None
    phone: str
    city: str | None = None
    source: str | None = "landing"


@router.post("/public/lead-request")
async def public_lead_request(request: Request, body: LeadRequest):
    """Заявка с сайта-витрины: уведомляем владельца в личку (без записи в БД
    пациентов — это заявка на подключение клиники, а не лид пациента)."""
    settings = request.app.state.settings
    bot = getattr(request.app.state, "bot", None)
    text = (
        "Новая заявка с сайта\n\n"
        f"Имя: {body.name}\nКлиника: {body.clinic or '—'}\n"
        f"Телефон: {body.phone}\nГород: {body.city or '—'}\nИсточник: {body.source}"
    )
    delivered = False
    if bot is not None and settings.owner_tg_id:
        try:
            await bot.send_message(settings.owner_tg_id, text)
            delivered = True
        except Exception as e:
            logger.error("Заявка с сайта не доставлена владельцу: {}", e)
    else:
        logger.info("Заявка с сайта (бот/owner не настроены): {}", text)
    return {"ok": True, "delivered": delivered}
