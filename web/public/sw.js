/* Подхват AI+ — минимальный service worker кабинета.
   - Кэширует оболочку приложения (app shell) для офлайн-открытия.
   - GET /api/money/weekly: сеть → при офлайне отдаём последний сохранённый отчёт.
   Регистрируется только из кабинета (CabinetLayout), не с витрины. */

const CACHE = 'pk-cab-v1';
const SHELL = ['/', '/index.html', '/favicon.svg', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Последний отчёт «Деньги» — свежий из сети, при офлайне отдаём кэш.
  if (url.pathname === '/api/money/weekly') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  // Прочие вызовы API — только сеть (не кэшируем ленту/настройки).
  if (url.pathname.startsWith('/api/')) return;

  // Навигация внутри кабинета — сеть, при офлайне отдаём оболочку.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html').then((r) => r || caches.match('/'))),
    );
    return;
  }

  // Статика (JS/CSS/шрифты/иконки) — cache-first.
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((res) => {
      if (res && res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy));
      }
      return res;
    }).catch(() => cached)),
  );
});
