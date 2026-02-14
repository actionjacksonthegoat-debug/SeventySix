/**
 * Login Load Test
 *
 * The heaviest auth flow — tests POST /auth/login under concurrent VUs.
 * Uses pre-seeded E2E admin credentials (shared across VUs — read-only auth).
 */

import { sleep } from "k6";
import http from "k6/http";
import { warmup } from "../../lib/auth.js";
import { buildLoginPayload } from "../../lib/builders/index.js";
import { hasAccessToken, isStatus200 } from "../../lib/checks.js";
import { CONFIG, getOptions } from "../../lib/config.js";
import {
	AUTH_ENDPOINTS,
	buildTags,
	CONTENT_TYPE,
	FLOW_TAGS,
	HTTP_HEADER,
	OPERATION_TAGS,
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
	const response =
		http.post(
			`${CONFIG.apiUrl}${AUTH_ENDPOINTS.LOGIN}`,
			JSON.stringify(
				buildLoginPayload(
					CONFIG.adminCredentials.username,
					CONFIG.adminCredentials.password)),
			{
				headers: { [HTTP_HEADER.CONTENT_TYPE]: CONTENT_TYPE.JSON },
				...buildTags(
					FLOW_TAGS.AUTH,
					OPERATION_TAGS.LOGIN)
			});

	isStatus200(response);
	hasAccessToken(response);

	sleep(SLEEP_DURATION.STANDARD);
}

export const handleSummary =
	createSummaryHandler("login-test");
