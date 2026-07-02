"""Слой данных: aiosqlite. Все персданные пациентов остаются в этом файле
на VPS в РФ — никаких внешних таблиц (152-ФЗ).

Таблицы: sessions, messages, leads, missed_calls, token_usage, errors.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import aiosqlite

from app.utils import now_msk

_SCHEMA = """
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_slug TEXT NOT NULL,
    channel TEXT NOT NULL,               -- 'telegram' | 'widget'
    source TEXT NOT NULL DEFAULT 'direct',
    external_id TEXT NOT NULL,           -- tg chat id либо uuid виджета
    state TEXT NOT NULL DEFAULT 'GREETING',
    fields_json TEXT NOT NULL DEFAULT '{}',
    message_count INTEGER NOT NULL DEFAULT 0,
    is_closed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(channel, external_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES sessions(id),
    role TEXT NOT NULL,                  -- 'user' | 'assistant'
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, id);

CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES sessions(id),
    clinic_slug TEXT NOT NULL,
    channel TEXT NOT NULL,
    source TEXT NOT NULL,
    name TEXT,
    phone TEXT,
    service TEXT,
    urgency TEXT,                        -- 'planned' | 'pain' | 'urgent'
    preferred_time TEXT,
    is_urgent INTEGER NOT NULL DEFAULT 0,
    is_night INTEGER NOT NULL DEFAULT 0,
    wants_human INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_leads_clinic_date ON leads(clinic_slug, created_at);

CREATE TABLE IF NOT EXISTS missed_calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    call_id TEXT NOT NULL UNIQUE,
    clinic_slug TEXT NOT NULL,
    caller_phone TEXT NOT NULL,
    sms_sent INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS token_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,                  -- YYYY-MM-DD (МСК)
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_token_usage_date ON token_usage(date);

