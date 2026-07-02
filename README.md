# Подхват — ИИ-администратор для клиник

Мультиарендный бот: пациент общается с «Анной» в Telegram или в веб-виджете на
сайте клиники, бот квалифицирует обращение (услуга → срочность → имя → телефон
→ время) и мгновенно передаёт заявку живым сотрудникам в TG-группу клиники.
Отдельный модуль ловит пропущенные звонки через Novofon и возвращает пациента
SMS-кой со ссылкой на бота.

- **Стек**: Python 3.12, uv, aiogram 3.29 (long polling), FastAPI + uvicorn,
  GigaChat (официальный SDK, новый контракт `chat.create`), aiosqlite,
  APScheduler, loguru, Docker + Caddy.
- **Персданные**: всё в SQLite на вашем VPS в РФ, никаких внешних таблиц
  (152-ФЗ). Телефоны в логах маскируются до `+7***1234`.
- Одна кодовая база обслуживает много клиник: профиль клиники — YAML-файл в
  `app/clinics/`.

## Быстрый старт: чистый Ubuntu 22 VPS (Timeweb/Beget, ~400–600 ₽/мес)

### 0. Что нужно до начала

| Ключ | Где взять |
|---|---|
| Токен бота | @BotFather → `/newbot` |
| Authorization Key GigaChat | [developers.sber.ru](https://developers.sber.ru/portal/products/gigachat-api) → проект GigaChat API → «Авторизационные данные» |
| API-ключ SMS Aero | [smsaero.ru](https://smsaero.ru) → Настройки → API-ключ |
| Аккаунт + номер Novofon | [novofon.com](https://novofon.com), API-секрет в `my.novofon.com/api` |
| Домен | любой, A-запись на IP VPS (нужен для виджета и вебхуков) |

### 1. Установка на сервер

```bash
apt update && apt install -y git ca-certificates curl
# Docker + compose-плагин
curl -fsSL https://get.docker.com | sh

git clone <ваш-репозиторий> podkhvat && cd podkhvat
cp .env.example .env
nano .env        # вписать все ключи (см. комментарии в файле)
echo "DOMAIN=bot.ваш-домен.ru" >> .env
```

### 2. Сертификат GigaChat (НУЦ Минцифры) — два пути

API GigaChat работает по TLS-сертификату Национального удостоверяющего центра
Минцифры, которого нет в стандартных доверенных корнях Python (certifi).
Выберите один из вариантов:

**Вариант А (рекомендуется): указать файл сертификата.**

```bash
mkdir -p certs
curl -o certs/russian_trusted_root_ca.cer \
  "https://gu-st.ru/content/Other/doc/russian_trusted_root_ca.cer"
# или скачайте «Russian Trusted Root CA» вручную с https://www.gosuslugi.ru/crt
```

В `.env`: `GIGACHAT_CA_BUNDLE_FILE=/app/certs/russian_trusted_root_ca.cer`
(папка `certs/` уже прокинута в контейнер через docker-compose).

**Вариант Б: установить русские CA в систему** (если запускаете без Docker):

```bash
curl -o /usr/local/share/ca-certificates/russian_trusted_root_ca.crt \
  "https://gu-st.ru/content/Other/doc/russian_trusted_root_ca.cer"
update-ca-certificates
# и укажите системный бандл:
# GIGACHAT_CA_BUNDLE_FILE=/etc/ssl/certs/ca-certificates.crt
```

Крайняя мера для локальной отладки — `GIGACHAT_VERIFY_SSL=false`
(в проде так делать нельзя).

### 3. Запуск

```bash
docker compose up -d --build
docker compose logs -f app   # «Подхват запущен: клиник 1, бот @...»
```

Caddy сам получит сертификат Let's Encrypt для `DOMAIN`. Проверка:

```bash
curl https://bot.ваш-домен.ru/health          # {"status":"ok"}
curl -I https://bot.ваш-домен.ru/static/widget.js   # 200
```

### 4. Подключение группы клиники

1. Создайте Telegram-группу клиники, добавьте туда бота.
2. Узнайте ID группы: перешлите любое сообщение из группы боту @userinfobot
   или посмотрите `chat_id` в логах. ID супергрупп начинается с `-100`.
3. Впишите его в `tg_group_id` YAML-файла клиники и перезапустите:
   `docker compose restart app`.

### 5. Пропущенные звонки (Novofon)

1. В кабинете клиники на её основном номере включите переадресацию
   «по неответу» на номер Novofon клиники (`novofon_number` в YAML).
2. В `my.novofon.com/api` укажите URL вебхука:
   `https://bot.ваш-домен.ru/webhook/novofon?secret=<NOVOFON_WEBHOOK_SECRET из .env>`
   и включите уведомления о начале/конце входящих звонков.
   Проверочный GET с `zd_echo` приложение отработает автоматически.
3. (Рекомендуется) Впишите API-секрет Novofon в `NOVOFON_API_SECRET` — тогда
   каждый вебхук дополнительно проверяется по подписи `Signature`.
4. В SMS Aero согласуйте имя отправителя (`sms_sender` в YAML) — без него SMS
   уходят с подписью по умолчанию «SMS Aero».

Тест без телефона:

```bash
curl -X POST "https://bot.ваш-домен.ru/webhook/novofon?secret=..." \
  -d "event=NOTIFY_END" -d "pbx_call_id=test-1" -d "disposition=cancel" \
  -d "caller_id=+79161234567" -d "called_did=+78430000001" \
  -d "call_start=2026-07-01 12:00:00" -d "duration=0"
```

В группу клиники придёт «📵 Пропущенный звонок…», пациенту — SMS со ссылкой
`t.me/<бот>?start=<клиника>__sms`. Повторный `pbx_call_id` игнорируется.

> Примечание: если `NOVOFON_API_SECRET` уже задан (шаг 3), этот curl вернёт
> 403 `bad signature` — настоящие вебхуки Novofon подписаны заголовком
> `Signature`, а тестовый запрос нет. Прогоните тест до включения секрета
> (или временно очистите его и `docker compose restart app`).

## Добавить клинику за 15 минут

1. `uv run python scripts/add_clinic.py --interactive` — отвечаете на вопросы,
   скрипт создаёт `app/clinics/<slug>.yaml` и печатает deep-link'и + сниппет
   виджета. (Без флага создаётся демо-клиника demo-dent.)
2. Создайте TG-группу клиники, добавьте бота, впишите `tg_group_id` в YAML.
3. `docker compose restart app`.
4. Отдайте клинике:
   - deep-link для лендинга/рекламы: `https://t.me/<бот>?start=<slug>__landing`
   - сниппет виджета на сайт (перед `</body>`):
     `<script src="https://ваш-домен/static/widget.js" data-clinic="<slug>" defer></script>`
   - QR со ссылкой `...?start=<slug>__qr` — на ресепшн.
5. Если подключаете пропущенные звонки — шаг «Novofon» выше.

### Источники трафика

Deep-link формат: `t.me/<бот>?start=<slug>__<src>`, где
`src ∈ {landing, sms, call, qr, site}`. Виджет проставляет `site`
автоматически, SMS-возврат — `sms`. Каждая сессия и заявка хранит источник;
разбивку за 7/30 дней смотрите командой `/stats` (доступна только
`OWNER_TG_ID`) — по ней меряется конверсия лендинг → бот → заявка.

## Дайджесты

Ежедневно в 20:00 МСК:

- в группу каждой клиники — диалоги/заявки за день (ночные и «спасённые» из
  пропущенных звонков отдельно) и «X заявок ≈ Y ₽ спасённой рекламы» за месяц
  (Y = X × `lead_cost` из YAML);
- владельцу (`OWNER_TG_ID`) — сводка по всем клиникам, все ошибки за день и
  расход токенов GigaChat в рублях.

## Снять расход токенов

Каждый ответ GigaChat пишет `input/output/total_tokens` в таблицу
`token_usage`. Варианты:

- **Вечерний дайджест владельцу** — строка «🤖 GigaChat: N токенов ≈ M ₽».
- **Вручную из SQLite**:

  ```bash
  docker compose exec app uv run python - <<'PY'
  import sqlite3
  db = sqlite3.connect("data/podkhvat.db")
  for date, tokens in db.execute(
      "SELECT date, SUM(total_tokens) FROM token_usage GROUP BY date ORDER BY date DESC LIMIT 30"
  ):
      print(date, tokens, "ток.")
  PY
  ```

- Точная цена за 1000 токенов зависит от тарифа — поправьте
  `GIGACHAT_RUB_PER_1K_TOKENS` в `.env`, и дайджест будет считать в рублях
  правильно. Официальный расход также виден в личном кабинете
  developers.sber.ru.

## Разработка и тесты

```bash
uv sync --group dev
uv run pytest            # 10 приёмочных сценариев + дополнительные
uv run uvicorn app.main:app --reload   # локальный запуск (нужен .env)
```

Чек-лист приёмки (`tests/test_acceptance.py`): полная анкета, честные цены
(«от …» / «цену назовёт врач»), протокол острой боли (🔴 СРОЧНО), валидация
телефона, честный ответ «я цифровой помощник», «позовите человека», антиспам и
лимиты, виджет (канал/источник), вебхук Novofon с идемпотентностью, ночная
заявка.

## Архитектура

```
app/
  main.py            # FastAPI + aiogram polling в одном процессе
  config.py          # env + clinics/*.yaml (pydantic-валидация)
  clinics/demo-dent.yaml
  core/
    dialogue.py      # state machine целей шага + LLM-формулировки
    prompts.py       # системный промпт «Анны»
    llm.py           # GigaChat: новый контракт, function calling, ретраи,
                     # таймаут 15с, лимит токенов, счётчик расхода
    llm_base.py      # интерфейс LLM (тесты подставляют FakeLLM)
  channels/
    telegram.py      # aiogram; deep-link /start <slug>__<src>; /stats
    widget_api.py    # REST /api/chat; сессия по uuid
  leads.py           # карточка в TG-группу + SQLite
  missed_calls.py    # POST /webhook/novofon → SMS Aero
  digest.py          # ежедневные отчёты (APScheduler, Europe/Moscow)
  db.py              # sessions, messages, leads, missed_calls, token_usage
static/widget.js     # ванильный JS ~9 КБ, Shadow DOM
scripts/add_clinic.py
tests/               # pytest по чек-листу приёмки
```

Слои не смешаны: рядом в этот же репозиторий встаёт второй личный бот «Штаб»
(та же БД, отдельный токен) — общие `db.py`/`config.py`, свой канал.

## Что осознанно НЕ в MVP

Админ-панель, CRM-интеграции (YCLIENTS/IDENT/amoCRM — после 5 клиентов),
онлайн-оплата, голос, мультиязычность, webhook-режим aiogram, Kubernetes.
