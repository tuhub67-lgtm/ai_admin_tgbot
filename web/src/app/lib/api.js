/* Клиент кабинета «Подхват AI+».
   Сессия — в HttpOnly-cookie pk_session (JS её НЕ читает): защита от кражи токена
   через XSS. Браузер сам шлёт cookie (credentials: 'include'). На мутирующих
   запросах добавляем заголовок X-CSRF-Token из читаемой cookie pk_csrf
   (signed double-submit) — защита от CSRF.
   Мок-режим: если fetch не достучался до бэкенда ИЛИ VITE_API_MOCK==='1',
   отдаём данные из mock.js. */

import { mockHandle } from './mock.js';

const CSRF_COOKIE = 'pk_csrf';

/* Событие смены авторизации (login / logout / 401). Layout переспросит сессию. */
export const authEvents = typeof EventTarget !== 'undefined' ? new EventTarget() : null;
export function signalAuth() {
  if (authEvents) authEvents.dispatchEvent(new Event('change'));
}

function readCookie(name) {
  if (typeof document === 'undefined') return '';
  const m = document.cookie.match(new RegExp('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)'));
  return m ? decodeURIComponent(m.pop()) : '';
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message || `HTTP ${status}`);
    this.status = status;
    this.name = 'ApiError';
  }
}

let mockActive = import.meta.env.VITE_API_MOCK === '1';
let backendSeen = false;

async function request(path, { method = 'GET', body = null } = {}) {
  if (mockActive) return mockHandle(path, method, body);

  const headers = { 'Content-Type': 'application/json' };
  const mutating = method !== 'GET' && method !== 'HEAD';
  if (mutating) {
    const csrf = readCookie(CSRF_COOKIE);
    if (csrf) headers['X-CSRF-Token'] = csrf;
  }

  let res;
  try {
    res = await fetch(path, {
      method,
      headers,
      credentials: 'include', // браузер приложит cookie сессии
      body: body != null ? JSON.stringify(body) : undefined,
    });
  } catch {
    if (!backendSeen) { mockActive = true; return mockHandle(path, method, body); }
    throw new ApiError(0, 'network');
  }

  if (res.status === 401) {
    backendSeen = true;
    signalAuth(); // сессия истекла/отсутствует → Layout покажет вход
    throw new ApiError(401, 'unauthorized');
  }
  if (!res.ok) {
    if (!backendSeen) { mockActive = true; return mockHandle(path, method, body); }
    throw new ApiError(res.status, `HTTP ${res.status}`);
  }

  const ct = res.headers.get('content-type') || '';
  const text = await res.text();
  if (!ct.includes('json')) {
    if (!backendSeen) { mockActive = true; return mockHandle(path, method, body); }
  }
  backendSeen = true;
  return text ? JSON.parse(text) : {};
}

export const api = {
  // Вход: /auth/verify выставляет HttpOnly-cookie сессии (в теле токена нет).
  verify: (token) => request(`/api/auth/verify?token=${encodeURIComponent(token)}`),
  session: () => request('/api/auth/session'),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  leads: (status) => request(`/api/leads${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  transcript: (id) => request(`/api/leads/${id}/transcript`),
  setStatus: (id, status) => request(`/api/leads/${id}/status`, { method: 'POST', body: { status } }),
  confirm: (id, slot) => request(`/api/leads/${id}/confirm`, { method: 'POST', body: slot ? { slot } : {} }),
  money: () => request('/api/money/weekly'),
  streak: () => request('/api/reliability-streak'),
  getSettings: () => request('/api/settings'),
  saveSettings: (settings) => request('/api/settings', { method: 'POST', body: { settings } }),
};

export function isMock() { return mockActive; }
