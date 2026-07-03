"""Вебхук телефонии (Этап B): пропущенный звонок → первое сообщение Анны
каскадом MAX → SMS в течение 30 секунд.

Отличия от missed_calls.py (виджет-продукт остаётся как есть):
- в URL обязателен per-clinic `clinic_token` (не глобальный секрет) — сервер
  резолвит его в clinic_id; без валидного токена — 403 (fail closed);
- доставка идёт через dispatcher (каскад), а не напрямую в один SMS;
- дневной лимит: не более 1 авто-сообщения на номер за сутки (в dispatcher);
- rate-limit на номер: не больше N событий/мин (защита баланса от фейков);
- идемпотентность по (clinic, номер, время звонка): повтор вебхука не плодит
  второй лид/сообщение.
"""

from __future__ import annotations

import secrets

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from loguru import logger

from backend.config import Clinic
from backend.utils import mask_phone, normalize_phone

router = APIRouter(tags=["telephony"])


def clinic_by_token(clinics: dict[str, Clinic], token: str) -> Clinic | None:
    if not token:
        return None
    for clinic in clinics.values():
        # Постоянное по времени сравнение: токен — единственный гейт платных SMS.
        if clinic.clinic_token and secrets.compare_digest(clinic.clinic_token, token):
            return clinic
    return None


def bridge_text(clinic: Clinic, deep_link: str) -> str:
    """Первое сообщение-мост: короткий текст + ссылка в мессенджер + «или перезвоним»."""
    return (
        f"Это клиника {clinic.name}. Видим ваш звонок — не успели ответить. "
        f"Напишите нам, и администратор свяжется: {deep_link} "
        f"Или перезвоним — ответьте «звонок». Тел.: {clinic.phone_display}"
    )


async def _payload(request: Request) -> dict:
    ctype = request.headers.get("content-type", "")
    if "application/json" in ctype:
        try:
            return dict(await request.json())
        except Exception:
            return {}
    form = await request.form()
    return dict(form.items())


@router.post("/webhook/telephony")
async def telephony_webhook(request: Request):
    state = request.app.state
    clinics = state.clinics

    token = request.query_params.get("clinic_token", "")
    clinic = clinic_by_token(clinics, token)
    if clinic is None:
        # Fail closed: без валидного clinic_token не обрабатываем ничего.
        return JSONResponse({"error": "invalid clinic_token"}, status_code=403)

    data = await _payload(request)
    if data.get("disposition") == "answered" or data.get("event") == "NOTIFY_ANSWER":
        return {"status": "answered"}

    caller_raw = data.get("caller_id") or data.get("phone") or data.get("from") or ""
    call_time = data.get("call_start") or data.get("time") or ""
    caller = normalize_phone(caller_raw)
    if not caller:
        return {"status": "ignored", "reason": "no phone"}

    masked = mask_phone(caller)

    # Rate-limit на номер (защита баланса от фейковых «пропущенных»).
    if not state.ratelimit.allow_telephony(caller):
        logger.warning("Телефония: превышен лимит событий с номера {}", masked)
        return JSONResponse({"error": "rate limited"}, status_code=429)

    # Идемпотентность по (clinic, номер, время звонка). Ключ ВСЕГДА префиксован
    # slug клиники — иначе одинаковый pbx_call_id у разных провайдеров/клиник
    # (call_id UNIQUE глобальный) съел бы чужой звонок как «дубль».
    raw_id = data.get("pbx_call_id") or data.get("call_id") or f"{caller}:{call_time}"
    call_id = f"{clinic.slug}:{raw_id}"
    is_new = await state.db.record_missed_call(call_id, clinic.slug, caller)
    if not is_new:
        return {"status": "duplicate"}

    bot_username = getattr(state, "bot_username", None) or "podhvat_bot"
    deep_link = f"https://t.me/{bot_username}?start={clinic.slug}__call"
    text = bridge_text(clinic, deep_link)

    result = await state.dispatcher.deliver_first_message(
        clinic.slug, caller, text, channels=clinic.channels,
    )
    if result.ok:
        await state.db.mark_sms_sent(call_id)

    note = f"📵 Пропущенный от {masked} — " + (
        f"написали Анной ({result.channel})" if result.ok else f"НЕ доставлено ({result.detail})"
    )
    try:
        await state.notifier.send_group_message(clinic.shtab_chat_id, note)
    except Exception as e:
        logger.error("Уведомление о пропущенном не доставлено в Штаб: {}", e)

    return {"status": "ok", "delivered": result.ok, "channel": result.channel}
