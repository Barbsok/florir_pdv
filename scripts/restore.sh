#!/bin/bash
set -e

if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

if [ -n "$1" ]; then
  BACKUP_FILE="$1"
else
  BACKUP_FILE=$(ls -t backups/*.sql 2>/dev/null | head -1)
fi

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: No backup file found."
  echo "Usage: npm run restore              (uses latest backup)"
  echo "       npm run restore -- <file>    (uses specific file)"
  exit 1
fi

echo "Restoring from: $BACKUP_FILE"
docker compose exec -T postgres \
  psql -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-flora_pdv}" < "$BACKUP_FILE"
echo "Restore completed successfully."
