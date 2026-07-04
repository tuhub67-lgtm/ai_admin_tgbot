#!/usr/bin/env bash
# Подхват AI+ — установка на чистый российский VPS (Ubuntu 22/24) от нуля до работы.
#   bash setup.sh          # первый запуск создаст .env и остановится
#   # впишите ключи в .env
#   bash setup.sh          # второй запуск соберёт и поднимет всё
set -euo pipefail
cd "$(dirname "$0")"

echo "== Подхват AI+ · установка =="

# 1) Docker
if ! command -v docker >/dev/null 2>&1; then
  echo "-- Устанавливаю Docker..."
  curl -fsSL https://get.docker.com | sh
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "ОШИБКА: нужен docker compose v2 (обновите Docker)." >&2
  exit 1
fi

# 2) .env
if [ ! -f .env ]; then
  cp .env.example .env
  # Генерируем стойкий JWT-секрет для сессий кабинета
  if command -v openssl >/dev/null 2>&1; then
    secret=$(openssl rand -hex 32)
  else
    secret=$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')
  fi
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${secret}|" .env
  echo
  echo ">> Создан .env со случайным JWT_SECRET."
  echo ">> Впишите в .env: BOT_TOKEN, OWNER_TG_ID, GIGACHAT_CREDENTIALS, DOMAIN, PUBLIC_BASE_URL,"
  echo "   BOT_USERNAME, SMSAERO_*, NOVOFON_WEBHOOK_SECRET — и запустите bash setup.sh ещё раз."
  exit 0
fi

# 3) Каталоги данных
mkdir -p data backups certs

# 4) Сборка и запуск (backend + Caddy со встроенной витриной/кабинетом + бэкап)
echo "-- Собираю и поднимаю контейнеры..."
docker compose up -d --build

echo
echo "== Готово =="
echo "Проверка здоровья:  curl -s http://localhost/health"
echo "Демо-данные (опц.): docker compose exec app uv run python -m scripts.seed_demo"
echo "Логи:               docker compose logs -f app"
