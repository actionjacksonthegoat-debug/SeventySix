````instructions
---
description: k6 load test patterns and rules for SeventySix load-testing
applyTo: "**/SeventySix.Client/load-testing/**/*.js"
---

# Load Testing (Grafana k6)

## File Locations

| Type | Location | Pattern |
|------|----------|---------|
| Scenarios | `scenarios/{domain}/` | `*.test.js` — individual load test scripts |
| Constants | `lib/constants/` | `*.constants.js` — shared magic-free values |
| Builders | `lib/builders/` | `*.builder.js` — payload factory functions |
| Libraries | `lib/` | Shared helpers (auth, HTTP, data gen, guards) |
| Config | `config/` | Profile definitions (smoke/load/stress/quick) |
| Reports | `reports/` | Generated HTML (gitignored) |
| Results | `results/` | Raw JSON/CSV (gitignored) |

## Profile Usage

| Profile | Purpose | Gate? |
|---------|---------|-------|
| `smoke` | Health-only sanity check — verify infrastructure is alive | No |
| `quick` | **Completion gate** — all scenarios, 20 VUs, 60s, condensed proof of work | **Yes** |
| `stress` | Breaking point analysis — 200 VUs, 10min | No (manual) |
| `load` | Full baseline capacity — all scenarios, 50 VUs, 5min (~40 min total) | No (manual) |

> Use **context7 MCP** for up-to-date k6 API documentation when writing scenarios.

A pre-provisioned **Grafana k6 dashboard** (`grafana/k6-dashboard.json`) is available in the dev Grafana instance at `https://localhost:3443`.

## Scenario Pattern (REQUIRED)

Every scenario MUST:
1. Import config from `../../lib/config.js`
2. Import constants from `../../lib/constants/index.js` — NEVER use inline magic values
3. Import builders from `../../lib/builders/index.js` for structured payloads
4. Define `options` with thresholds from `THRESHOLDS.*` preset
5. Use `setup()` for one-time auth token acquisition
6. Use `isSetupInvalid(data)` guard in `default function`
7. Use `default function(data)` for the load loop
8. Export `handleSummary()` for HTML + JSON report generation
9. Tag requests with `buildTags(FLOW_TAGS.*, OPERATION_TAGS.*)`
10. Use `sleep(SLEEP_DURATION.*)` instead of literal numbers

## Scenario Template

```javascript
import { sleep } from "k6";
import { CONFIG, getOptions } from "../../lib/config.js";
import { loginAsAdmin } from "../../lib/auth.js";
import { authenticatedGet } from "../../lib/http-helpers.js";
import { isStatus200, isJsonResponse } from "../../lib/checks.js";
import { createSummaryHandler } from "../../lib/summary.js";
import { isSetupInvalid } from "../../lib/guards.js";
import {
	FLOW_TAGS,
	OPERATION_TAGS,
	SLEEP_DURATION,
	THRESHOLDS,
	buildTags
} from "../../lib/constants/index.js";

export const options =
	getOptions(THRESHOLDS.STANDARD);

export function setup()
{
	const authData =
		loginAsAdmin();
	return { accessToken: authData.accessToken };
}

export default function(data)
{
	if (isSetupInvalid(data))
	{
		return;
	}

	const response =
		authenticatedGet(
			`${CONFIG.apiUrl}/{endpoint}`,
			data.accessToken,
			buildTags(FLOW_TAGS.{DOMAIN}, OPERATION_TAGS.{NAME}));
	isStatus200(response);
	isJsonResponse(response);
	sleep(SLEEP_DURATION.STANDARD);
}

export const handleSummary =
	createSummaryHandler("{domain}-{name}");
```

## Constants (REQUIRED — No Magic Values)

Always import from `../../lib/constants/index.js`. Never use inline numbers or strings.

| Module | Contents |
|--------|----------|
| `http.constants.js` | `HTTP_STATUS`, `HTTP_HEADER`, `CONTENT_TYPE` |
| `api-endpoints.constants.js` | `AUTH_ENDPOINTS`, `USER_ENDPOINTS`, `PERMISSION_ENDPOINTS`, `LOG_ENDPOINTS`, `HEALTH_ENDPOINTS` |
| `tags.constants.js` | `FLOW_TAGS`, `OPERATION_TAGS`, `buildTags()` |
| `thresholds.constants.js` | `THRESHOLDS` — preset threshold objects per scenario type |
| `test-data.constants.js` | `TEST_DATA_PREFIX`, `LOG_LEVEL`, `HEALTH_STATUS`, `SLEEP_DURATION` |

### Adding New Constants

1. Add to the appropriate `*.constants.js` module
2. Re-export from `lib/constants/index.js` barrel
3. Use `Object.freeze()` for all constant objects

## Builders (Payload Factories)

