#!/usr/bin/env bash
set -euo pipefail

SOURCE="${DB_PATH:-/var/www/fitness-guide/server/data/fitness.db}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/fitness-guide}"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

if [ ! -f "$SOURCE" ]; then
  echo "Database not found: $SOURCE"
  exit 1
fi

cp "$SOURCE" "$BACKUP_DIR/fitness-$STAMP.db"
find "$BACKUP_DIR" -name 'fitness-*.db' -mtime +14 -delete
echo "Backup written to $BACKUP_DIR/fitness-$STAMP.db"
