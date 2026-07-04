/* Плейсхолдеры и внешние параметры витрины. Все — через env (пусто → безопасный дефолт). */

export const FOUNDER_TG = import.meta.env.VITE_FOUNDER_TG || '@podhvat_osnovatel';
export const FOUNDER_TG_URL = `https://t.me/${FOUNDER_TG.replace(/^@/, '')}`;

// «Войти» — magic link через Telegram-бот (deep-link /start=login). Пусто → бот-заглушка.
export const BOT_LOGIN_URL = import.meta.env.VITE_BOT_LOGIN_URL || 'https://t.me/podhvat_bot?start=login';

// RuStore — страница приложения (вторичный CTA). Пусто → якорь-заглушка.
export const RUSTORE_URL = import.meta.env.VITE_RUSTORE_URL || '#rustore';

// Заявка с витрины → относительный /api того же origin (dev: Vite-прокси на :8000,
// прод: Caddy). Абсолютный URL можно переопределить env, но обычно не нужен.
export const LEAD_WEBHOOK_URL = import.meta.env.VITE_LEAD_WEBHOOK_URL || '/api/public/lead-request';

// Контакты в футере (плейсхолдеры).
export const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || 'hello@podhvat.ru';
