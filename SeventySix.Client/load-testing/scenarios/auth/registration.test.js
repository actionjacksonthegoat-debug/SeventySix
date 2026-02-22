/**
 * Registration Load Test
 *
 * Full registration flow: initiate → complete.
 * Requires ALTCHA disabled in loadtest env (CPU-bound PoW).
 * Each VU iteration creates a unique user (loadtest_ prefix).
 *
 * NOTE: Registration requires completing an email verification flow.
 * In the load test environment this is simplified — we test the initiate endpoint
 * for throughput since the complete step requires an email token.
 */

import { sleep } from "k6";
import http from "k6/http";
import { warmup } from "../../lib/auth.js";
import { buildRegistrationPayload } from "../../lib/builders/index.js";
import { isStatus200 } from "../../lib/checks.js";
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
import { generateEmail } from "../../lib/data-generators.js";
import { createSummaryHandler } from "../../lib/summary.js";

export const options =
	getOptions(THRESHOLDS.SLOW);

/**
 * Warm up the API connection so cold-start latency is excluded from metrics.
 */
export function setup()
{
	warmup();
}

export default function()
{
	const email =
		generateEmail();

	const response =
		http.post(
			`${CONFIG.apiUrl}${AUTH_ENDPOINTS.REGISTER_INITIATE}`,
			JSON.stringify(
				buildRegistrationPayload(email)),
			{
				headers: { [HTTP_HEADER.CONTENT_TYPE]: CONTENT_TYPE.JSON },
				...buildTags(
					FLOW_TAGS.AUTH,
					OPERATION_TAGS.REGISTRATION)
			});

	isStatus200(response);

	sleep(SLEEP_DURATION.STANDARD);
}

export const handleSummary =
	createSummaryHandler("registration-test");