CREATE TABLE IF NOT EXISTS errors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    message TEXT NOT NULL
);
"""


def _ts() -> str:
    return now_msk().strftime("%Y-%m-%d %H:%M:%S")


class Database:
    def __init__(self, path: str):
        self.path = path
        self._conn: aiosqlite.Connection | None = None

    async def connect(self) -> None:
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        self._conn = await aiosqlite.connect(self.path)
        self._conn.row_factory = aiosqlite.Row
        await self._conn.executescript(_SCHEMA)
        await self._conn.commit()

    async def close(self) -> None:
        if self._conn:
            await self._conn.close()
            self._conn = None

    @property
    def conn(self) -> aiosqlite.Connection:
        assert self._conn is not None, "Database.connect() не вызван"
        return self._conn

    # --- Сессии ---------------------------------------------------------

    async def get_or_create_session(
        self, clinic_slug: str, channel: str, external_id: str, source: str
    ) -> dict[str, Any]:
        row = await self._fetchone(
            "SELECT * FROM sessions WHERE channel = ? AND external_id = ?",
            (channel, external_id),
        )
        if row:
            return dict(row)
        ts = _ts()
        try:
            cur = await self.conn.execute(
                "INSERT INTO sessions (clinic_slug, channel, source, external_id,"
                " created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
                (clinic_slug, channel, source, external_id, ts, ts),
            )
            await self.conn.commit()
        except aiosqlite.IntegrityError:
            # Гонка двух одновременных запросов (две вкладки виджета):
            # сессию уже вставил параллельный запрос — просто читаем её.
            row = await self._fetchone(
                "SELECT * FROM sessions WHERE channel = ? AND external_id = ?",
                (channel, external_id),
            )
            return dict(row)
        row = await self._fetchone("SELECT * FROM sessions WHERE id = ?", (cur.lastrowid,))
        return dict(row)

    async def reset_session(
        self, clinic_slug: str, channel: str, external_id: str, source: str
    ) -> dict[str, Any]:
        """Повторный /start: начинаем диалог заново с новым источником."""
        await self.conn.execute(
            "DELETE FROM sessions WHERE channel = ? AND external_id = ?",
            (channel, external_id),
        )
        await self.conn.commit()
        return await self.get_or_create_session(clinic_slug, channel, external_id, source)

    async def update_session(self, session_id: int, **values: Any) -> None:
        if "fields" in values:
            values["fields_json"] = json.dumps(values.pop("fields"), ensure_ascii=False)
        values["updated_at"] = _ts()
        cols = ", ".join(f"{k} = ?" for k in values)
        await self.conn.execute(
            f"UPDATE sessions SET {cols} WHERE id = ?", (*values.values(), session_id)
        )
        await self.conn.commit()

    async def bump_message_count(self, session_id: int) -> int:
        await self.conn.execute(
            "UPDATE sessions SET message_count = message_count + 1, updated_at = ?"
            " WHERE id = ?",
            (_ts(), session_id),
        )
        await self.conn.commit()
        row = await self._fetchone(
            "SELECT message_count FROM sessions WHERE id = ?", (session_id,)
        )
        return row["message_count"]

    # --- Сообщения ------------------------------------------------------

    async def add_message(self, session_id: int, role: str, content: str) -> int:
        cur = await self.conn.execute(
            "INSERT INTO messages (session_id, role, content, created_at)"
            " VALUES (?, ?, ?, ?)",
            (session_id, role, content, _ts()),
        )
        await self.conn.commit()
        return cur.lastrowid

    async def recent_messages(self, session_id: int, limit: int) -> list[dict[str, Any]]:
        rows = await self._fetchall(
            "SELECT role, content FROM messages WHERE session_id = ?"
            " ORDER BY id DESC LIMIT ?",
            (session_id, limit),
        )
        return [dict(r) for r in reversed(rows)]

    async def messages_after(self, session_id: int, after_id: int) -> list[dict[str, Any]]:
        rows = await self._fetchall(
            "SELECT id, role, content, created_at FROM messages"
            " WHERE session_id = ? AND id > ? ORDER BY id",
            (session_id, after_id),
        )
        return [dict(r) for r in rows]

    async def full_dialog(self, session_id: int) -> list[dict[str, Any]]:
        rows = await self._fetchall(
            "SELECT role, content, created_at FROM messages WHERE session_id = ? ORDER BY id",
            (session_id,),
        )
        return [dict(r) for r in rows]

    # --- Лиды -----------------------------------------------------------

    async def create_lead(
        self,
        session: dict[str, Any],
        fields: dict[str, Any],
        *,
        is_urgent: bool = False,
        is_night: bool = False,
        wants_human: bool = False,
    ) -> int:
        cur = await self.conn.execute(
            "INSERT INTO leads (session_id, clinic_slug, channel, source, name, phone,"
            " service, urgency, preferred_time, is_urgent, is_night, wants_human, created_at)"
            " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                session["id"],
                session["clinic_slug"],
                session["channel"],
                session["source"],
                fields.get("name"),
                fields.get("phone"),
                fields.get("service"),
                fields.get("urgency"),
                fields.get("preferred_time"),
                int(is_urgent),
                int(is_night),
                int(wants_human),
                _ts(),
            ),
        )
        await self.conn.commit()
        return cur.lastrowid

    async def leads_by_source(self, days: int) -> list[dict[str, Any]]:
        rows = await self._fetchall(
            "SELECT clinic_slug, source, COUNT(*) AS cnt FROM leads"
            " WHERE created_at >= datetime(?, ?)"
            " GROUP BY clinic_slug, source ORDER BY clinic_slug, cnt DESC",
            (_ts(), f"-{days} days"),
        )
        return [dict(r) for r in rows]

    # --- Пропущенные звонки ----------------------------------------------

    async def record_missed_call(
        self, call_id: str, clinic_slug: str, caller_phone: str
    ) -> bool:
        """True — звонок новый; False — такой call_id уже был (идемпотентность)."""
        try:
            await self.conn.execute(
                "INSERT INTO missed_calls (call_id, clinic_slug, caller_phone, created_at)"
                " VALUES (?, ?, ?, ?)",
                (call_id, clinic_slug, caller_phone, _ts()),
            )
            await self.conn.commit()
            return True
        except aiosqlite.IntegrityError:
            return False

    async def mark_sms_sent(self, call_id: str) -> None:
        await self.conn.execute(
            "UPDATE missed_calls SET sms_sent = 1 WHERE call_id = ?", (call_id,)
        )
        await self.conn.commit()

    # --- Токены и ошибки --------------------------------------------------

    async def add_token_usage(self, prompt: int, completion: int, total: int) -> None:
        await self.conn.execute(
            "INSERT INTO token_usage (date, prompt_tokens, completion_tokens, total_tokens)"
            " VALUES (?, ?, ?, ?)",
            (now_msk().strftime("%Y-%m-%d"), prompt, completion, total),
        )
        await self.conn.commit()

    async def tokens_for_date(self, date: str) -> int:
        row = await self._fetchone(
            "SELECT COALESCE(SUM(total_tokens), 0) AS t FROM token_usage WHERE date = ?",
            (date,),
        )
        return row["t"]

    async def log_error(self, message: str) -> None:
        await self.conn.execute(
            "INSERT INTO errors (created_at, message) VALUES (?, ?)", (_ts(), message)
        )
        await self.conn.commit()

    async def errors_for_date(self, date: str) -> list[str]:
        rows = await self._fetchall(
            "SELECT created_at, message FROM errors WHERE created_at LIKE ? ORDER BY id",
            (f"{date}%",),
        )
        return [f"{r['created_at']} {r['message']}" for r in rows]

    # --- Статистика для дайджестов и /stats --------------------------------

    async def clinic_day_stats(self, clinic_slug: str, date: str) -> dict[str, int]:
        like = f"{date}%"
        dialogs = await self._scalar(
            "SELECT COUNT(*) FROM sessions WHERE clinic_slug = ? AND created_at LIKE ?",
            (clinic_slug, like),
        )
        leads = await self._scalar(
            "SELECT COUNT(*) FROM leads WHERE clinic_slug = ? AND created_at LIKE ?",
            (clinic_slug, like),
        )
        night = await self._scalar(
            "SELECT COUNT(*) FROM leads WHERE clinic_slug = ? AND created_at LIKE ?"
            " AND is_night = 1",
            (clinic_slug, like),
        )
        from_sms = await self._scalar(
            "SELECT COUNT(*) FROM leads WHERE clinic_slug = ? AND created_at LIKE ?"
            " AND source = 'sms'",
            (clinic_slug, like),
        )
        missed = await self._scalar(
            "SELECT COUNT(*) FROM missed_calls WHERE clinic_slug = ? AND created_at LIKE ?",
            (clinic_slug, like),
        )
        return {
            "dialogs": dialogs,
            "leads": leads,
            "night": night,
            "from_sms": from_sms,
            "missed_calls": missed,
        }

    async def clinic_month_leads(self, clinic_slug: str, month: str) -> int:
        """month — 'YYYY-MM'."""
        return await self._scalar(
            "SELECT COUNT(*) FROM leads WHERE clinic_slug = ? AND created_at LIKE ?",
            (clinic_slug, f"{month}%"),
        )

    # --- Внутреннее -------------------------------------------------------

    async def _fetchone(self, sql: str, params: tuple = ()) -> aiosqlite.Row | None:
        async with self.conn.execute(sql, params) as cur:
            return await cur.fetchone()

    async def _fetchall(self, sql: str, params: tuple = ()) -> list[aiosqlite.Row]:
        async with self.conn.execute(sql, params) as cur:
            return list(await cur.fetchall())

    async def _scalar(self, sql: str, params: tuple = ()) -> int:
        async with self.conn.execute(sql, params) as cur:
            row = await cur.fetchone()
            return row[0] if row else 0
