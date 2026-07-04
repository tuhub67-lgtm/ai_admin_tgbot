"""Passwordless-вход в кабинет: magic-link через Telegram-бот + JWT-сессия в cookie.

Поток: в боте /login (или кнопка «Войти» → ?start=login) бот проверяет, что
пользователь — владелец клиники, и присылает ему одноразовую ссылку (15 мин).
GET /api/auth/verify гасит токен и выставляет сессию в HttpOnly+Secure+SameSite=Lax
cookie (pk_session) плюс читаемую CSRF-cookie (pk_csrf). Токен сессии в теле ответа
и в localStorage НЕ хранится — JS его не видит (защита от XSS-кражи).

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

# Имена cookie сессии кабинета.
SESSION_COOKIE = "pk_session"   # JWT, HttpOnly+Secure+SameSite=Lax (JS не читает)
CSRF_COOKIE = "pk_csrf"         # CSRF-токен, читаемый JS (double-submit)


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


# --- Magic-link -----------------------------------------------------------


def authorized_clinics(user_id: int, clinics: dict, owner_tg_id: int | None) -> list:
    """Клиники, к кабинету которых у этого Telegram-пользователя есть доступ.
    Основатель (owner_tg_id) — ко всем; остальные — только к своим (owner_tg_ids)."""
    if not user_id:
        return []
    if owner_tg_id and user_id == owner_tg_id:
        return list(clinics.values())
    return [c for c in clinics.values() if user_id in getattr(c, "owner_tg_ids", [])]


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


def create_jwt(
    clinic_slug: str, secret: str, *, csrf: str | None = None, ttl_hours: int = JWT_TTL_HOURS
) -> str:
    if not secret:
        raise RuntimeError("JWT_SECRET не задан")
    header = {"alg": "HS256", "typ": "JWT"}
    exp = int((now_msk() + timedelta(hours=ttl_hours)).timestamp())
    payload = {"clinic": clinic_slug, "exp": exp}
    if csrf:
        payload["csrf"] = csrf
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


def new_csrf() -> str:
    return secrets.token_urlsafe(24)


def session_payload(request, secret: str) -> dict | None:
    """Валидный payload сессии из HttpOnly-cookie pk_session, либо None."""
    token = request.cookies.get(SESSION_COOKIE)
    return decode_jwt(token, secret) if token else None
