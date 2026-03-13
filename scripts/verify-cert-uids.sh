#!/bin/bash
# Verifies that the runtime UIDs for images that mount private key files match
# the ACLs set by scripts/generate-internal-ca.ps1.
#
# If an upstream image changes its UID, the container silently loses access to
# its key at runtime. This script catches the mismatch at deploy time instead.
#
# UIDs are not secrets — they are public information from docker image inspect.
# The canonical source for expected UIDs is this file. Update here and re-run
# cert generation (scripts/generate-internal-ca.ps1) if any UID changes.
#
# Expected UIDs (as of March 2026):
#   otel/opentelemetry-collector-contrib — 10001 (explicit in upstream Dockerfile)
#   jaegertracing/all-in-one            — 10001 (explicit in upstream Dockerfile)
#   oliver006/redis_exporter            — 59000 (explicit in upstream Dockerfile)
#   SeventySix API (appuser)            —   999 (pinned via -u 999 in Dockerfile.production)
#   postgres:18-alpine                  —    70 (Alpine convention for postgres user;
#                                               not checked here — handled by chown 70:70)
#   valkey, nginx                       —     0 (root — no ACL needed)

set -euo pipefail

FAILED=0

check_uid() {
    local image="$1"
    local expected="$2"
    local label="$3"

    actual=$(docker image inspect "$image" --format '{{.Config.User}}' 2>/dev/null | cut -d: -f1)
    if [ "$actual" != "$expected" ]; then
        echo "ERROR: $label UID changed: expected $expected, got '$actual'"
        echo "       1. Update the expected UID in scripts/verify-cert-uids.sh"
        echo "       2. Update the setfacl entry in scripts/generate-internal-ca.ps1"
        echo "       3. Re-run cert generation on the server"
        FAILED=1
    else
        echo "  [ok] $label UID=$actual"
    fi
}

echo "=== Verifying container UIDs match cert ACLs ==="

# Pull exact image tags from docker-compose.production.yml so this script
# stays in sync automatically (grep for the image: lines).
COMPOSE_FILE="$(dirname "$0")/../docker-compose.production.yml"

API_IMAGE=$(grep -E '^\s+image:.*ghcr\.io.*seventysix-api' "$COMPOSE_FILE" | head -1 | awk '{print $2}')
OTEL_IMAGE=$(grep -E '^\s+image:.*opentelemetry-collector-contrib' "$COMPOSE_FILE" | head -1 | awk '{print $2}')
JAEGER_IMAGE=$(grep -E '^\s+image:.*jaegertracing' "$COMPOSE_FILE" | head -1 | awk '{print $2}')
EXPORTER_IMAGE=$(grep -E '^\s+image:.*redis_exporter' "$COMPOSE_FILE" | head -1 | awk '{print $2}')

check_uid "$API_IMAGE"      "999"   "API (appuser)"
check_uid "$OTEL_IMAGE"     "10001" "otel-collector"
check_uid "$JAEGER_IMAGE"   "10001" "jaeger"
check_uid "$EXPORTER_IMAGE" "59000" "redis-exporter"

if [ "$FAILED" -ne 0 ]; then
    echo ""
    echo "UID mismatch detected — aborting deploy."
    exit 1
fi

echo "All UIDs verified."
