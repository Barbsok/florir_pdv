#!/bin/bash
set -e

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

mkdir -p backups

TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="backups/backup_${TIMESTAMP}.sql"

echo "Starting backup..."
docker compose exec -T postgres \
  pg_dump -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-flora_pdv}" \
  --clean --if-exists > "$BACKUP_FILE"
echo "Backup saved: $BACKUP_FILE"
