#!/usr/bin/env bash
# ============================================================
# Подхват AI+ — установка backend на чистый Ubuntu VPS (Этап B)
# От чистого сервера до работающего приложения одним скриптом.
# Запуск:  bash setup.sh   (рекомендуется от root: sudo -i)
# Идемпотентен: повторный запуск не ломает уже настроенное.
# ============================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_ROOT"
export DEBIAN_FRONTEND=noninteractive

SUDO=""
if [ "$(id -u)" -ne 0 ]; then
	echo "Внимание: скрипт лучше запускать от root (sudo -i). Пробую через sudo."
	SUDO="sudo"
fi

step() { printf '\n\033[1m[%s/8] %s\033[0m\n' "$1" "$2"; }

# ------------------------------------------------------------
step 1 "Устанавливаю Docker, compose-плагин и утилиты"
# ------------------------------------------------------------
$SUDO apt-get update -y
$SUDO apt-get install -y ca-certificates curl git sqlite3 openssl cron
if command -v docker >/dev/null 2>&1; then
	echo "Docker уже установлен: $(docker --version)"
else
	curl -fsSL https://get.docker.com | $SUDO sh
fi
docker compose version >/dev/null 2>&1 || { echo "Ошибка: нет плагина docker compose"; exit 1; }
$SUDO systemctl enable --now cron 2>/dev/null || true

# ------------------------------------------------------------
step 2 "Проверяю .env"
# ------------------------------------------------------------
if [ ! -f .env ]; then
	cp .env.example .env
	cat <<'MSG'

Создан .env из .env.example. Заполните ключи и запустите setup.sh снова:
  - BOT_TOKEN            (@BotFather)
  - GIGACHAT_CREDENTIALS (developers.sber.ru)
  - SMSRU_API_ID         (sms.ru → API)
  - NOVOFON_WEBHOOK_SECRET
  - DOMAIN и PUBLIC_BASE_URL (ваш домен, A-запись на IP VPS)
  - CABINET_ORIGIN       (домен кабинета на Vercel, напр. https://podhvatplus.ru)
Редактировать:  nano .env
MSG
	exit 1
fi
echo ".env на месте"

# ------------------------------------------------------------
step 3 "Считываю домен из .env"
# ------------------------------------------------------------
DOMAIN="$(grep -E '^DOMAIN=' .env | tail -n1 | cut -d= -f2- | tr -d '"' | tr -d "'" | xargs || true)"
if [ -z "$DOMAIN" ] || [ "$DOMAIN" = "bot.example.ru" ]; then
	echo "Внимание: DOMAIN не задан или это пример (bot.example.ru)."
	echo "Let's Encrypt не выдаст сертификат, healthcheck по HTTPS не пройдёт."
	echo "Впишите реальный домен в .env (DOMAIN и PUBLIC_BASE_URL) и запустите снова."
else
	echo "Домен: $DOMAIN"
fi

# ------------------------------------------------------------
step 4 "Генерирую JWT_SECRET, если пуст"
# ------------------------------------------------------------
if grep -qE '^JWT_SECRET=.+' .env; then
	echo "JWT_SECRET уже задан — пропускаю"
else
	SECRET="$(openssl rand -hex 32)"
	if grep -qE '^JWT_SECRET=' .env; then
		# ключ есть, но пустой — подставляем значение на месте
		tmp="$(mktemp)"
		sed "s|^JWT_SECRET=.*|JWT_SECRET=$SECRET|" .env > "$tmp" && mv "$tmp" .env
	else
		printf '\nJWT_SECRET=%s\n' "$SECRET" >> .env
	fi
	echo "Сгенерирован JWT_SECRET (32 байта, hex)"
fi

# ------------------------------------------------------------
step 5 "Скачиваю корневой сертификат НУЦ Минцифры для GigaChat"
# ------------------------------------------------------------
mkdir -p certs data backups
CERT=certs/russian_trusted_root_ca.cer
if [ -s "$CERT" ]; then
	echo "Сертификат уже на месте: $CERT"
else
	curl -fSL -o "$CERT" \
		"https://gu-st.ru/content/Other/doc/russian_trusted_root_ca.cer"
	echo "Сертификат сохранён: $CERT"
fi

# ------------------------------------------------------------
step 6 "Собираю и запускаю контейнеры"
# ------------------------------------------------------------
$SUDO docker compose up -d --build

# ------------------------------------------------------------
step 7 "Жду и проверяю healthcheck https://$DOMAIN/health"
# ------------------------------------------------------------
if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "bot.example.ru" ]; then
	OK=""
	for i in $(seq 1 30); do
		if curl -fsS --max-time 5 "https://$DOMAIN/health" >/dev/null 2>&1; then
			OK=1
			break
		fi
		printf '  попытка %s/30 — жду TLS и запуск...\n' "$i"
		sleep 4
	done
	if [ -n "$OK" ]; then
		echo "Healthcheck OK: $(curl -fsS "https://$DOMAIN/health")"
	else
		echo "Внимание: /health не ответил за ~2 мин. Проверьте:"
		echo "  docker compose logs -f app"
		echo "  A-запись домена $DOMAIN должна указывать на IP этого VPS."
	fi
else
	echo "Пропускаю HTTPS-проверку: домен не задан. После настройки домена:"
	echo "  curl https://<домен>/health"
fi

# ------------------------------------------------------------
step 8 "Ставлю ежедневный бэкап в cron (03:00)"
# ------------------------------------------------------------
CRON_LINE="0 3 * * * $REPO_ROOT/backup.sh >> $REPO_ROOT/backups/backup.log 2>&1"
( crontab -l 2>/dev/null | grep -vF "$REPO_ROOT/backup.sh" || true; echo "$CRON_LINE" ) | crontab -
echo "Cron установлен: $CRON_LINE"

echo
echo "Готово. Приложение поднято, бэкап по расписанию настроен."
echo "Логи:      docker compose logs -f app"
echo "Бэкап now: bash backup.sh"
