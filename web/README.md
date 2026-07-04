# Подхват AI+ — витрина и кабинет (web)

Единый React + Vite проект: **витрина** на `/`, **кабинет** на `/app` (строится в ЭТАПЕ B), политика — `/privacy`.

## Запуск

```bash
npm install
npm run dev          # http://localhost:5173 — разработка
npm run build        # сборка в dist/
npm run preview      # локальный предпросмотр dist на :4173
```

В проде `dist/` раздаётся Caddy со SPA-фолбэком на `index.html` (роуты `/app/*`, `/privacy` — клиентские).

## Переменные окружения

См. `.env.example`. Все опциональны — при пустых значениях витрина работает с безопасными дефолтами
(Метрика не подключается, заявка логируется, вместо ссылок — плейсхолдеры).

Ключевая: `VITE_LEAD_WEBHOOK_URL` — куда слать заявку с формы. В ЭТАПЕ B → `/api/public/lead-request`.

## Дизайн

- Токены и компоненты — из дизайн-пака в `src/design/` (**read-only**; изменена только строка загрузки
  шрифтов — self-host через `@fontsource` вместо Google Fonts `@import`).
- Никаких градиентов: глубина — фацет, тёплые тени, доминирующая винная секция (решение зафиксировано на CHECKPOINT 0).
- Анимации: оркестрованный staggered page-load + scroll-reveal на IntersectionObserver
  (`src/lib/anim.jsx`), count-up денежных сумм с «золотым дингом» (`src/lib/CountUp.jsx`).
  Всё уважает `prefers-reduced-motion`; контент виден всегда, даже если анимация не сыграла.
- Оптимизированные логотип-плашки (~8 КБ) — в `src/assets/` (исходные 600px — в `src/design/assets/`).

## Структура

```
src/
  main.jsx           точка входа: шрифты + токены + роутер
  App.jsx            роуты: / · /privacy · /app/*
  config.js          плейсхолдеры/env
  app.css            раскладка, доступность, reveal-фолбэк, слайдер
  lib/               anim (reveal), CountUp, metrika
  landing/           11 секций витрины + LandingPage
  PrivacyPage.jsx    политика конфиденциальности (152-ФЗ)
  design/            вендоренный дизайн-пак (read-only)
  assets/            оптимизированные логотипы
```
