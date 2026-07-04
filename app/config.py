"""Конфигурация приложения: переменные окружения + YAML-профили клиник.

Секреты берутся только из .env (python-dotenv). Профили клиник лежат в
app/clinics/*.yaml и валидируются pydantic-моделью Clinic при старте —
битый YAML роняет приложение сразу, а не в середине диалога с пациентом.
"""

from __future__ import annotations

import os
import re
from datetime import time
from pathlib import Path

import yaml
from dotenv import load_dotenv
from pydantic import BaseModel, Field, field_validator

load_dotenv()

APP_DIR = Path(__file__).resolve().parent
CLINICS_DIR = APP_DIR / "clinics"

VALID_SOURCES = {"landing", "sms", "call", "qr", "site"}
DEFAULT_SOURCE = "direct"


class Service(BaseModel):
    name: str
    price_from: int | None = None


class Clinic(BaseModel):
    slug: str
    name: str
    tg_group_id: int
    city: str
    address: str
    phone_display: str
    work_hours: str
    tone: str = "тёплый, спокойный, на вы"
    lead_cost: int = 3000
    widget_color: str = "#1F9D6B"
    services: list[Service] = Field(default_factory=list)
    sms_sender: str | None = None
    novofon_number: str | None = None
    # Персональный токен вебхука телефонии (в URL): резолвит клинику без опоры
    # только на набранный номер. Если задан — предпочтительный способ авторизации.
    clinic_token: str | None = None

    @field_validator("slug")
    @classmethod
    def slug_is_safe(cls, v: str) -> str:
        if not re.fullmatch(r"[a-z0-9][a-z0-9-]{1,62}", v):
            raise ValueError(
                "slug: только строчные латинские буквы, цифры и дефис (2–63 символа)"
            )
        return v

    def services_list_text(self) -> str:
        """Строка услуг для системного промпта: «Профгигиена — от 4500 ₽»."""
        lines = []
        for s in self.services:
            if s.price_from:
                lines.append(f"- {s.name} — от {s.price_from} ₽")
            elif s.price_from == 0:
                lines.append(f"- {s.name} — бесплатно")
            else:
                lines.append(f"- {s.name} — точную стоимость определит врач после осмотра")
        return "\n".join(lines) if lines else "- Консультация"


# --- Разбор графика работы ---------------------------------------------------

_DAY_INDEX = {"пн": 0, "вт": 1, "ср": 2, "чт": 3, "пт": 4, "сб": 5, "вс": 6}
_HOURS_RE = re.compile(r"(\d{1,2})[:.](\d{2})\s*[–—-]\s*(\d{1,2})[:.](\d{2})")


class WorkSchedule(BaseModel):
    """Нормализованный график: множество рабочих дней + интервал часов.

    Если строку work_hours разобрать не удалось, считаем клинику работающей
    всегда (open_always=True): лучше не пометить ночную заявку, чем ложно
    обещать пациенту «свяжемся утром» в разгар рабочего дня.
    """

    days: set[int] = Field(default_factory=lambda: set(range(7)))
    start: time = time(0, 0)
    end: time = time(23, 59)
    open_always: bool = False

    def is_open(self, dt) -> bool:
        if self.open_always:
            return True
        if dt.weekday() not in self.days:
            return False
        return self.start <= dt.time() < self.end


def parse_work_hours(raw: str) -> WorkSchedule:
    """«Пн–Сб 9:00–20:00» → дни {0..5}, 09:00–20:00.

    Понимает диапазоны («Пн–Пт»), перечисления («Пн, Ср, Пт») и слова
    «ежедневно»/«без выходных»/«круглосуточно».
    """
    text = raw.strip().lower()
    if "круглосуточ" in text:
        return WorkSchedule(open_always=True)

    hours_m = _HOURS_RE.search(text)
    if not hours_m:
        return WorkSchedule(open_always=True)
    start = time(int(hours_m.group(1)), int(hours_m.group(2)))
    end = time(int(hours_m.group(3)), int(hours_m.group(4)))

    days: set[int] = set()
    if "ежеднев" in text or "без выходных" in text:
        days = set(range(7))
    else:
        for m in re.finditer(r"(пн|вт|ср|чт|пт|сб|вс)\s*[–—-]\s*(пн|вт|ср|чт|пт|сб|вс)", text):
            a, b = _DAY_INDEX[m.group(1)], _DAY_INDEX[m.group(2)]
            if a <= b:
                days.update(range(a, b + 1))
            else:  # «Сб–Вт» через границу недели
                days.update(list(range(a, 7)) + list(range(0, b + 1)))
        covered = {m.group(1) for m in re.finditer(r"(пн|вт|ср|чт|пт|сб|вс)", text)}
        for d in covered:
            days.add(_DAY_INDEX[d])
    if not days:
        return WorkSchedule(open_always=True)
    return WorkSchedule(days=days, start=start, end=end)


# --- Настройки из окружения ---------------------------------------------------


