/**
 * SeventySix Load Test Summary Report
 *
 * Delegates to the shared summary generator with project-specific configuration.
 *
 * Usage: node scripts/generate-summary.js
 */

import path from "path";
import { fileURLToPath } from "url";
import { generateSummary } from "../../../scripts/shared-load-test-summary.mjs";

const __filename =
	fileURLToPath(import.meta.url);
const __dirname =
	path.dirname(__filename);

generateSummary(
	{
		resultsDir: path.join(__dirname, "..", "results"),
		reportsDir: path.join(__dirname, "..", "reports"),
		title: "SeventySix Load Test Summary"
	});
