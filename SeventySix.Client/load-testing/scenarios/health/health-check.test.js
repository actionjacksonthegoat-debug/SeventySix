/**
 * Health Check Load Test
 *
 * Baseline performance reference — if health degrades, everything else will too.
 * Flow: GET /health
 * Expected: 200 with { status: "Healthy" }
 */

import { check, sleep } from "k6";
import http from "k6/http";
import { warmup } from "../../lib/auth.js";
import { isStatus200 } from "../../lib/checks.js";
import { CONFIG, getOptions } from "../../lib/config.js";
import {
	buildTags,
	FLOW_TAGS,
	HEALTH_ENDPOINTS,
	HEALTH_STATUS,
	OPERATION_TAGS,
	SLEEP_DURATION,
	THRESHOLDS
} from "../../lib/constants/index.js";
import { createSummaryHandler } from "../../lib/summary.js";

export const options =
	getOptions(THRESHOLDS.HEALTH);

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
		http.get(
			`${CONFIG.baseUrl}${HEALTH_ENDPOINTS.CHECK}`,
			buildTags(
				FLOW_TAGS.HEALTH,
				OPERATION_TAGS.HEALTH_CHECK));

	isStatus200(response);

	check(
		response,
		{
			"status is Healthy": (response) =>
			{
				const body =
					response.json();
				return body != null && body.status === HEALTH_STATUS.HEALTHY;
			}
		});

	sleep(SLEEP_DURATION.STANDARD);
}

export const handleSummary =
	createSummaryHandler("health-check");
