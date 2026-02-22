/**
 * Login Load Test
 *
 * The heaviest auth flow — tests POST /auth/login under concurrent VUs.
 * Uses pre-seeded E2E admin credentials (shared across VUs — read-only auth).
 */

import { sleep } from "k6";
import http from "k6/http";
import { login, warmup } from "../../lib/auth.js";
import { buildLoginPayload } from "../../lib/builders/index.js";
import { CONFIG, getOptions } from "../../lib/config.js";
import {
	AUTH_ENDPOINTS,
	CONTENT_TYPE,
	HTTP_HEADER,
	SLEEP_DURATION,
	THRESHOLDS
} from "../../lib/constants/index.js";

import { createSummaryHandler } from "../../lib/summary.js";

export const options =
	getOptions(THRESHOLDS.AUTH);

/**
 * Warm up the API connection and JIT-compile the login path
 * so cold-start latency is excluded from metrics.
 */
export function setup()
{
	warmup();

	http.post(
		`${CONFIG.apiUrl}${AUTH_ENDPOINTS.LOGIN}`,
		JSON.stringify(
			buildLoginPayload(
				CONFIG.adminCredentials.username,
				CONFIG.adminCredentials.password)),
		{ headers: { [HTTP_HEADER.CONTENT_TYPE]: CONTENT_TYPE.JSON } });
}

export default function()
{
	login(
		CONFIG.adminCredentials.username,
		CONFIG.adminCredentials.password);

	// Pacing sleep — simulates realistic inter-request delay.
	// iteration_duration ≈ http_req_duration + SLEEP_DURATION.STANDARD (1 s).
	// Watch http_req_duration / http_req_waiting for actual API latency.
	// Expected baseline (production Argon2): avg ~450-650ms, p95 ~650-800ms.
	sleep(SLEEP_DURATION.STANDARD);
}

export const handleSummary =
	createSummaryHandler("login-test");
