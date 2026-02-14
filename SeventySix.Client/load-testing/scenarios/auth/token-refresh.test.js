/**
 * Token Refresh Load Test
 *
 * Tests the token rotation flow under concurrent load.
 * Flow: Login → POST /auth/refresh (per-iteration — each VU needs a fresh cookie jar)
 * Validates: New access token returned, cookie rotated.
 */

import { check, sleep } from "k6";
import { loginAsAdmin, refreshToken, warmup } from "../../lib/auth.js";
import { getOptions } from "../../lib/config.js";
import { SLEEP_DURATION, THRESHOLDS } from "../../lib/constants/index.js";
import { createSummaryHandler } from "../../lib/summary.js";

export const options =
	getOptions(THRESHOLDS.STANDARD);

/**
 * Warm up the API connection so cold-start latency is excluded from metrics.
 */
export function setup()
{
	warmup();
}

export default function()
{
	const authData =
		loginAsAdmin();
	if (authData == null)
	{
		sleep(SLEEP_DURATION.STANDARD);
		return;
	}

	sleep(SLEEP_DURATION.SHORT);

	const refreshResult =
		refreshToken(authData.jar);

	check(
		refreshResult,
		{
			"refresh returned new token": (result) =>
				result != null && result.accessToken != null
		});

	sleep(SLEEP_DURATION.STANDARD);
}

export const handleSummary =
	createSummaryHandler("token-refresh-test");
