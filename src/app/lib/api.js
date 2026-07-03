/* REST-обёртка кабинета «Подхват AI+».
   База — VITE_API_BASE (пусто в dev/preview). Токен сессии — localStorage podhvat_jwt.
   Все ошибки — мягкие: сеть недоступна → бросаем ApiError kind:'network',
   экран показывает «Что-то пошло не так, уже чиним», без падений и шума в консоли. */

const BASE = import.meta.env.VITE_API_BASE || '';
const TOKEN_KEY = 'podhvat_jwt';

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setToken(jwt) {
  try { localStorage.setItem(TOKEN_KEY, jwt); } catch { /* приватный режим — тихо */ }
}
export function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* тихо */ }
}

export class ApiError extends Error {
  constructor(message, { status, kind } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.kind = kind; // 'network' | 'auth' | 'http'
  }
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  const hasBody = body !== undefined && body !== null;
  if (hasBody) headers['Content-Type'] = 'application/json';
  if (auth) {
    const t = getToken();
    if (t) headers['Authorization'] = `Bearer ${t}`;
  }

  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: hasBody ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Нет сети / нет бэкенда — не роняем экран.
    throw new ApiError('Сеть недоступна', { kind: 'network' });
  }

  if (res.status === 401) {
    // Только для запросов с сессией: сбрасываем токен и уводим на вход.
    // Неавторизованные вызовы (обмен magic-токена) обрабатывает сам экран.
    if (auth) {
      clearToken();
      if (typeof window !== 'undefined' && !window.location.pathname.endsWith('/app/login')) {
        window.location.assign('/app/login');
      }
    }
    throw new ApiError('Требуется вход', { status: 401, kind: 'auth' });
  }

  if (!res.ok) {
    throw new ApiError('Запрос не удался', { status: res.status, kind: 'http' });
  }

  const text = await res.text();
  if (!text) return {};
  try { return JSON.parse(text); } catch { return {}; }
}

export const api = {
  get: (path, opts) => request(path, { ...opts, method: 'GET' }),
  post: (path, body, opts) => request(path, { ...opts, method: 'POST', body: body ?? {} }),
};
