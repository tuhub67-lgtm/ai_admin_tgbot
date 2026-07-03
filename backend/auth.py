"""Аутентификация кабинета: passwordless magic-link через Штаб-бот + JWT.

- Владелец пишет боту /login → бот шлёт ссылку {base}/app/auth?token=... (живёт
  15 минут, одноразовая) прямо в мессенджер.
- Переход меняет токен на JWT-сессию (привязана к clinic_id), кабинет хранит JWT
  в localStorage и шлёт в Authorization: Bearer.
- Каждый запрос к API проверяет JWT и достаёт clinic_slug — данные одной клиники
  никогда не отдаём по токену другой (изоляция арендаторов).
"""

from __future__ import annotations

import secrets
import time

import jwt
from fastapi import Header, HTTPException

from backend.db import Database

ALGO = "HS256"


def new_magic_token() -> str:
    return secrets.token_urlsafe(32)


async def issue_magic_link(db: Database, clinic_slug: str, base_url: str) -> str:
    token = new_magic_token()
    await db.create_magic_token(token, clinic_slug, ttl_minutes=15)
    return f"{base_url.rstrip('/')}/app/auth?token={token}"


async def verify_magic_token(db: Database, token: str) -> str | None:
    """Одноразовый разбор magic-токена → clinic_slug (или None, если протух/использован)."""
    return await db.consume_magic_token(token)


def create_jwt(clinic_slug: str, secret: str, days: int = 30) -> str:
    now = int(time.time())
    payload = {"sub": clinic_slug, "iat": now, "exp": now + days * 86400}
    return jwt.encode(payload, secret, algorithm=ALGO)


def decode_jwt(token: str, secret: str) -> str:
    """Возвращает clinic_slug или бросает ValueError."""
    try:
        payload = jwt.decode(token, secret, algorithms=[ALGO])
    except jwt.PyJWTError as e:
        raise ValueError(str(e))
    sub = payload.get("sub")
    if not sub:
        raise ValueError("no subject")
    return sub


def clinic_from_auth_header(authorization: str | None, secret: str) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Требуется авторизация")
    token = authorization.split(" ", 1)[1].strip()
    try:
        return decode_jwt(token, secret)
    except ValueError:
        raise HTTPException(status_code=401, detail="Недействительная сессия")


def require_clinic_dependency(get_secret):
    """Фабрика FastAPI-зависимости: возвращает clinic_slug из Bearer JWT.

    get_secret() отдаёт актуальный JWT-secret (берём из app.state.settings).
    """

    async def _dep(authorization: str | None = Header(default=None)) -> str:
        return clinic_from_auth_header(authorization, get_secret())

    return _dep
