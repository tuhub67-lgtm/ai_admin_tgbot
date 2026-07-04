/* Клиент кабинета «Подхват AI+».
   - JWT в localStorage['pk_jwt'], уходит заголовком Authorization: Bearer.
   - На 401 — чистим токен и сигналим смену авторизации (Layout покажет вход).
   - Мок-режим: если fetch не достучался до бэкенда ИЛИ VITE_API_MOCK==='1',
     отдаём реалистичные данные из mock.js. Реальный API используется, когда доступен. */

import { mockHandle } from './mock.js';

const TOKEN_KEY = 'pk_jwt';
const CLINIC_KEY = 'pk_clinic';

/* Событие смены авторизации (login / logout / 401). Layout подписывается. */
export const authEvents = typeof EventTarget !== 'undefined' ? new EventTarget() : null;
function signalAuth() {
  if (authEvents) authEvents.dispatchEvent(new Event('change'));
}

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) || null; } catch { return null; }
}
export function saveToken(token) {
  try { localStorage.setItem(TOKEN_KEY, token); } catch { /* ignore */ }
  signalAuth();
}
export function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(CLINIC_KEY); } catch { /* ignore */ }
  signalAuth();
}

export function saveClinic(clinic) {
  try { localStorage.setItem(CLINIC_KEY, JSON.stringify(clinic)); } catch { /* ignore */ }
}
export function getClinic() {
  try { return JSON.parse(localStorage.getItem(CLINIC_KEY) || 'null'); } catch { return null; }
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message || `HTTP ${status}`);
    this.status = status;
    this.name = 'ApiError';
  }
}

/* Мок включается принудительно через env или автоматически, если бэкенда нет.
   backendSeen — «мы уже видели живой ответ бэкенда», чтобы реальные 404/500
   не переключали клиент в мок навсегда. */
let mockActive = import.meta.env.VITE_API_MOCK === '1';
let backendSeen = false;

async function request(path, { method = 'GET', body = null, auth = true } = {}) {
  if (mockActive) return mockHandle(path, method, body);

  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  let res;
  try {
    res = await fetch(path, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Не достучались до сервера → мок-режим (dev/preview без бэкенда).
    if (!backendSeen) { mockActive = true; return mockHandle(path, method, body); }
    throw new ApiError(0, 'network');
  }

  if (res.status === 401) {
    backendSeen = true;
    clearToken();
    throw new ApiError(401, 'unauthorized');
  }

  if (!res.ok) {
    // До первого живого ответа считаем, что бэкенда просто нет (dev отдаёт 404 на /api/*).
    if (!backendSeen) { mockActive = true; return mockHandle(path, method, body); }
    throw new ApiError(res.status, `HTTP ${res.status}`);
  }

  const ct = res.headers.get('content-type') || '';
  const text = await res.text();
  if (!ct.includes('json')) {
    // Например dev-сервер отдал index.html вместо JSON — значит бэкенда нет.
    if (!backendSeen) { mockActive = true; return mockHandle(path, method, body); }
  }
  backendSeen = true;
  return text ? JSON.parse(text) : {};
}

export const api = {
  verify: (token) => request(`/api/auth/verify?token=${encodeURIComponent(token)}`, { auth: false }),
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
