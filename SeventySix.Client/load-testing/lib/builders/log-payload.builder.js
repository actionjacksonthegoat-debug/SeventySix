/**
 * Log Payload Builders
 * Builds client log payloads with required fields pre-filled.
 */

import { HTTP_STATUS, LOG_LEVEL } from "../constants/index.js";

/**
 * Builds a single client log payload.
 *
 * @param {object} [overrides]
 * Optional field overrides.
 *
 * @returns {object}
 * A client log payload object.
 */
export function buildClientLogPayload(overrides)
{
	return {
		logLevel: LOG_LEVEL.ERROR,
		message: `Load test error ${Date.now()}`,
		exceptionMessage: "Simulated load test exception",
		stackTrace: "at LoadTest.run (loadtest.js:1:1)",
		sourceContext: "LoadTestScenario",
		requestUrl: "https://localhost:4202/dashboard",
		requestMethod: "GET",
		statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
		...overrides
	};
}

/**
 * Builds an array of client log payloads for batch submission.
 *
 * @param {number} batchSize
 * Number of log entries to generate.
 *
 * @param {object} [overrides]
 * Optional field overrides applied to each entry.
 *
 * @returns {object[]}
 * Array of client log payload objects.
 */
export function buildBatchClientLogPayload(batchSize, overrides)
{
	return Array.from(
		{ length: batchSize },
		(_unused, index) => ({
			logLevel: LOG_LEVEL.WARNING,
			message: `Batch load test log ${Date.now()}_${index}`,
			exceptionMessage: "Simulated batch exception",
			stackTrace: `at BatchTest.run (batch.js:${index}:1)`,
			sourceContext: "BatchLoadTestScenario",
			requestUrl: "https://localhost:4202/dashboard",
			requestMethod: "GET",
			statusCode: HTTP_STATUS.BAD_REQUEST,
			...overrides
		}));
}
