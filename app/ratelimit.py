"""Простой in-memory rate-limit (скользящее окно) для защиты от перебора/спама.

Хватает для одного процесса на VPS. При переезде на несколько инстансов —
заменить на Redis. Ключ — IP или clinic_slug в зависимости от эндпоинта.
"""

from __future__ import annotations

from collections import defaultdict, deque

from app.utils import now_msk


class RateLimiter:
    def __init__(self, max_events: int, window_seconds: int):
        self.max = max_events
        self.window = window_seconds
        self._hits: dict[str, deque] = defaultdict(deque)

    def allow(self, key: str) -> bool:
        """True — можно; False — лимит превышен (в текущем окне)."""
        now = now_msk().timestamp()
        hits = self._hits[key]
        while hits and now - hits[0] > self.window:
            hits.popleft()
        if len(hits) >= self.max:
            return False
        hits.append(now)
        return True


def client_ip(request) -> str:
    """IP клиента с учётом обратного прокси (Caddy проставляет X-Forwarded-For)."""
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
