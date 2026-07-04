"""Passwordless-вход в кабинет: magic-link через Telegram-бот + JWT-сессия.

Поток: в боте /login → одноразовая ссылка (15 мин) на кабинет с токеном →
GET /api/auth/verify гасит токен и выдаёт JWT (в нём clinic_slug). Кабинет
кладёт JWT в localStorage и шлёт как `Authorization: Bearer <jwt>`.

JWT — минимальный HS256 на stdlib (без внешних зависимостей). Секрет — из
окружения (JWT_SECRET), длинная случайная строка при деплое.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
from datetime import timedelta

from app.db import Database
from app.utils import now_msk

MAGIC_TTL_MINUTES = 15
JWT_TTL_HOURS = 24 * 14  # кабинет — долгая сессия, вход редкий


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


# --- Magic-link -----------------------------------------------------------


async def issue_magic_token(db: Database, clinic_slug: str, tg_user_id: int | None) -> str:
    token = secrets.token_urlsafe(24)
    expires = (now_msk() + timedelta(minutes=MAGIC_TTL_MINUTES)).strftime("%Y-%m-%d %H:%M:%S")
    await db.create_magic_token(token, clinic_slug, tg_user_id, expires)
    return token


async def consume_magic_token(db: Database, token: str) -> str | None:
    """Гасит одноразовый токен, возвращает clinic_slug или None (протух/использован)."""
    now = now_msk().strftime("%Y-%m-%d %H:%M:%S")
    return await db.consume_magic_token(token, now)


# --- JWT (HS256) ----------------------------------------------------------


def create_jwt(clinic_slug: str, secret: str, *, ttl_hours: int = JWT_TTL_HOURS) -> str:
    if not secret:
        raise RuntimeError("JWT_SECRET не задан")
    header = {"alg": "HS256", "typ": "JWT"}
    exp = int((now_msk() + timedelta(hours=ttl_hours)).timestamp())
    payload = {"clinic": clinic_slug, "exp": exp}
    seg = _b64url(json.dumps(header, separators=(",", ":")).encode()) + "." + _b64url(
        json.dumps(payload, separators=(",", ":")).encode()
    )
    sig = hmac.new(secret.encode(), seg.encode(), hashlib.sha256).digest()
    return seg + "." + _b64url(sig)


def decode_jwt(token: str, secret: str) -> dict | None:
    """Проверяет подпись и срок. None — если что-то не так."""
    if not token or not secret:
        return None
    try:
        seg, sig_b64 = token.rsplit(".", 1)
        expected = hmac.new(secret.encode(), seg.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(_b64url_decode(sig_b64), expected):
            return None
        payload = json.loads(_b64url_decode(seg.split(".", 1)[1]))
    except Exception:
        return None
    if int(payload.get("exp", 0)) < int(now_msk().timestamp()):
        return None
    return payload


def clinic_from_auth_header(authorization: str | None, secret: str) -> str | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    payload = decode_jwt(authorization[7:].strip(), secret)
    return payload.get("clinic") if payload else None
