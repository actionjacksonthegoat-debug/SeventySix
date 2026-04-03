/**
 * Threshold Presets for k6 Load Tests
 *
 * Predefined threshold configurations for different response time expectations.
 * Use these in scenario options to set consistent performance targets.
 *
 * @example
 * import { HEALTH_THRESHOLDS } from "../lib/constants/index.js";
 * export const options = { thresholds: HEALTH_THRESHOLDS };
 */

/** @type {Readonly<{http_req_duration: string[]}>} Health endpoints — sub-200ms */
export const HEALTH_THRESHOLDS = Object.freeze({
	http_req_duration: ["p(95)<200", "p(99)<500"]
});

/** @type {Readonly<{http_req_duration: string[]}>} Fast responses — sub-500ms */
export const FAST_THRESHOLDS = Object.freeze({
	http_req_duration: ["p(95)<500", "p(99)<1000"]
});

/** @type {Readonly<{http_req_duration: string[]}>} Standard SSR pages — sub-1000ms */
export const STANDARD_THRESHOLDS = Object.freeze({
	http_req_duration: ["p(95)<1000", "p(99)<2000"]
});

/** @type {Readonly<{http_req_duration: string[]}>} Relaxed — sub-1500ms (complex pages) */
export const RELAXED_THRESHOLDS = Object.freeze({
	http_req_duration: ["p(95)<1500", "p(99)<3000"]
});
