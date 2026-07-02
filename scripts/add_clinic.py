#!/usr/bin/env python3
"""Добавление клиники за 15 минут: создаёт app/clinics/<slug>.yaml,
печатает deep-link для лендинга/SMS и сниппет виджета для сайта.

Запуск без аргументов создаёт демо-клинику demo-dent (то, что отправляется
ЛПР во время холодного звонка):

    uv run python scripts/add_clinic.py

Своя клиника — интерактивно:

    uv run python scripts/add_clinic.py --interactive
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import Clinic, Service, load_clinics  # noqa: E402

CLINICS_DIR = Path(__file__).resolve().parent.parent / "app" / "clinics"

DEMO = Clinic(
    slug="demo-dent",
    name="Клиника Демо-Дент",
    tg_group_id=-100123456789,
    city="Казань",
    address="ул. Пример, 1",
    phone_display="+7 (843) 000-00-00",
    work_hours="Пн–Сб 9:00–20:00",
    tone="тёплый, спокойный, на вы",
    lead_cost=3000,
    widget_color="#1F9D6B",
    services=[
        Service(name="Консультация", price_from=0),
        Service(name="Профгигиена", price_from=4500),
        Service(name="Лечение кариеса", price_from=5900),
        Service(name="Имплантация", price_from=None),
    ],
    sms_sender="DemoDent",
    novofon_number="+78430000001",
)


def ask(prompt: str, default: str = "") -> str:
    suffix = f" [{default}]" if default else ""
    value = input(f"{prompt}{suffix}: ").strip()
    return value or default


def interactive_clinic() -> Clinic:
    print("Новая клиника — заполните профиль (Enter — значение по умолчанию).\n")
    services: list[Service] = []
    slug = ask("slug (латиницей, например vita-dent)")
    name = ask("Название", "Клиника")
    while True:
        s_name = ask("Услуга (пустая строка — закончить)")
        if not s_name:
            break
        price_raw = ask(f"Цена «от» для «{s_name}» (пусто = цену назовёт врач)")
        services.append(
            Service(name=s_name, price_from=int(price_raw) if price_raw else None)
        )
    return Clinic(
        slug=slug,
        name=name,
        tg_group_id=int(
            ask("ID TG-группы клиники (можно вписать позже в YAML)", "-100123456789")
        ),
        city=ask("Город", "Казань"),
        address=ask("Адрес", "—"),
        phone_display=ask("Телефон для пациентов", "+7 (000) 000-00-00"),
        work_hours=ask("График", "Пн–Сб 9:00–20:00"),
        tone=ask("Тон общения", "тёплый, спокойный, на вы"),
        lead_cost=int(ask("Стоимость лида из рекламы, ₽", "3000")),
        widget_color=ask("Цвет виджета", "#1F9D6B"),
        services=services or DEMO.services,
        sms_sender=ask("Имя отправителя SMS (согласованное в SMS Aero)", "") or None,
        novofon_number=ask("Номер Novofon для переадресации", "") or None,
    )


def write_yaml(clinic: Clinic) -> Path:
    path = CLINICS_DIR / f"{clinic.slug}.yaml"
    if path.exists():
        print(f"⚠️  {path} уже существует — не перезаписываю.")
        return path
    # safe_dump, а не ручная сборка строк: кавычки в названии клиники
    # («Стоматология "Улыбка"») иначе дают битый YAML, который валит
    # приложение при следующем старте.
    data = clinic.model_dump()
    for key in ("sms_sender", "novofon_number"):
        if data.get(key) is None:
            data.pop(key, None)
    path.write_text(
        yaml.safe_dump(data, allow_unicode=True, sort_keys=False), encoding="utf-8"
    )
    print(f"✅ Профиль записан: {path}")
    return path


def print_links(clinic: Clinic) -> None:
    bot = os.getenv("BOT_USERNAME", "ВАШ_БОТ")
    domain = os.getenv("PUBLIC_BASE_URL", "https://ВАШ-ДОМЕН").rstrip("/")
    print("\n──────── Ссылки для запуска ────────")
    print("Deep-link для лендинга (кнопки на лендинге):")
    print(f"  https://t.me/{bot}?start={clinic.slug}__landing")
    print("Deep-link для QR в клинике:")
    print(f"  https://t.me/{bot}?start={clinic.slug}__qr")
    print("Deep-link для SMS-возврата (подставляется автоматически):")
    print(f"  https://t.me/{bot}?start={clinic.slug}__sms")
    print("\nСниппет виджета на сайт клиники (перед </body>):")
    print(f'  <script src="{domain}/static/widget.js" data-clinic="{clinic.slug}" defer></script>')
    print("─────────────────────────────────────\n")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--interactive", action="store_true", help="интерактивное создание своей клиники"
    )
    args = parser.parse_args()

    clinic = interactive_clinic() if args.interactive else DEMO
    write_yaml(clinic)
    load_clinics(CLINICS_DIR)  # валидация: битый YAML свалит скрипт здесь
    print_links(clinic)


if __name__ == "__main__":
    main()
