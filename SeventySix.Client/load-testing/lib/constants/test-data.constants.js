/**
 * Test Data Constants
 * Shared prefixes, log levels, and mock payload templates.
 */

export const TEST_DATA_PREFIX = "loadtest_";

export const LOG_LEVEL =
	Object.freeze(
		{
			ERROR: "Error",
			WARNING: "Warning",
			INFO: "Information"
		});

export const HEALTH_STATUS =
	Object.freeze(
		{
			HEALTHY: "Healthy"
		});

/** Default batch sizes per domain. */
export const BATCH_SIZE =
	Object.freeze(
		{
			LOG: 10,
			USER: 5
		});

/** Default pagination values. */
export const PAGINATION =
	Object.freeze(
		{
			DEFAULT_PAGE: 1,
			DEFAULT_PAGE_SIZE: 25
		});

/** Upper bound for random integer generation. */
export const RANDOM_INT_MAX = 1000000;

/** Reusable test message strings. */
export const TEST_MESSAGES =
	Object.freeze(
		{
			PERMISSION_REQUEST: "Load test permission request"
		});

/** Default sleep durations in seconds. */
export const SLEEP_DURATION =
	Object.freeze(
		{
			SHORT: 0.5,
			STANDARD: 1,
			LONG: 2
		});
