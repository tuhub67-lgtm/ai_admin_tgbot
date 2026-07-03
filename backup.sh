#!/usr/bin/env bash
# ============================================================
# Подхват AI+ — резервная копия базы (Этап B)
# Снимает согласованную копию SQLite (./data/podkhvat.db) в ./backups,
# хранит последние 14 копий, печатает путь к свежей.
# Запуск вручную:  bash backup.sh
# Ежедневно 03:00 (ставит setup.sh):
#   0 3 * * * /path/backup.sh >> /path/backups/backup.log 2>&1
# Папка ./backups проброшена в контейнер как /backups (docker-compose.yml).
# ============================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
DB="${DB_PATH_HOST:-$REPO_ROOT/data/podkhvat.db}"
BACKUP_DIR="${BACKUP_DIR:-$REPO_ROOT/backups}"
KEEP=14
STAMP="$(date +%F)"                      # YYYY-MM-DD
DEST="$BACKUP_DIR/podkhvat-$STAMP.db"

mkdir -p "$BACKUP_DIR"

if [ ! -f "$DB" ]; then
	echo "Ошибка: база не найдена: $DB" >&2
	echo "Проверьте, что приложение запускалось хотя бы раз (docker compose up)." >&2
	exit 1
fi

# Согласованная копия (безопасно при активной записи и WAL):
#   1) sqlite3 .backup  2) online-backup через python3  3) обычное копирование
if command -v sqlite3 >/dev/null 2>&1; then
	sqlite3 "$DB" ".backup '$DEST'"
elif command -v python3 >/dev/null 2>&1; then
	python3 - "$DB" "$DEST" <<'PY'
import sqlite3, sys
src = sqlite3.connect(sys.argv[1])
dst = sqlite3.connect(sys.argv[2])
with dst:
    src.backup(dst)
dst.close()
src.close()
PY
else
	echo "Внимание: нет sqlite3/python3 — копирую файл как есть (может быть неполной при активной записи)." >&2
	cp "$DB" "$DEST"
fi

# Ротация: оставляем KEEP самых свежих копий, остальные удаляем
ls -1t "$BACKUP_DIR"/podkhvat-*.db 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f

echo "Готово: $DEST"
