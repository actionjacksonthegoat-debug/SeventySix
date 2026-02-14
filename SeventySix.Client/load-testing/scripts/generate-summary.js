/**
 * Summary Report Aggregator
 *
 * Reads all results/*.json files and generates a combined reports/summary.html
 * with a table of all scenarios and their pass/fail status.
 *
 * k6 handleSummary JSON structure:
 *   metrics.<name>.values  — contains avg, min, med, max, p(90), p(95), rate, count, etc.
 *   metrics.<name>.thresholds — contains { "<expr>": { ok: true|false } }
 *   root_group.checks[]   — contains { name, passes, fails }
 *
 * Usage: node scripts/generate-summary.js
 */

import fs from "fs";
import process from "node:process";
import path from "path";
import { fileURLToPath } from "url";

const __filename =
	fileURLToPath(import.meta.url);
const __dirname =
	path.dirname(__filename);

const RESULTS_DIR =
	path.join(__dirname, "..", "results");
const REPORTS_DIR =
	path.join(__dirname, "..", "reports");
const OUTPUT_FILE =
	path.join(REPORTS_DIR, "summary.html");

/**
 * Safely read a nested value with a fallback.
 *
 * @param {object} source
 * @param {string[]} keys
 * @param {*} fallback
 * @returns {*}
 */
function dig(source, keys, fallback)
{
	let current = source;
	for (const key of keys)
	{
		if (current == null || typeof current !== "object")
		{
			return fallback;
		}
		current =
			current[key];
	}
	return current ?? fallback;
}

/**
 * Check whether all thresholds across every metric passed.
 *
 * Thresholds live inside each metric object at metrics.<name>.thresholds,
 * NOT at the root of the JSON.
 *
 * @param {object} metrics
 * @returns {boolean}
 */
function allThresholdsPassed(metrics)
{
	for (const metricName of Object.keys(metrics))
	{
		const thresholds =
			metrics[metricName].thresholds;
		if (thresholds == null)
		{
			continue;
		}
		for (const expr of Object.keys(thresholds))
		{
			if (thresholds[expr].ok === false)
			{
				return false;
			}
		}
	}
	return true;
}

/**
 * Extract check summary from root_group.
 *
 * @param {object} data
 * @returns {{ totalPasses: number, totalFails: number }}
 */
function extractChecks(data)
{
	let totalPasses = 0;
	let totalFails = 0;

	function walkGroup(group)
	{
		if (group == null)
		{
			return;
		}
		if (Array.isArray(group.checks))
		{
			for (const check of group.checks)
			{
				totalPasses += check.passes ?? 0;
				totalFails += check.fails ?? 0;
			}
		}
		if (Array.isArray(group.groups))
		{
			for (const subGroup of group.groups)
			{
				walkGroup(subGroup);
			}
		}
	}

	walkGroup(data.root_group);
	return { totalPasses, totalFails };
}

