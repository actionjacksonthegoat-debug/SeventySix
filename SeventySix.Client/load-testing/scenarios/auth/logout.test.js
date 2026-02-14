/**
 * Logout Load Test
 *
 * Tests POST /auth/logout cleanup flow.
 * Flow: Login → Logout (per-iteration — each VU needs a fresh cookie jar)
 * Validates: 204 response, cookies cleared.
 */

import { sleep } from "k6";
import { loginAsAdmin, logout, warmup } from "../../lib/auth.js";
import { isStatus204 } from "../../lib/checks.js";
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

	const logoutResponse =
		logout(authData.jar);
	isStatus204(logoutResponse);

	sleep(SLEEP_DURATION.STANDARD);
}

export const handleSummary =
	createSummaryHandler("logout-test");
