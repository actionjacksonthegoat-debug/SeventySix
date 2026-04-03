/**
 * Health Check Load Test Scenario
 *
 * Validates the /healthz endpoint responds within acceptable thresholds.
 * This is the simplest scenario — no setup, no session state.
 *
 * @module scenarios/health/health-check.test
 */

import { sleep } from "k6";
import { CONFIG, getOptions } from "../../lib/config.js";
import { isStatus200, isJsonResponse } from "../../lib/checks.js";
import { publicGet } from "../../lib/http-helpers.js";
import { createSummaryHandler } from "../../lib/summary.js";
import {
	HEALTH_ENDPOINTS,
	HEALTH_THRESHOLDS,
	HEALTH_STATUS,
	SLEEP_DURATION,
	FLOW_TAGS,
	OPERATION_TAGS,
	buildTags
} from "../../lib/constants/index.js";

/** @type {import("k6/options").Options} */
export const options = {
	...getOptions(),
	thresholds: HEALTH_THRESHOLDS
};

/**
 * Setup: Warmup request to ensure the application is ready.
 *
 * @returns {{ baseUrl: string }}
 * Shared data for VU iterations.
 */
export function setup()
{
	const warmupResponse =
		publicGet(`${CONFIG.baseUrl}${HEALTH_ENDPOINTS.CHECK}`);

	console.log(
		`Health warmup: status=${warmupResponse.status}`
	);

	return { baseUrl: CONFIG.baseUrl };
}

/**
 * Default VU function: GET /healthz and validate response.
 *
 * @param {{ baseUrl: string }} data
 * Setup data.
 */
export default function healthCheck(data)
{
	const tags =
		buildTags(FLOW_TAGS.HEALTH, OPERATION_TAGS.HEALTH_CHECK);

	const response =
		publicGet(
			`${data.baseUrl}${HEALTH_ENDPOINTS.CHECK}`,
			{ tags }
		);

	isStatus200(response);
	isJsonResponse(response);

	const body = response.json();
	if (body.status !== HEALTH_STATUS)
	{
		console.error(
			`Unexpected health status: ${body.status}`
		);
	}

	sleep(SLEEP_DURATION.SHORT);
}

/**
 * Generates HTML and JSON reports.
 *
 * @param {object} data
 * k6 summary data.
 *
 * @returns {object}
 * Report output targets.
 */
export function handleSummary(data)
{
	return createSummaryHandler(data);
}