function generateSummary()
{
	if (!fs.existsSync(RESULTS_DIR))
	{
		console.error("No results directory found.");
		process.exit(1);
	}

	const jsonFiles =
		fs
			.readdirSync(RESULTS_DIR)
			.filter((file) => file.endsWith(".json"));

	if (jsonFiles.length === 0)
	{
		console.log("No result files found. Run load tests first.");
		process.exit(0);
	}

	const scenarios = [];

	for (const file of jsonFiles)
	{
		const filePath =
			path.join(RESULTS_DIR, file);
		const scenarioName =
			file.replace(".json", "");

		try
		{
			const rawData =
				fs.readFileSync(filePath, "utf8");
			const data =
				JSON.parse(rawData);

			const metrics =
				data.metrics || {};
			const durationValues =
				dig(metrics,
					["http_req_duration", "values"], {});
			const failedValues =
				dig(metrics,
					["http_req_failed", "values"], {});
			const reqsValues =
				dig(metrics,
					["http_reqs", "values"], {});
			const iterValues =
				dig(metrics,
					["iterations", "values"], {});
			const checkValues =
				dig(metrics,
					["checks", "values"], {});
			const { totalPasses, totalFails } =
				extractChecks(data);

			const thresholdsPassed =
				allThresholdsPassed(metrics);

			scenarios.push(
				{
					name: scenarioName,
					status: thresholdsPassed ? "PASS" : "FAIL",
					avg: durationValues.avg != null ? durationValues.avg.toFixed(2) : "N/A",
					med: durationValues.med != null ? durationValues.med.toFixed(2) : "N/A",
					min: durationValues.min != null ? durationValues.min.toFixed(2) : "N/A",
					max: durationValues.max != null ? durationValues.max.toFixed(2) : "N/A",
					p90: durationValues["p(90)"] != null ? durationValues["p(90)"].toFixed(2) : "N/A",
					p95: durationValues["p(95)"] != null ? durationValues["p(95)"].toFixed(2) : "N/A",
					errorRate: failedValues.rate != null ? (failedValues.rate * 100).toFixed(2) : "0.00",
					requests: reqsValues.count ?? 0,
					rips: reqsValues.rate != null ? reqsValues.rate.toFixed(1) : "N/A",
					iterations: iterValues.count ?? 0,
					checksPassed: totalPasses,
					checksFailed: totalFails,
					checkRate: checkValues.rate != null ? (checkValues.rate * 100).toFixed(1) : "N/A"
				});
		}
		catch (error)
		{
			scenarios.push(
				{
					name: scenarioName,
					status: "ERROR",
					avg: "N/A",
					med: "N/A",
					min: "N/A",
					max: "N/A",
					p90: "N/A",
					p95: "N/A",
					errorRate: "N/A",
					requests: 0,
					rps: "N/A",
					iterations: 0,
					checksPassed: 0,
					checksFailed: 0,
					checkRate: "N/A"
				});
		}
	}

	const passCount =
		scenarios
			.filter(
				(scenario) => scenario.status === "PASS")
			.length;
	const failCount =
		scenarios
			.filter(
				(scenario) => scenario.status === "FAIL")
			.length;
	const errorCount =
		scenarios
			.filter(
				(scenario) =>
					scenario.status === "ERROR")
			.length;
	const overallStatus =
		failCount === 0 && errorCount === 0 ? "PASS" : "FAIL";

	const totalRequests =
		scenarios.reduce((sum, scenario) =>
			sum + scenario.requests, 0);
	const totalChecksOk =
		scenarios.reduce((sum, scenario) =>
			sum + scenario.checksPassed, 0);
	const totalChecksFail =
		scenarios.reduce((sum, scenario) =>
			sum + scenario.checksFailed, 0);

	const tableRows =
		scenarios
			.map(
				(scenario) =>
				{
					const statusColor =
						scenario.status === "PASS"
							? "#4caf50"
							: scenario.status === "FAIL"
								? "#f44336"
								: "#ff9800";
					const errColor =
						parseFloat(scenario.errorRate) > 0 ? "#f44336" : "#4caf50";
					const checkColor =
						scenario.checksFailed > 0 ? "#f44336" : "#4caf50";
					return `<tr>
				<td>${scenario.name}</td>
				<td style="color: ${statusColor}; font-weight: bold;">${scenario.status}</td>
				<td>${scenario.requests.toLocaleString()}</td>
				<td>${scenario.rps}</td>
				<td>${scenario.avg}</td>
				<td>${scenario.med}</td>
				<td>${scenario.p90}</td>
				<td>${scenario.p95}</td>
				<td style="color: ${errColor};">${scenario.errorRate}%</td>
				<td style="color: ${checkColor};">${scenario.checksPassed}/${
					scenario.checksPassed + scenario.checksFailed
				}</td>
				<td><a href="${scenario.name}.html">View</a></td>
			</tr>`;
				})
			.join("\n");

	const checksOkColor =
		totalChecksFail > 0 ? "#f44336" : "#4caf50";
	const html =
		`<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>SeventySix Load Test Summary</title>
	<style>
		body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; background: #1a1a2e; color: #e0e0e0; }
		h1 { color: #ffffff; }
		.stats-bar { display: flex; gap: 20px; flex-wrap: wrap; margin: 20px 0; }
		.stat-card { background: #16213e; border-radius: 8px; padding: 16px 24px; min-width: 140px; }
		.stat-card .label { color: #888; font-size: 0.8em; text-transform: uppercase; letter-spacing: 0.05em; }
		.stat-card .value { font-size: 1.6em; font-weight: 700; margin-top: 4px; }
		.overall { font-size: 1.4em; margin: 20px 0; padding: 15px; border-radius: 8px; }
		.overall.pass { background: #1b3a1b; border: 2px solid #4caf50; }
		.overall.fail { background: #3a1b1b; border: 2px solid #f44336; }
		table { border-collapse: collapse; width: 100%; margin-top: 20px; }
		th, td { padding: 10px 14px; text-align: right; border-bottom: 1px solid #333; white-space: nowrap; }
		th:first-child, td:first-child { text-align: left; }
		th:nth-child(2), td:nth-child(2) { text-align: center; }
		th:last-child, td:last-child { text-align: center; }
		th { background: #16213e; color: #ffffff; font-weight: 600; position: sticky; top: 0; }
		tr:hover { background: #16213e; }
		a { color: #64b5f6; }
		.timestamp { color: #888; font-size: 0.9em; }
	</style>
</head>
<body>
	<h1>SeventySix Load Test Summary</h1>
	<p class="timestamp">Generated: ${
		new Date()
			.toISOString()
	}</p>

	<div class="overall ${overallStatus.toLowerCase()}">
		Overall: <strong>${overallStatus}</strong> &mdash; ${passCount} passed, ${failCount} failed, ${errorCount} errors (${scenarios.length} total)
	</div>

	<div class="stats-bar">
		<div class="stat-card">
			<div class="label">Total Requests</div>
			<div class="value">${totalRequests.toLocaleString()}</div>
		</div>
		<div class="stat-card">
			<div class="label">Scenarios</div>
			<div class="value">${scenarios.length}</div>
		</div>
		<div class="stat-card">
			<div class="label">Checks OK</div>
			<div class="value" style="color: ${checksOkColor};">${totalChecksOk.toLocaleString()} / ${
				(totalChecksOk + totalChecksFail).toLocaleString()
			}</div>
		</div>
	</div>

	<table>
		<thead>
			<tr>
				<th>Scenario</th>
				<th>Status</th>
				<th>Reqs</th>
				<th>RPS</th>
				<th>Avg (ms)</th>
				<th>Med (ms)</th>
				<th>p90 (ms)</th>
				<th>p95 (ms)</th>
				<th>Error %</th>
				<th>Checks</th>
				<th>Report</th>
			</tr>
		</thead>
		<tbody>
			${tableRows}
		</tbody>
	</table>
</body>
</html>`;

	if (!fs.existsSync(REPORTS_DIR))
	{
		fs.mkdirSync(REPORTS_DIR,
			{ recursive: true });
	}

	fs.writeFileSync(OUTPUT_FILE, html, "utf8");
	console.log(`Summary report generated: ${OUTPUT_FILE}`);
	console.log(
		`Overall: ${overallStatus} — ${passCount} passed, ${failCount} failed, ${errorCount} errors`);
}

generateSummary();
