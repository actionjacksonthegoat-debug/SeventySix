#!/usr/bin/env bash
# Daily production backup script for SeventySix
# Backs up: PostgreSQL (main + commerce) + Data Protection keys
# Syncs to Cloudflare R2 (offsite) via rclone
# Encrypts database dumps with GPG (requires BACKUP_GPG_RECIPIENT to be set)
#
# Secrets are NOT loaded from any file — DB credentials are read directly
# from the running container's environment (no .env file required).
#
# Prerequisites:
#   - Docker running with seventysix-prod containers
#   - rclone configured with 'r2' remote (see docs/Deployment.md)
#   - GPG public key imported: gpg --import backup-pub.key
#     Set BACKUP_GPG_RECIPIENT to the key ID or email address used for encryption.
#     If BACKUP_GPG_RECIPIENT is not set, backups are NOT encrypted — only acceptable
#     in non-production environments without PII.
#
# Crontab entry (daily at 3 AM):
#   0 3 * * * /srv/seventysix/scripts/backup.sh >> /var/log/seventysix-backup.log 2>&1

set -euo pipefail

# ── Configuration ──────────────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-/srv/seventysix/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
R2_REMOTE="${R2_REMOTE:-r2:seventysix-backups}"
BACKUP_GPG_RECIPIENT="${BACKUP_GPG_RECIPIENT:-}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# ── Setup ──────────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"
echo "[$(date)] === Starting backup ==="

if [ -z "${BACKUP_GPG_RECIPIENT}" ]; then
    echo "[WARN] BACKUP_GPG_RECIPIENT is not set — database backups will NOT be encrypted."
    echo "       Set BACKUP_GPG_RECIPIENT to a GPG key ID to enable encryption."
    echo "       See docs/Deployment.md#backup-encryption-setup for setup instructions."
else
    echo "[$(date)] GPG encryption enabled for recipient: ${BACKUP_GPG_RECIPIENT}"
fi

# ── Helper: encrypt a file with GPG (or keep as-is if no recipient) ──────────
encrypt_backup() {
    local file="$1"
    if [ -n "${BACKUP_GPG_RECIPIENT}" ]; then
        gpg --batch --yes --trust-model always \
            --encrypt --recipient "${BACKUP_GPG_RECIPIENT}" \
            --output "${file}.gpg" "${file}"
        rm -f "${file}"
        echo "${file}.gpg"
    else
        echo "${file}"
    fi
}

# ── Helper: dump a PostgreSQL database to a gzip file ──────────
dump_postgres_db() {
    local container="$1"
    local db_user="$2"
    local db_name="$3"
    local out_file="$4"

    docker exec "${container}" \
        pg_dump -U "${db_user}" "${db_name}" --no-owner --no-privileges \
        | gzip > "${out_file}"
}

# ── 1. Main application database ─────────────────────────────
echo "[$(date)] Backing up main PostgreSQL..."
DB_CONTAINER=$(docker ps -qf "name=seventysix-postgres-prod")
if [ -z "$DB_CONTAINER" ]; then
    echo "[ERROR] Main PostgreSQL container not found"
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

MAIN_DB_FILE="${BACKUP_DIR}/db_${TIMESTAMP}.sql.gz"
dump_postgres_db "${DB_CONTAINER}" "${DB_USER}" "${DB_NAME}" "${MAIN_DB_FILE}"
MAIN_DB_FILE=$(encrypt_backup "${MAIN_DB_FILE}")
DB_SIZE=$(du -h "${MAIN_DB_FILE}" | cut -f1)
echo "[$(date)] Main database backup complete: ${DB_SIZE}"

# ── 2. SeventySixCommerce databases ───────────────────────────
echo "[$(date)] Backing up SeventySixCommerce PostgreSQL..."
COMMERCE_CONTAINER=$(docker ps -qf "name=SeventySixCommerce-postgres-prod")
if [ -z "${COMMERCE_CONTAINER}" ]; then
    echo "[WARN] SeventySixCommerce PostgreSQL container not found — skipping commerce backup"
else
    COMMERCE_DB_USER=$(docker inspect "${COMMERCE_CONTAINER}" \
        --format '{{range .Config.Env}}{{println .}}{{end}}' \
        | grep '^POSTGRES_USER=' | cut -d= -f2 || echo "SeventySixCommerce")
    COMMERCE_DB_USER="${COMMERCE_DB_USER:-SeventySixCommerce}"

    # TanStack database
    COMMERCE_TANSTACK_FILE="${BACKUP_DIR}/commerce_tanstack_${TIMESTAMP}.sql.gz"
    dump_postgres_db "${COMMERCE_CONTAINER}" "${COMMERCE_DB_USER}" "SeventySixCommerce" "${COMMERCE_TANSTACK_FILE}"
    COMMERCE_TANSTACK_FILE=$(encrypt_backup "${COMMERCE_TANSTACK_FILE}")
    TANSTACK_SIZE=$(du -h "${COMMERCE_TANSTACK_FILE}" | cut -f1)
    echo "[$(date)] Commerce TanStack database backup complete: ${TANSTACK_SIZE}"

    # SvelteKit database
    COMMERCE_SVELTEKIT_FILE="${BACKUP_DIR}/commerce_sveltekit_${TIMESTAMP}.sql.gz"
    dump_postgres_db "${COMMERCE_CONTAINER}" "${COMMERCE_DB_USER}" "SeventySixCommerce_sveltekit" "${COMMERCE_SVELTEKIT_FILE}"
    COMMERCE_SVELTEKIT_FILE=$(encrypt_backup "${COMMERCE_SVELTEKIT_FILE}")
    SVELTEKIT_SIZE=$(du -h "${COMMERCE_SVELTEKIT_FILE}" | cut -f1)
    echo "[$(date)] Commerce SvelteKit database backup complete: ${SVELTEKIT_SIZE}"
fi

# ── 3. Data Protection keys ───────────────────────────────────
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

# ── 4. Offsite sync to Cloudflare R2 ──────────────────────────
if command -v rclone &> /dev/null; then
    echo "[$(date)] Syncing to Cloudflare R2..."
    rclone copy "$BACKUP_DIR" "$R2_REMOTE" \
        --include "db_*.sql.gz" \
        --include "db_*.sql.gz.gpg" \
        --include "commerce_*.sql.gz" \
        --include "commerce_*.sql.gz.gpg" \
        --include "dataprotection_*.tar.gz" \
        --log-level INFO 2>&1 || echo "[WARN] rclone R2 sync failed — local backup retained"
    echo "[$(date)] R2 sync complete"
else
    echo "[WARN] rclone not installed — skipping offsite sync"
    echo "        Install: apt-get install -y rclone"
    echo "        Configure: rclone config (S3 → Cloudflare R2)"
fi

# ── 5. Local retention cleanup ─────────────────────────────────
echo "[$(date)] Cleaning up local backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "db_*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete
find "$BACKUP_DIR" -name "db_*.sql.gz.gpg" -mtime "+${RETENTION_DAYS}" -delete
find "$BACKUP_DIR" -name "commerce_*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete
find "$BACKUP_DIR" -name "commerce_*.sql.gz.gpg" -mtime "+${RETENTION_DAYS}" -delete
find "$BACKUP_DIR" -name "dataprotection_*.tar.gz" -mtime "+${RETENTION_DAYS}" -delete

echo "[$(date)] === Backup complete ==="
