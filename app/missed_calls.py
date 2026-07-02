"""Пропущенные звонки: вебхук Novofon → SMS-возврат через SMS Aero.

Контракт Novofon (novofon.com, экс-Zadarma, сверено с официальными SDK):
- события приходят POST'ом в application/x-www-form-urlencoded (не JSON);
- пропущенный входящий = NOTIFY_END с disposition != 'answered' (duration 0);
- стабильный ID звонка — pbx_call_id (по нему идемпотентность);
- при сохранении URL в кабинете Novofon шлёт GET ?zd_echo=... — нужно вернуть
  значение как есть с HTTP 200, иначе URL не сохранится;
- каждый POST подписан заголовком Signature =
  base64(hex(HMAC-SHA1(caller_id + called_did + call_start, api_secret))).

Защита эндпоинта двухслойная: секрет в URL (?secret=..., обязателен) +
проверка Signature, если задан NOVOFON_API_SECRET.
"""

from __future__ import annotations

import base64
import hashlib
import hmac

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, PlainTextResponse
from loguru import logger

from app.config import Clinic, clinic_by_novofon_number
from app.utils import mask_phone, normalize_phone

router = APIRouter(tags=["novofon"])

# Шлюзы SMS Aero: при сетевой ошибке пробуем следующий (как официальный SDK).
SMSAERO_GATES = [
    "https://gate.smsaero.ru/v2/",
    "https://gate.smsaero.org/v2/",
    "https://gate.smsaero.net/v2/",
]
DEFAULT_SIGN = "SMS Aero"


class SmsAeroClient:
    """Минимальный async-клиент SMS Aero (Basic auth: email + API-ключ)."""

    def __init__(self, email: str, api_key: str):
        self.email = email
        self.api_key = api_key

    @property
    def configured(self) -> bool:
        return bool(self.email and self.api_key)

    async def send_sms(self, phone: str, text: str, sign: str | None = None) -> dict:
        """phone — «+7XXXXXXXXXX»; API ждёт число без «+»."""
        number = int(phone.lstrip("+"))
        body = {"number": number, "text": text, "sign": sign or DEFAULT_SIGN}
        last_error: Exception | None = None
        for gate in SMSAERO_GATES:
            try:
                async with httpx.AsyncClient(
                    base_url=gate, auth=(self.email, self.api_key), timeout=15
                ) as client:
                    resp = await client.post("sms/send", json=body)
                return self._check(resp)
            except httpx.TransportError as e:
                last_error = e
                logger.warning("SMS Aero: шлюз {} недоступен: {}", gate, e)
        raise RuntimeError(f"SMS Aero: все шлюзы недоступны: {last_error}")

    @staticmethod
    def _check(resp: httpx.Response) -> dict:
        try:
            payload = resp.json()
        except ValueError:
            raise RuntimeError(f"SMS Aero: не-JSON ответ, HTTP {resp.status_code}")
        if payload.get("result") == "no credits":
            raise RuntimeError("SMS Aero: на счёте закончились деньги")
        if payload.get("result") == "reject":
            raise RuntimeError(f"SMS Aero: отклонено: {payload.get('reason')}")
        if not payload.get("success"):
            raise RuntimeError(
                f"SMS Aero: {payload.get('message') or 'неизвестная ошибка'}"
                f" (HTTP {resp.status_code})"
            )
        return payload.get("data") or {}


def verify_novofon_signature(form: dict, signature_header: str, api_secret: str) -> bool:
    event = form.get("event", "")
    if event in ("NOTIFY_START", "NOTIFY_INTERNAL", "NOTIFY_END", "NOTIFY_IVR"):
        s = form.get("caller_id", "") + form.get("called_did", "") + form.get("call_start", "")
    elif event == "NOTIFY_ANSWER":
        s = form.get("caller_id", "") + form.get("destination", "") + form.get("call_start", "")
    elif event in ("NOTIFY_OUT_START", "NOTIFY_OUT_END"):
        s = form.get("internal", "") + form.get("destination", "") + form.get("call_start", "")
    else:
        return False
    hex_digest = hmac.new(api_secret.encode(), s.encode(), hashlib.sha1).hexdigest()
    expected = base64.b64encode(hex_digest.encode()).decode()
    return hmac.compare_digest(expected, signature_header or "")


