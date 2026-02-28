#!/usr/bin/env bash
# Daily production backup script for SeventySix
# Backs up: PostgreSQL database + Data Protection keys
# Syncs to Cloudflare R2 (offsite) via rclone
#
# Secrets are NOT loaded from any file — DB credentials are read directly
# from the running container's environment (no .env file required).
#
# Prerequisites:
#   - Docker running with seventysix-prod containers
#   - rclone configured with 'r2' remote (see docs/Deployment.md)
#
# Crontab entry (daily at 3 AM):
#   0 3 * * * /srv/seventysix/scripts/backup.sh >> /var/log/seventysix-backup.log 2>&1

set -euo pipefail

# ── Configuration ──────────────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-/srv/seventysix/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
R2_REMOTE="${R2_REMOTE:-r2:seventysix-backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# ── Setup ──────────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"
echo "[$(date)] === Starting backup ==="

# ── 1. Database dump ──────────────────────────────────────────
echo "[$(date)] Backing up PostgreSQL..."
DB_CONTAINER=$(docker ps -qf "name=seventysix-postgres-prod")
if [ -z "$DB_CONTAINER" ]; then
    echo "[ERROR] PostgreSQL container not found"
    exit 1
fi

# Read DB credentials from the running container's environment (no .env file needed)
DB_USER=$(docker inspect "$DB_CONTAINER" \
    --format '{{range .Config.Env}}{{println .}}{{end}}' \
    | grep '^POSTGRES_USER=' | cut -d= -f2)
DB_NAME=$(docker inspect "$DB_CONTAINER" \
    --format '{{range .Config.Env}}{{println .}}{{end}}' \
    | grep '^POSTGRES_DB=' | cut -d= -f2)
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-seventysix}"

docker exec "$DB_CONTAINER" \
    pg_dump -U "$DB_USER" "$DB_NAME" --no-owner --no-privileges \
    | gzip > "${BACKUP_DIR}/db_${TIMESTAMP}.sql.gz"

DB_SIZE=$(du -h "${BACKUP_DIR}/db_${TIMESTAMP}.sql.gz" | cut -f1)
echo "[$(date)] Database backup complete: ${DB_SIZE}"

# ── 2. Data Protection keys ───────────────────────────────────
echo "[$(date)] Backing up Data Protection keys..."
VOLUME_PATH=$(docker volume inspect seventysix_dataprotection_prod_keys --format '{{ .Mountpoint }}' 2>/dev/null || true)

if [ -n "$VOLUME_PATH" ] && [ -d "$VOLUME_PATH" ]; then
    tar czf "${BACKUP_DIR}/dataprotection_${TIMESTAMP}.tar.gz" \
        -C "$VOLUME_PATH" .
    DP_SIZE=$(du -h "${BACKUP_DIR}/dataprotection_${TIMESTAMP}.tar.gz" | cut -f1)
    echo "[$(date)] Data Protection backup complete: ${DP_SIZE}"
else
    echo "[WARN] Data Protection volume not found — skipping"
fi

# ── 3. Offsite sync to Cloudflare R2 ──────────────────────────
if command -v rclone &> /dev/null; then
    echo "[$(date)] Syncing to Cloudflare R2..."
    rclone copy "$BACKUP_DIR" "$R2_REMOTE" \
        --include "db_*.sql.gz" \
        --include "dataprotection_*.tar.gz" \
        --log-level INFO 2>&1 || echo "[WARN] rclone R2 sync failed — local backup retained"
    echo "[$(date)] R2 sync complete"
else
    echo "[WARN] rclone not installed — skipping offsite sync"
    echo "        Install: apt-get install -y rclone"
    echo "        Configure: rclone config (S3 → Cloudflare R2)"
fi

# ── 4. Local retention cleanup ─────────────────────────────────
echo "[$(date)] Cleaning up local backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete
find "$BACKUP_DIR" -name "dataprotection_*.tar.gz" -mtime "+${RETENTION_DAYS}" -delete

echo "[$(date)] === Backup complete ==="
