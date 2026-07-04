"""Слой данных: aiosqlite. Все персданные пациентов остаются в этом файле
на VPS в РФ — никаких внешних таблиц (152-ФЗ).

Таблицы: sessions, messages, leads, missed_calls, token_usage, errors.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import aiosqlite

from app.redaction import redact
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
    -- ЭТАП B: жизненный цикл лида и деньги
    status TEXT NOT NULL DEFAULT 'new',  -- new|pending|confirmed|booked|callback|lost
    slot TEXT,                           -- подтверждённый слот (ручной режим)
    est_sum INTEGER,                     -- ожидаемая сумма (средний чек услуги), ₽
    resume TEXT,                         -- краткое резюме диалога (уже редактировано)
    recovered_from_miss INTEGER NOT NULL DEFAULT 0,
    wants_callback INTEGER NOT NULL DEFAULT 0,
    patient_notified INTEGER NOT NULL DEFAULT 0,  -- финальное подтверждение отправлено
    confirmed_at TEXT,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_leads_clinic_date ON leads(clinic_slug, created_at);
CREATE INDEX IF NOT EXISTS idx_leads_clinic_status ON leads(clinic_slug, status);

-- Попытки доставки исходящих (каскад MAX→SMS): для streak-надёжности.
CREATE TABLE IF NOT EXISTS delivery_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_slug TEXT NOT NULL,
    ref TEXT NOT NULL,                   -- call_id или lead:<id>
    channel TEXT NOT NULL,               -- max|sms|telegram
    success INTEGER NOT NULL,
    created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_delivery_clinic ON delivery_attempts(clinic_slug, ref);

-- Инциденты доставки: обращение, где ВСЕ каналы упали (для reliability-streak).
CREATE TABLE IF NOT EXISTS incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_slug TEXT NOT NULL,
    ref TEXT NOT NULL,
    occurred_at TEXT NOT NULL,
    resolved_in_minutes INTEGER
);
CREATE INDEX IF NOT EXISTS idx_incidents_clinic ON incidents(clinic_slug, occurred_at);

-- Magic-link токены входа в кабинет (одноразовые, короткоживущие).
CREATE TABLE IF NOT EXISTS magic_tokens (
    token TEXT PRIMARY KEY,
    clinic_slug TEXT NOT NULL,
    tg_user_id INTEGER,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT
);

-- Дневной лимит автосообщений на номер (не более 1 за 24ч на номер).
CREATE TABLE IF NOT EXISTS auto_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_slug TEXT NOT NULL,
    phone TEXT NOT NULL,
    date TEXT NOT NULL,                  -- YYYY-MM-DD (МСК)
    UNIQUE(clinic_slug, phone, date)
);

-- Суточный счётчик исходящих SMS на клинику (защита баланса).
CREATE TABLE IF NOT EXISTS sms_counters (
    clinic_slug TEXT NOT NULL,
    date TEXT NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (clinic_slug, date)
);

-- Мутабельные настройки клиники из кабинета (поверх YAML-профиля).
CREATE TABLE IF NOT EXISTS clinic_settings (
    clinic_slug TEXT PRIMARY KEY,
    data_json TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT NOT NULL
);

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
        await self._migrate()
        await self._conn.commit()

    # Новые колонки на существующих БД (CREATE IF NOT EXISTS их не добавит).
    _LEAD_COLUMNS = {
        "status": "TEXT NOT NULL DEFAULT 'new'",
        "slot": "TEXT",
        "est_sum": "INTEGER",
        "resume": "TEXT",
        "recovered_from_miss": "INTEGER NOT NULL DEFAULT 0",
        "wants_callback": "INTEGER NOT NULL DEFAULT 0",
        "patient_notified": "INTEGER NOT NULL DEFAULT 0",
        "confirmed_at": "TEXT",
    }

    async def _migrate(self) -> None:
        rows = await self._fetchall("PRAGMA table_info(leads)")
        existing = {r["name"] for r in rows}
        for col, decl in self._LEAD_COLUMNS.items():
            if col not in existing:
                # SQLite не разрешает NOT NULL без DEFAULT в ALTER — у всех есть DEFAULT.
                await self.conn.execute(f"ALTER TABLE leads ADD COLUMN {col} {decl}")
        await self.conn.commit()

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
        # 152-ФЗ: чувствительные фразы пациента (диагнозы/болезни) чистим ДО записи.
        if role == "user":
            content = redact(content)
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
        status: str = "new",
        est_sum: int | None = None,
        resume: str | None = None,
        recovered_from_miss: bool = False,
        wants_callback: bool = False,
    ) -> int:
        cur = await self.conn.execute(
            "INSERT INTO leads (session_id, clinic_slug, channel, source, name, phone,"
            " service, urgency, preferred_time, is_urgent, is_night, wants_human,"
            " status, est_sum, resume, recovered_from_miss, wants_callback, created_at)"
            " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
                status,
                est_sum,
                resume,
                int(recovered_from_miss),
                int(wants_callback),
                _ts(),
            ),
        )
        await self.conn.commit()
        return cur.lastrowid

    # --- Лиды: чтение/переходы статуса (ВСЕГДА со scope по clinic_slug) --------

    async def list_leads(
        self, clinic_slug: str, *, status: str | None = None, limit: int = 100
    ) -> list[dict[str, Any]]:
        sql = "SELECT * FROM leads WHERE clinic_slug = ?"
        params: list[Any] = [clinic_slug]
        if status:
            sql += " AND status = ?"
            params.append(status)
        sql += " ORDER BY is_urgent DESC, id DESC LIMIT ?"
        params.append(limit)
        rows = await self._fetchall(sql, tuple(params))
        return [dict(r) for r in rows]

    async def get_lead(self, lead_id: int, clinic_slug: str) -> dict[str, Any] | None:
        """Возвращает лид ТОЛЬКО если он принадлежит этой клинике (иначе None → 403)."""
        row = await self._fetchone(
            "SELECT * FROM leads WHERE id = ? AND clinic_slug = ?", (lead_id, clinic_slug)
        )
        return dict(row) if row else None

    async def set_lead_status(
        self, lead_id: int, clinic_slug: str, status: str, *, slot: str | None = None
    ) -> bool:
        """Идемпотентно меняет статус в рамках клиники. False — лид не найден/чужой."""
        sets = "status = ?"
        params: list[Any] = [status]
        if slot is not None:
            sets += ", slot = ?"
            params.append(slot)
        if status in ("confirmed", "booked"):
            sets += ", confirmed_at = COALESCE(confirmed_at, ?)"
            params.append(_ts())
        params += [lead_id, clinic_slug]
        cur = await self.conn.execute(
            f"UPDATE leads SET {sets} WHERE id = ? AND clinic_slug = ?", tuple(params)
        )
        await self.conn.commit()
        return cur.rowcount > 0

    async def mark_patient_notified(self, lead_id: int, clinic_slug: str) -> bool:
        """Ставит флаг «пациенту отправлено финальное подтверждение».
        Возвращает True ТОЛЬКО при первом переходе 0→1 (идемпотентность рассылки)."""
        cur = await self.conn.execute(
            "UPDATE leads SET patient_notified = 1"
            " WHERE id = ? AND clinic_slug = ? AND patient_notified = 0",
            (lead_id, clinic_slug),
        )
        await self.conn.commit()
        return cur.rowcount > 0

    async def phone_seen_before(self, clinic_slug: str, phone: str, before_lead_id: int) -> bool:
        """Был ли этот номер у клиники в более раннем лиде (пометка «повторный»)."""
        if not phone:
            return False
        n = await self._scalar(
            "SELECT COUNT(*) FROM leads WHERE clinic_slug = ? AND phone = ? AND id < ?",
            (clinic_slug, phone, before_lead_id),
        )
        return n > 0

    async def transcript(self, lead_id: int, clinic_slug: str) -> list[dict[str, Any]] | None:
        """Полный диалог лида (тексты уже редактированы при записи). None — чужой лид."""
        lead = await self.get_lead(lead_id, clinic_slug)
        if lead is None:
            return None
        return await self.full_dialog(lead["session_id"])

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

    # --- Деньги (возвращённые рубли) --------------------------------------

    async def recovered_by_day(self, clinic_slug: str, days: int) -> list[dict[str, Any]]:
        """Возвращённые ₽ по дням: сумма est_sum записанных лидов (confirmed|booked)."""
        rows = await self._fetchall(
            "SELECT substr(created_at, 1, 10) AS day,"
            " COUNT(*) AS leads, COALESCE(SUM(COALESCE(est_sum, 0)), 0) AS rub"
            " FROM leads WHERE clinic_slug = ? AND status IN ('confirmed', 'booked')"
            " AND created_at >= datetime(?, ?)"
            " GROUP BY day ORDER BY day",
            (clinic_slug, _ts(), f"-{days} days"),
        )
        return [dict(r) for r in rows]

    async def count_leads(self, clinic_slug: str, days: int, status: str | None = None) -> int:
        sql = "SELECT COUNT(*) FROM leads WHERE clinic_slug = ? AND created_at >= datetime(?, ?)"
        params: list[Any] = [clinic_slug, _ts(), f"-{days} days"]
        if status:
            sql += " AND status = ?"
            params.append(status)
        return await self._scalar(sql, tuple(params))

    async def count_booked(self, clinic_slug: str, days: int) -> int:
        return await self._scalar(
            "SELECT COUNT(*) FROM leads WHERE clinic_slug = ?"
            " AND status IN ('confirmed', 'booked') AND created_at >= datetime(?, ?)",
            (clinic_slug, _ts(), f"-{days} days"),
        )

    async def recovered_total(self, clinic_slug: str, days: int) -> int:
        return await self._scalar(
            "SELECT COALESCE(SUM(COALESCE(est_sum, 0)), 0) FROM leads"
            " WHERE clinic_slug = ? AND status IN ('confirmed', 'booked')"
            " AND created_at >= datetime(?, ?)",
            (clinic_slug, _ts(), f"-{days} days"),
        )

    # --- Доставка и надёжность (reliability streak) -----------------------

    async def record_delivery(
        self, clinic_slug: str, ref: str, channel: str, success: bool
    ) -> None:
        await self.conn.execute(
            "INSERT INTO delivery_attempts (clinic_slug, ref, channel, success, created_at)"
            " VALUES (?, ?, ?, ?, ?)",
            (clinic_slug, ref, channel, int(success), _ts()),
        )
        await self.conn.commit()

    async def record_incident(
        self, clinic_slug: str, ref: str, resolved_in_minutes: int | None = None
    ) -> None:
        await self.conn.execute(
            "INSERT INTO incidents (clinic_slug, ref, occurred_at, resolved_in_minutes)"
            " VALUES (?, ?, ?, ?)",
            (clinic_slug, ref, _ts(), resolved_in_minutes),
        )
        await self.conn.commit()

    async def last_incident(self, clinic_slug: str) -> dict[str, Any] | None:
        row = await self._fetchone(
            "SELECT occurred_at, resolved_in_minutes FROM incidents"
            " WHERE clinic_slug = ? ORDER BY id DESC LIMIT 1",
            (clinic_slug,),
        )
        return dict(row) if row else None

    async def clinic_first_activity(self, clinic_slug: str) -> str | None:
        return await self._scalar_val(
            "SELECT MIN(created_at) FROM ("
            " SELECT created_at FROM leads WHERE clinic_slug = ?"
            " UNION ALL SELECT created_at FROM missed_calls WHERE clinic_slug = ?)",
            (clinic_slug, clinic_slug),
        )

    # --- Magic-link токены -------------------------------------------------

    async def create_magic_token(
        self, token: str, clinic_slug: str, tg_user_id: int | None, expires_at: str
    ) -> None:
        await self.conn.execute(
            "INSERT INTO magic_tokens (token, clinic_slug, tg_user_id, created_at, expires_at)"
            " VALUES (?, ?, ?, ?, ?)",
            (token, clinic_slug, tg_user_id, _ts(), expires_at),
        )
        await self.conn.commit()

    async def consume_magic_token(self, token: str, now: str) -> str | None:
        """Одноразовое гашение: возвращает clinic_slug, если токен валиден,
        не использован и не истёк; иначе None. Гонку двух кликов отсекает
        UPDATE ... WHERE used_at IS NULL (атомарно)."""
        cur = await self.conn.execute(
            "UPDATE magic_tokens SET used_at = ?"
            " WHERE token = ? AND used_at IS NULL AND expires_at >= ?",
            (now, token, now),
        )
        await self.conn.commit()
        if cur.rowcount == 0:
            return None
        row = await self._fetchone(
            "SELECT clinic_slug FROM magic_tokens WHERE token = ?", (token,)
        )
        return row["clinic_slug"] if row else None

    # --- Лимиты: автосообщения на номер и суточный SMS --------------------

    async def try_reserve_auto_message(self, clinic_slug: str, phone: str, date: str) -> bool:
        """True — можно слать (первое автосообщение номеру за сутки), уже зарезервировано.
        False — сегодня номеру уже слали (дневной лимит 1/24ч)."""
        try:
            await self.conn.execute(
                "INSERT INTO auto_messages (clinic_slug, phone, date) VALUES (?, ?, ?)",
                (clinic_slug, phone, date),
            )
            await self.conn.commit()
            return True
        except aiosqlite.IntegrityError:
            return False

    async def sms_count_today(self, clinic_slug: str, date: str) -> int:
        return await self._scalar(
            "SELECT COALESCE(count, 0) FROM sms_counters WHERE clinic_slug = ? AND date = ?",
            (clinic_slug, date),
        )

    async def incr_sms_count(self, clinic_slug: str, date: str) -> int:
        await self.conn.execute(
            "INSERT INTO sms_counters (clinic_slug, date, count) VALUES (?, ?, 1)"
            " ON CONFLICT(clinic_slug, date) DO UPDATE SET count = count + 1",
            (clinic_slug, date),
        )
        await self.conn.commit()
        return await self.sms_count_today(clinic_slug, date)

    # --- Настройки клиники (мутабельные, из кабинета) ---------------------

    async def get_clinic_settings(self, clinic_slug: str) -> dict[str, Any]:
        row = await self._fetchone(
            "SELECT data_json FROM clinic_settings WHERE clinic_slug = ?", (clinic_slug,)
        )
        return json.loads(row["data_json"]) if row else {}

    async def set_clinic_settings(self, clinic_slug: str, data: dict[str, Any]) -> None:
        await self.conn.execute(
            "INSERT INTO clinic_settings (clinic_slug, data_json, updated_at)"
            " VALUES (?, ?, ?)"
            " ON CONFLICT(clinic_slug) DO UPDATE SET data_json = excluded.data_json,"
            " updated_at = excluded.updated_at",
            (clinic_slug, json.dumps(data, ensure_ascii=False), _ts()),
        )
        await self.conn.commit()

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

    async def _scalar_val(self, sql: str, params: tuple = ()) -> Any:
        """Как _scalar, но возвращает сырое значение (может быть None/строкой)."""
        async with self.conn.execute(sql, params) as cur:
            row = await cur.fetchone()
            return row[0] if row else None
