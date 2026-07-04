#!/bin/sh
# Дамп SQLite в ./backups через безопасный online-backup SQLite (без остановки БД).
# Хранит последние 14 копий. Раз в неделю копию нужно забирать с VPS (см. README).
set -e

DB="${DB_PATH:-/data/podkhvat.db}"
OUT="${BACKUP_DIR:-/backups}"
mkdir -p "$OUT"

if [ ! -f "$DB" ]; then
  echo "backup: база не найдена ($DB) — пропускаю"
  exit 0
fi

ts=$(date +%Y%m%d-%H%M%S)
dest="$OUT/podkhvat-$ts.db"
sqlite3 "$DB" ".backup '$dest'"
gzip -f "$dest"
echo "backup: создан ${dest}.gz"

# Ротация: оставляем 14 последних архивов
ls -1t "$OUT"/podkhvat-*.db.gz 2>/dev/null | tail -n +15 | xargs -r rm -f
