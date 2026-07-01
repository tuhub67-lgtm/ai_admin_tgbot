"""REST API веб-виджета: /api/chat/*.

Сессия привязана к uuid: сервер выдаёт его в /start, виджет хранит в cookie
и localStorage и передаёт явно в каждом запросе (сторонние cookie браузеры
режут, поэтому явная передача — основной канал, cookie — запасной).
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/chat", tags=["widget"])

COOKIE_NAME = "podkhvat_session"
MAX_TEXT_LEN = 1000


class StartRequest(BaseModel):
    clinic: str
    session_id: str | None = Field(default=None, max_length=64)


class MessageRequest(BaseModel):
    session_id: str
    text: str = Field(min_length=1, max_length=MAX_TEXT_LEN)


class HumanRequest(BaseModel):
    session_id: str


def _state(request: Request):
    return request.app.state


async def _get_session(request: Request, session_uuid: str) -> dict:
    state = _state(request)
    row = await state.db._fetchone(
        "SELECT * FROM sessions WHERE channel = 'widget' AND external_id = ?",
        (session_uuid,),
    )
    if not row:
        raise HTTPException(status_code=404, detail="session not found")
    return dict(row)


@router.post("/start")
async def start_chat(body: StartRequest, request: Request, response: Response):
    state = _state(request)
    if body.clinic not in state.clinics:
        raise HTTPException(status_code=404, detail="unknown clinic")

    session_uuid = body.session_id or request.cookies.get(COOKIE_NAME) or str(uuid.uuid4())
    session = await state.db.get_or_create_session(
        clinic_slug=body.clinic,
        channel="widget",
        external_id=session_uuid,
        source="site",
    )
    # Существующая сессия могла быть заведена под другую клинику (uuid общий
    # на браузер) — тогда начинаем заново под текущую.
    if session["clinic_slug"] != body.clinic:
        session = await state.db.reset_session(body.clinic, "widget", session_uuid, "site")

    messages = await state.db.messages_after(session["id"], 0)
    if not messages:
        result = await state.engine.start_session(session)
        messages = [{"id": 0, "role": "assistant", "content": r} for r in result.replies]
        last_row = await state.db.messages_after(session["id"], 0)
        if last_row:
            messages = last_row

    response.set_cookie(
        COOKIE_NAME,
        session_uuid,
        max_age=60 * 60 * 24 * 30,
        samesite="none",
        secure=True,
        httponly=True,
    )
    clinic = state.clinics[body.clinic]
    return {
        "session_id": session_uuid,
        "clinic": {
            "name": clinic.name,
            "color": clinic.widget_color,
            "phone": clinic.phone_display,
        },
        "messages": [
            {"id": m["id"], "role": m["role"], "content": m["content"]} for m in messages
        ],
    }


@router.post("/message")
async def send_message(body: MessageRequest, request: Request):
    state = _state(request)
    session = await _get_session(request, body.session_id)
    result = await state.engine.handle_message(session, body.text)
    return {"messages": [{"role": "assistant", "content": r} for r in result.replies]}


@router.post("/human")
async def call_human(body: HumanRequest, request: Request):
    state = _state(request)
    session = await _get_session(request, body.session_id)
    result = await state.engine.request_human_button(session)
    return {"messages": [{"role": "assistant", "content": r} for r in result.replies]}


@router.get("/poll")
async def poll(request: Request, session_id: str, after_id: int = 0):
    state = _state(request)
    session = await _get_session(request, session_id)
    messages = await state.db.messages_after(session["id"], after_id)
    assistant = [m for m in messages if m["role"] == "assistant"]
    last_id = messages[-1]["id"] if messages else after_id
    return {
        "messages": [
            {"id": m["id"], "role": m["role"], "content": m["content"]} for m in assistant
        ],
        "last_id": last_id,
    }
