/**
 * Test Summary Handler for TanStack Load Tests
 *
 * Generates HTML and JSON reports from k6 test results using
 * remote vendor libraries (k6-reporter and k6-summary).
 *
 * @example
 * import { createSummaryHandler } from "../lib/summary.js";
 * export function handleSummary(data) { return createSummaryHandler(data); }
 */

import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/2.4.0/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.1.0/index.js";

/**
 * Creates a summary handler that outputs HTML, JSON, and stdout reports.
 *
 * @param {object} data
 * k6 summary data object passed to handleSummary.
 *
 * @returns {object}
 * k6 summary output targets.
 */
export function createSummaryHandler(data)
{
	return {
		"results/summary.html": htmlReport(data),
		"results/summary.json": JSON.stringify(data, null, 2),
		stdout: textSummary(data, { indent: "  ", enableColors: true })
	};
}