def _env(name: str, default: str | None = None, required: bool = False) -> str:
    value = os.getenv(name, default)
    if required and not value:
        raise RuntimeError(f"Не задана обязательная переменная окружения {name}")
    return value or ""


class Settings(BaseModel):
    bot_token: str
    owner_tg_id: int
    default_clinic_slug: str = "demo-dent"

    gigachat_credentials: str
    gigachat_scope: str = "GIGACHAT_API_PERS"
    gigachat_model: str = "GigaChat-2"
    gigachat_ca_bundle_file: str | None = None
    gigachat_verify_ssl: bool = True
    gigachat_rub_per_1k_tokens: float = 0.2

    smsaero_email: str = ""
    smsaero_api_key: str = ""

    novofon_webhook_secret: str = ""
    novofon_api_secret: str = ""

    public_base_url: str = "http://localhost:8000"
    db_path: str = "data/podkhvat.db"
    log_level: str = "INFO"

    # Кабинет: секрет для подписи JWT-сессий (длинная случайная строка на деплое)
    jwt_secret: str = "dev-insecure-change-me"
    # Флаг Secure у cookie сессии: в проде (HTTPS) — True; в локальной dev-разработке
    # по http его выключают (COOKIE_SECURE=false), иначе браузер не сохранит cookie.
    cookie_secure: bool = True

    # Лимиты диалога
    max_messages_per_session: int = 30
    max_response_tokens: int = 800
    history_window: int = 12
    flood_max_messages: int = 5
    flood_window_seconds: int = 10

    # Защитные лимиты (безопасность/баланс)
    sms_daily_cap_per_clinic: int = 200     # потолок исходящих SMS на клинику в сутки
    webhook_max_per_number: int = 5         # вебхуков с одного номера за окно
    webhook_window_seconds: int = 60


def load_settings() -> Settings:
    return Settings(
        bot_token=_env("BOT_TOKEN", required=True),
        owner_tg_id=int(_env("OWNER_TG_ID", "0")),
        default_clinic_slug=_env("DEFAULT_CLINIC_SLUG", "demo-dent"),
        gigachat_credentials=_env("GIGACHAT_CREDENTIALS", required=True),
        gigachat_scope=_env("GIGACHAT_SCOPE", "GIGACHAT_API_PERS"),
        gigachat_model=_env("GIGACHAT_MODEL", "GigaChat-2"),
        gigachat_ca_bundle_file=_env("GIGACHAT_CA_BUNDLE_FILE") or None,
        gigachat_verify_ssl=_env("GIGACHAT_VERIFY_SSL", "true").lower() != "false",
        gigachat_rub_per_1k_tokens=float(_env("GIGACHAT_RUB_PER_1K_TOKENS", "0.2")),
        smsaero_email=_env("SMSAERO_EMAIL"),
        smsaero_api_key=_env("SMSAERO_API_KEY"),
        novofon_webhook_secret=_env("NOVOFON_WEBHOOK_SECRET"),
        novofon_api_secret=_env("NOVOFON_API_SECRET"),
        public_base_url=_env("PUBLIC_BASE_URL", "http://localhost:8000").rstrip("/"),
        db_path=_env("DB_PATH", "data/podkhvat.db"),
        log_level=_env("LOG_LEVEL", "INFO"),
        jwt_secret=_env("JWT_SECRET", "dev-insecure-change-me"),
        cookie_secure=_env("COOKIE_SECURE", "true").lower() != "false",
        sms_daily_cap_per_clinic=int(_env("SMS_DAILY_CAP_PER_CLINIC", "200")),
    )


# --- Загрузка клиник ----------------------------------------------------------


def load_clinics(directory: Path | None = None) -> dict[str, Clinic]:
    directory = directory or CLINICS_DIR
    clinics: dict[str, Clinic] = {}
    for path in sorted(directory.glob("*.yaml")):
        with open(path, encoding="utf-8") as f:
            data = yaml.safe_load(f)
        clinic = Clinic.model_validate(data)
        if clinic.slug in clinics:
            raise RuntimeError(f"Дублирующийся slug клиники: {clinic.slug} ({path})")
        clinics[clinic.slug] = clinic
    if not clinics:
        raise RuntimeError(f"В {directory} нет ни одного профиля клиники (*.yaml)")
    return clinics


def clinic_by_novofon_number(clinics: dict[str, Clinic], number: str) -> Clinic | None:
    digits = re.sub(r"\D", "", number)
    for clinic in clinics.values():
        if clinic.novofon_number and re.sub(r"\D", "", clinic.novofon_number) == digits:
            return clinic
    return None


def clinic_by_token(clinics: dict[str, Clinic], token: str) -> Clinic | None:
    if not token:
        return None
    for clinic in clinics.values():
        if clinic.clinic_token and hmac_equal(clinic.clinic_token, token):
            return clinic
    return None


def hmac_equal(a: str, b: str) -> bool:
    import hmac as _hmac

    return _hmac.compare_digest(a, b)
