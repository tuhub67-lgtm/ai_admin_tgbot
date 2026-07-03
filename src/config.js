/* Конфиг сайта «Подхват AI+». Всё, что владелец меняет без правки кода, — через env (VITE_*).
   Плейсхолдеры {TG_USERNAME}/{RUSTORE_URL} видны в интерфейсе, пока не заданы env. */

const env = import.meta.env;

// Каноничный домен (предответ сайта). В коде — через конфиг.
export const SITE_DOMAIN = env.VITE_SITE_DOMAIN || 'podhvatplus.ru';
export const SITE_URL = `https://${SITE_DOMAIN}`;

// Город в примерах и калькуляторе (предответ сайта).
export const CITY = 'Ростов-на-Дону';

// Telegram основателя — плейсхолдер, владелец заменит через env.
export const TG_USERNAME = env.VITE_TG_USERNAME || '{TG_USERNAME}';
export const TG_URL = TG_USERNAME.startsWith('{')
  ? '#' // плейсхолдер: не ведём никуда, пока не задан
  : `https://t.me/${TG_USERNAME.replace(/^@/, '')}`;

// RuStore — приложение ещё не опубликовано. TODO: заменить на реальную ссылку после публикации.
export const RUSTORE_URL = env.VITE_RUSTORE_URL || '{RUSTORE_URL}';

// Куда уходит заявка формы.
// 1) если задан VITE_LEAD_WEBHOOK_URL — шлём туда (мастер-Решения);
// 2) иначе — на serverless-функцию Vercel /api/lead (спецификация сайта);
// 3) если и её нет (dev без бэкенда) — покажем успех и залогируем в консоль (см. LeadForm).
export const LEAD_ENDPOINT = env.VITE_LEAD_WEBHOOK_URL || '/api/lead';

// База API бэкенда (Этап B). На Этапе A не используется.
export const API_BASE = env.VITE_API_BASE || '';

// Ссылка на бота для входа в кабинет (заглушка Этапа A).
export const BOT_LOGIN_URL = env.VITE_BOT_URL || TG_URL;

export const isPlaceholder = (v) => typeof v === 'string' && v.startsWith('{') && v.endsWith('}');
