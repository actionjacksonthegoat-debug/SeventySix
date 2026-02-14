---
agent: agent
description: Add a new k6 load test scenario to SeventySix.Client/load-testing
---

# Add New Load Test Scenario

Create a new k6 load test script for: **{DESCRIBE THE API ENDPOINT OR FLOW}**

## Instructions

1. Read `.github/instructions/load-testing.instructions.md` before writing any code
2. Read an existing scenario in `SeventySix.Client/load-testing/scenarios/` for reference patterns

## MCP Tools

- Use **context7** to fetch up-to-date k6 API docs before generating test code

## Rules

1. Place scenario in `SeventySix.Client/load-testing/scenarios/{domain}/`
2. Follow the existing scenario pattern (import lib, options, setup, default, handleSummary)
3. Import constants from `lib/constants/index.js` — NEVER use inline magic values
4. Import builders from `lib/builders/index.js` for structured payloads
5. Use `isSetupInvalid(data)` guard from `lib/guards.js` in `default function`
6. Use `lib/auth.js` for authenticated endpoints (`loginAsAdmin()` or `loginAsUser()`)
7. Use `lib/data-generators.js` for unique test data (all prefixed with `loadtest_`)
8. Use `lib/http-helpers.js` for authenticated HTTP calls
9. Use `lib/checks.js` for reusable response assertions
10. Use `lib/summary.js` — export `handleSummary = createSummaryHandler('{scenario-name}')`
11. Use `getOptions(THRESHOLDS.*)` from `lib/config.js` with a threshold preset
12. Tag all requests with `buildTags(FLOW_TAGS.*, OPERATION_TAGS.*)`
13. Use `sleep(SLEEP_DURATION.*)` instead of literal numbers
14. All variables must be 3+ characters (`response` not `res`, `accessToken` not `token`)
15. Ensure idempotency — use unique generated data, never depend on prior test runs

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

## Adding Constants

1. Add endpoint constant to `lib/constants/api-endpoints.constants.js`
2. Add operation tag to `lib/constants/tags.constants.js`
3. Re-export from `lib/constants/index.js`
4. If needed, create a payload builder in `lib/builders/`

## Verification

After creating the scenario:

1. Run format: `npm run format` from `SeventySix.Client/load-testing/`
2. Run lint: `npm run lint` from `SeventySix.Client/load-testing/`
3. Run with smoke profile: `k6 run --env PROFILE=smoke scenarios/{domain}/{name}.test.js`
4. Verify HTML report generated in `SeventySix.Client/load-testing/reports/`
5. Run a second time to confirm idempotency
