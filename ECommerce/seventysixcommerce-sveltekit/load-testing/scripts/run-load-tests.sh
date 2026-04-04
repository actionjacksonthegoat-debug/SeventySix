#!/usr/bin/env bash
# run-load-tests.sh
# Linux/CI orchestrator for SeventySixCommerce SvelteKit load tests
#
# Usage:
#   ./scripts/run-load-tests.sh                    # Smoke profile, all scenarios
#   ./scripts/run-load-tests.sh load                # Load profile
#   ./scripts/run-load-tests.sh stress              # Stress profile
#   ./scripts/run-load-tests.sh smoke health/health-check  # Single scenario
#   KEEP_RUNNING=1 ./scripts/run-load-tests.sh      # Don't stop containers after

set -euo pipefail

PROFILE="${1:-smoke}"
SCENARIO="${2:-}"
KEEP_RUNNING="${KEEP_RUNNING:-0}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOAD_TEST_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$LOAD_TEST_ROOT/../../.." && pwd)"

echo ""
echo "========================================"
echo "  SvelteKit Load Tests ($PROFILE)"
echo "========================================"
echo ""

# 1. Check k6 is installed
if ! command -v k6 &>/dev/null; then
	echo "ERROR: k6 is not installed."
	echo ""
	echo "Install k6 using one of these methods:"
	echo "  brew install k6                          # macOS"
	echo "  sudo apt-get install k6                  # Debian/Ubuntu"
	echo "  https://grafana.com/docs/k6/latest/set-up/install-k6/"
	echo ""
	exit 1
fi

echo "k6 found: $(k6 version)"

# 1b. Clean stale results/reports from previous runs
echo ""
echo "Cleaning previous results..."
for DIR in "$LOAD_TEST_ROOT/results" "$LOAD_TEST_ROOT/reports"; do
	if [ -d "$DIR" ]; then
		find "$DIR" -mindepth 1 ! -name ".gitkeep" -exec rm -rf {} + 2>/dev/null || true
	fi
done

# 2. Start Docker load test environment
echo ""
echo "Starting SvelteKit load test environment..."
cd "$REPO_ROOT"
docker compose -f docker-compose.loadtest-svelte.yml up -d --build

# 3. Wait for app health check
echo ""
echo "Waiting for SvelteKit app to become healthy..."
MAX_ATTEMPTS=60
ATTEMPT=0
APP_HEALTHY=0

while [ "$ATTEMPT" -lt "$MAX_ATTEMPTS" ]; do
	ATTEMPT=$((ATTEMPT + 1))
	HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3021/healthz" 2>/dev/null || echo "000")
	if [ "$HTTP_CODE" = "200" ]; then
		APP_HEALTHY=1
		break
	fi
	echo "  Attempt $ATTEMPT/$MAX_ATTEMPTS - App not ready (HTTP $HTTP_CODE)..."
	sleep 5
done

if [ "$APP_HEALTHY" -ne 1 ]; then
	echo "ERROR: App failed to become healthy after $MAX_ATTEMPTS attempts."
	if [ "$KEEP_RUNNING" != "1" ]; then
		docker compose -f docker-compose.loadtest-svelte.yml down
	fi
	exit 1
fi

echo "SvelteKit app is healthy!"

# 4. Run k6 scenarios
echo ""
echo "Running k6 load tests (profile: $PROFILE)..."
EXIT_CODE=0

cd "$LOAD_TEST_ROOT"

if [ -n "$SCENARIO" ]; then
	# Run single scenario
	SCENARIO_PATH="scenarios/$SCENARIO.test.js"
	if [ ! -f "$SCENARIO_PATH" ]; then
		SCENARIO_PATH="scenarios/$SCENARIO"
	fi
	echo "  Running: $SCENARIO_PATH"
	k6 run -q --env "PROFILE=$PROFILE" "$SCENARIO_PATH" || EXIT_CODE=1
else
	# Run all scenarios
	for SCENARIO_FILE in $(find scenarios -name "*.test.js" -type f | sort); do
		echo "  Running: $SCENARIO_FILE"
		if k6 run -q --env "PROFILE=$PROFILE" "$SCENARIO_FILE"; then
			echo "  PASSED: $SCENARIO_FILE"
		else
			echo "  FAILED: $SCENARIO_FILE"
			EXIT_CODE=1
		fi
	done
fi

# 5. Generate summary report
echo ""
echo "Generating summary report..."
node scripts/generate-summary.js || echo "WARNING: Summary generation failed"

# 6. Stop containers (unless KEEP_RUNNING=1)
if [ "$KEEP_RUNNING" != "1" ]; then
	echo ""
	echo "Stopping load test environment..."
	cd "$REPO_ROOT"
	docker compose -f docker-compose.loadtest-svelte.yml down
else
	echo ""
	echo "Environment left running (KEEP_RUNNING=1)."
	echo "Stop manually: docker compose -f docker-compose.loadtest-svelte.yml down"
fi

echo ""
if [ "$EXIT_CODE" -eq 0 ]; then
	echo "All load tests PASSED!"
else
	echo "Some load tests FAILED. Check reports for details."
fi

exit $EXIT_CODE
