/**
 * Client Log Load Test
 *
 * Anonymous client error logging — highest volume endpoint.
 * Flow: POST /logs/client (no auth required)
 * Validates: 204 response
 * Thresholds: p95 < 500ms (should be fast — anonymous, no auth overhead)
 */

import { sleep } from "k6";
import http from "k6/http";
import { warmup } from "../../lib/auth.js";
import { buildClientLogPayload } from "../../lib/builders/index.js";
import { isStatus204 } from "../../lib/checks.js";
import { CONFIG, getOptions } from "../../lib/config.js";
import {
	buildTags,
	CONTENT_TYPE,
	FLOW_TAGS,
	HTTP_HEADER,
	LOG_ENDPOINTS,
	OPERATION_TAGS,
	SLEEP_DURATION,
	THRESHOLDS
} from "../../lib/constants/index.js";
import { createSummaryHandler } from "../../lib/summary.js";

export const options =
	getOptions(THRESHOLDS.FAST);

/**
 * Warm up the API connection so cold-start latency is excluded from metrics.
 */
export function setup()
{
	warmup();
}

export default function()
{
	const response =
		http.post(
			`${CONFIG.apiUrl}${LOG_ENDPOINTS.CLIENT}`,
			JSON.stringify(buildClientLogPayload()),
			{
				headers: { [HTTP_HEADER.CONTENT_TYPE]: CONTENT_TYPE.JSON },
				...buildTags(
					FLOW_TAGS.LOGS,
					OPERATION_TAGS.CLIENT_LOG)
			});

	isStatus204(response);

	sleep(SLEEP_DURATION.SHORT);
}

export const handleSummary =
	createSummaryHandler("client-log-test");
