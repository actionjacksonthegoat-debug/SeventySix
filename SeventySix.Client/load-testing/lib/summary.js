/**
 * Shared handleSummary helper
 *
 * Generates HTML + JSON reports and console summary for every scenario.
 *
 * @example
 * import { createSummaryHandler } from "../lib/summary.js";
 * export const handleSummary = createSummaryHandler("login-test");
 */

import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.2/index.js";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/2.4.0/dist/bundle.js";

/**
 * Creates a handleSummary function for the given scenario name.
 *
 * @param {string} scenarioName
 * The name used for output file naming (e.g., "login-test").
 *
 * @returns {function}
 * A handleSummary function compatible with k6.
 */
export function createSummaryHandler(scenarioName)
{
	return function handleSummary(data)
	{
		return {
			[`reports/${scenarioName}.html`]: htmlReport(data),
			[`results/${scenarioName}.json`]: JSON.stringify(data),
			stdout: textSummary(data,
				{ indent: " ", enableColors: true })
		};
	};
}