def build_sms_text(clinic: Clinic, deep_link: str) -> str:
    """Строго сервисный текст, без промо и цен (требование операторов)."""
    return (
        f"Это клиника {clinic.name}. Видим ваш звонок — не успели ответить. "
        f"Напишите нам, и администратор свяжется: {deep_link} "
        f"Или перезвоните: {clinic.phone_display}"
    )


async def _resolve_bot_username(state) -> str | None:
    """Username мог не загрузиться на старте (сеть моргнула) — пробуем ещё раз,
    чтобы не рассылать SMS с битым deep-link'ом."""
    username = getattr(state, "bot_username", None)
    if username:
        return username
    bot = getattr(state, "bot", None)
    if bot is None:
        return None
    try:
        username = (await bot.get_me()).username
        state.bot_username = username
        return username
    except Exception as e:
        logger.error("bot.get_me() повторно не удался: {}", e)
        return None


@router.get("/webhook/novofon")
async def novofon_echo(request: Request):
    # Валидация URL кабинетом Novofon: вернуть zd_echo как есть, plain text.
    zd_echo = request.query_params.get("zd_echo", "")
    return PlainTextResponse(zd_echo)


@router.post("/webhook/novofon")
async def novofon_webhook(request: Request):
    state = request.app.state

    # Fail closed: эндпоинт рассылает платные SMS — без настроенного секрета
    # не обрабатываем ничего.
    if not state.settings.novofon_webhook_secret:
        logger.error("NOVOFON_WEBHOOK_SECRET не задан — вебхук отклонён")
        return JSONResponse({"error": "webhook secret is not configured"}, status_code=403)
    secret = request.query_params.get("secret", "")
    if not hmac.compare_digest(secret, state.settings.novofon_webhook_secret):
        return JSONResponse({"error": "forbidden"}, status_code=403)

    form = dict((await request.form()).items())
    event = form.get("event", "")
    # Сначала фильтр по событию: для чужих/новых типов событий правило
    # подписи неизвестно, и отвечать на них 403 нельзя — Novofon может
    # отключить вебхук за постоянные ошибки.
    if event != "NOTIFY_END":
        return {"status": "ignored"}
    if state.settings.novofon_api_secret:
        if not verify_novofon_signature(
            form,
            request.headers.get("Signature", ""),
            state.settings.novofon_api_secret,
        ):
            return JSONResponse({"error": "bad signature"}, status_code=403)

    if form.get("disposition") == "answered":
        return {"status": "answered"}

    call_id = form.get("pbx_call_id") or form.get("call_id") or ""
    caller_raw = form.get("caller_id", "")
    called_did = form.get("called_did", "")
    if not call_id or not caller_raw:
        return {"status": "ignored"}

    clinic = clinic_by_novofon_number(state.clinics, called_did)
    if clinic is None:
        logger.warning("Novofon: неизвестный номер клиники {}", called_did)
        return {"status": "unknown clinic"}

    is_new = await state.db.record_missed_call(call_id, clinic.slug, caller_raw)
    if not is_new:
        # Novofon может ретраить вебхук — повторный call_id игнорируем.
        return {"status": "duplicate"}

    caller = normalize_phone(caller_raw)
    masked = mask_phone(caller or caller_raw)
    logger.info("Пропущенный звонок в {} от {}", clinic.slug, masked)

    sms_ok = False
    bot_username = await _resolve_bot_username(state)
    if caller and state.sms.configured and bot_username:
        deep_link = f"https://t.me/{bot_username}?start={clinic.slug}__sms"
        try:
            await state.sms.send_sms(
                caller, build_sms_text(clinic, deep_link), clinic.sms_sender
            )
            await state.db.mark_sms_sent(call_id)
            sms_ok = True
        except Exception as e:
            logger.error("SMS по пропущенному звонку не отправлена ({}): {}", masked, e)
    elif not state.sms.configured:
        logger.warning("SMS Aero не настроен — SMS по пропущенному звонку не отправлена")
    elif not bot_username:
        logger.error("Username бота неизвестен — SMS с битой ссылкой не отправляем")

    note = (
        f"📵 Пропущенный звонок от {masked}, "
        + ("SMS отправлена" if sms_ok else "SMS НЕ отправлена")
    )
    try:
        await state.notifier.send_group_message(clinic.tg_group_id, note)
    except Exception as e:
        logger.error("Уведомление о пропущенном звонке не доставлено в группу: {}", e)

    return {"status": "ok", "sms_sent": sms_ok}
