#!/usr/bin/env bash
# scripts/codeql-ci-scan.sh
# ─────────────────────────────────────────────────────────────────────────────
# Runs a single CodeQL analysis language pass inside the Docker container
# created by docker-compose.codeql.yml.  Mirrors github/codeql-action@v4 exactly:
#   - security-and-quality query suite
#   - build-mode: manual (traced build for C#, no-build for TS)
#   - Same paths-ignore rules from .github/codeql/codeql-config.yml
#   - --source-root set to repo root (not a sub-directory)
#
# Usage:  bash /repo/scripts/codeql-ci-scan.sh <csharp|typescript>
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

LANGUAGE="${1:-}"
REPO_ROOT="/repo"
CODEQL_DIR="${REPO_ROOT}/.codeql"
DB_DIR="${CODEQL_DIR}/databases"
RESULTS_DIR="${CODEQL_DIR}/results"
CONFIG_FILE="${REPO_ROOT}/.github/codeql/codeql-config.yml"

mkdir -p "${DB_DIR}" "${RESULTS_DIR}"

# ─── Ensure curl is available (node:*-slim images omit it) ──────────────────
if ! command -v curl &>/dev/null; then
  echo ">>> Installing curl..."
  apt-get update -qq && apt-get install -y --no-install-recommends curl ca-certificates
fi

# ─── Install CodeQL CLI ───────────────────────────────────────────────────────
CODEQL_VERSION="2.24.2"
CODEQL_CACHE_BIN="${CODEQL_DIR}/codeql-${CODEQL_VERSION}/codeql"

if [[ ! -f "${CODEQL_CACHE_BIN}" ]]; then
  echo ">>> Downloading CodeQL CLI ${CODEQL_VERSION}..."
  CODEQL_BUNDLE="codeql-bundle-linux64.tar.gz"
  CODEQL_URL="https://github.com/github/codeql-action/releases/download/codeql-bundle-v${CODEQL_VERSION}/${CODEQL_BUNDLE}"
  CODEQL_EXTRACT_DIR="${CODEQL_DIR}/codeql-${CODEQL_VERSION}"
  mkdir -p "${CODEQL_EXTRACT_DIR}"
  curl -fsSL "${CODEQL_URL}" -o /tmp/codeql.tar.gz
  tar -xzf /tmp/codeql.tar.gz -C "${CODEQL_EXTRACT_DIR}" --strip-components=1
  rm /tmp/codeql.tar.gz
  echo ">>> CodeQL CLI installed at ${CODEQL_CACHE_BIN}"
fi

CODEQL="${CODEQL_CACHE_BIN}"
echo ">>> Using CodeQL: $("${CODEQL}" --version 2>&1 | head -1)"

# ─── C# scan ─────────────────────────────────────────────────────────────────
if [[ "${LANGUAGE}" == "csharp" ]]; then
  DB="${DB_DIR}/csharp-ci"
  SARIF="${RESULTS_DIR}/csharp-ci-parity.sarif"

  echo ">>> [C#] Removing stale database (if any)..."
  rm -rf "${DB}"

  echo ">>> [C#] Creating CodeQL database (traced build — build-mode: manual)..."
  "${CODEQL}" database create "${DB}" \
    --language=csharp \
    --source-root="${REPO_ROOT}" \
    --codescanning-config="${CONFIG_FILE}" \
    --build-mode=manual \
    --command="dotnet build ${REPO_ROOT}/SeventySix.Server/SeventySix.Server.slnx --configuration Release -p:SkipAnalyzers=true --nologo -v:q"

  echo ">>> [C#] Running security-and-quality queries..."
  "${CODEQL}" database analyze "${DB}" \
    --format=sarifv2.1.0 \
    --output="${SARIF}" \
    --sarif-add-baseline-file-info \
    csharp-security-and-quality.qls

  echo ">>> [C#] Results written to ${SARIF}"
  echo ">>> [C#] Summary:"
  # Print rule counts using simple grep on the SARIF file
  grep -o '"ruleId":"[^"]*"' "${SARIF}" \
    | sort | uniq -c | sort -rn \
    | head -30 || true

  RESULTS_COUNT=$(grep -o '"ruleId"' "${SARIF}" | wc -l)
  echo ">>> [C#] Total results: ${RESULTS_COUNT}"
fi

# ─── TypeScript scan ──────────────────────────────────────────────────────────
if [[ "${LANGUAGE}" == "typescript" ]]; then
  DB="${DB_DIR}/typescript-ci"
  SARIF="${RESULTS_DIR}/typescript-ci-parity.sarif"

  echo ">>> [TS] Installing Node packages (needed for JS/TS analysis)..."
  cd "${REPO_ROOT}/SeventySix.Client"
  # Use npm ci in the container (no caching needed — volume mount provides node_modules from host if present)
  if [[ ! -d node_modules ]]; then
    npm ci --prefer-offline 2>/dev/null || npm install
  fi
  cd "${REPO_ROOT}"

  echo ">>> [TS] Removing stale database (if any)..."
  rm -rf "${DB}"

  echo ">>> [TS] Creating CodeQL database (build-mode: none — auto-extraction)..."
  "${CODEQL}" database create "${DB}" \
    --language=javascript-typescript \
    --source-root="${REPO_ROOT}" \
    --codescanning-config="${CONFIG_FILE}" \
    --build-mode=none

  echo ">>> [TS] Running security-and-quality queries..."
  "${CODEQL}" database analyze "${DB}" \
    --format=sarifv2.1.0 \
    --output="${SARIF}" \
    --sarif-add-baseline-file-info \
    javascript-security-and-quality.qls

  echo ">>> [TS] Results written to ${SARIF}"
  echo ">>> [TS] Summary:"
  grep -o '"ruleId":"[^"]*"' "${SARIF}" \
    | sort | uniq -c | sort -rn \
    | head -20 || true

  RESULTS_COUNT=$(grep -o '"ruleId"' "${SARIF}" | wc -l)
  echo ">>> [TS] Total results: ${RESULTS_COUNT}"
fi