Use builders for structured request payloads. Never build payloads inline in scenarios.

```javascript
import { buildClientLogPayload } from "../../lib/builders/index.js";
import { buildCreateUserPayload } from "../../lib/builders/index.js";

const payload = buildClientLogPayload({ message: "custom" });
const userPayload = buildCreateUserPayload({ isActive: false });
```

## Guards (Setup Validation)

Every scenario with `setup()` data MUST use `isSetupInvalid()`:

```javascript
import { isSetupInvalid } from "../../lib/guards.js";

export default function(data)
{
	if (isSetupInvalid(data))
	{
		return;
	}
	// ... test logic
}
```

## Variable Naming (CRITICAL — 3+ Characters)

| [NEVER] | [ALWAYS] |
|----------|-----------|
| `res` | `response` |
| `resp` | `response` |
| `auth.token` | `authData.accessToken` |
| `data.token` | `data.accessToken` |
| `s` / `obj` | Descriptive name (3+ chars) |

**Exception**: None — k6 check callbacks use `(response) =>` not `(resp) =>`.

## Null Coercion (BANNED)

Same rules as Client — no `!!value`, no `!value` for null checks.

| [NEVER] | [ALWAYS] |
|----------|-----------|
| `!data` | `data == null` |
| `!!value` | Explicit comparison |
| `!data.accessToken` | `data.accessToken == null` |

Use `isSetupInvalid(data)` guard from `lib/guards.js` instead of inline null checks.

## Test Data Rules

| Rule | Pattern |
|------|---------|
| Prefix | All generated data uses `loadtest_` prefix |
| Uniqueness | `loadtest_${Date.now()}_${randomInt()}` |
| Idempotency | Tests create own data, never depend on prior runs |
| No cleanup | Data persists — environment is disposable |

## Thresholds (CRITICAL)

Use preset objects from `THRESHOLDS.*`:

| Preset | p95 Duration | Error Rate | Use For |
|--------|-------------|------------|---------|
| `HEALTH` | < 200ms | < 1% | Health checks |
| `FAST` | < 500ms | < 1% | Simple GETs |
| `STANDARD` | < 1500ms | < 1% | Most endpoints |
| `RELAXED` | < 1500ms | < 5% | Moderate tolerance |
| `SLOW` | < 2000ms | < 5% | Complex operations |
| `BATCH` | < 1000ms | < 1% | Batch operations |
| `PERMISSIVE` | < 1500ms | < 10% | Stress scenarios |

## Import Rules

```javascript
// k6 modules — import from k6 namespace
import http from "k6/http";
import { check, sleep } from "k6";

// Constants — ALWAYS from barrel export
import { HTTP_STATUS, FLOW_TAGS, THRESHOLDS } from "../../lib/constants/index.js";

// Builders — from barrel export
import { buildClientLogPayload } from "../../lib/builders/index.js";

// Guards — from lib/guards.js
import { isSetupInvalid } from "../../lib/guards.js";

// Shared libs — import from ../../lib/
import { CONFIG, getOptions } from "../../lib/config.js";
import { loginAsAdmin } from "../../lib/auth.js";

// Remote modules — pin to specific versions
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/2.4.0/dist/bundle.js";

// NEVER use Node.js require() — k6 uses ES6 modules only
```

## Code Quality Tooling

Load-testing files use the **Client's umbrella configs** — no standalone eslint/dprint configs.

```bash
# Format everything (server + client + load-testing)
npm run format

# Format client + load-testing only
cd SeventySix.Client && npm run format
```

## Cross-Platform

- Scripts use ES6 modules (k6 native) — NOT Node.js `require()`
- File paths use `/` only (k6 normalizes on all platforms)
- Config uses JSON (cross-platform, no shell interpolation)

## Docker Environment

The load test environment runs in isolation with dedicated ports:

| Service | Port |
|---------|------|
| PostgreSQL | 5435 |
| Valkey | 6381 |
| API | 7175 |
| Client | 4202 |

Start: `docker compose -f docker-compose.loadtest.yml up -d`
Stop: `docker compose -f docker-compose.loadtest.yml down`

## Auth Helpers

```javascript
// Admin auth — for user management, permissions
import { loginAsAdmin } from "../../lib/auth.js";
const authData = loginAsAdmin();

// User auth — for permission requests, general flows
import { loginAsUser } from "../../lib/auth.js";
const authData = loginAsUser();

// Token is in authData.accessToken, cookie jar in authData.jar
```

## HTTP Helpers

```javascript
import { authenticatedGet, authenticatedPost } from "../../lib/http-helpers.js";

// GET with auth
const response = authenticatedGet(url, accessToken, params);

// POST with auth + JSON body
const response = authenticatedPost(url, accessToken, body, params);
```
````
