// <copyright file="concise-reporter.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import type {
	FullConfig,
	FullResult,
	Reporter,
	Suite,
	TestCase,
	TestResult
} from "@playwright/test/reporter";

/**
 * ANSI color codes for terminal output.
 */
const COLORS =
	{
		green: "\x1b[32m",
		red: "\x1b[31m",
		yellow: "\x1b[33m",
		cyan: "\x1b[36m",
		dim: "\x1b[2m",
		reset: "\x1b[0m",
		bold: "\x1b[1m"
	} as const;

/**
 * Lightweight Playwright reporter that prints concise, single-line output per test.
 *
 * - Passing: `✓ test title (1.2s)` — no file path
 * - Failing: title + first error line + file:line — for debugging
 * - Summary table at end with passed/failed/skipped/flaky counts
 */
class ConciseReporter implements Reporter
{
	private passedCount: number = 0;
	private failedCount: number = 0;
	private skippedCount: number = 0;
	private flakyCount: number = 0;
	private totalDurationMs: number = 0;

	onBegin(_config: FullConfig, suite: Suite): void
	{
		const testCount: number =
			suite.allTests().length;

		console.log(
			`\n${COLORS.cyan}Running ${testCount} tests${COLORS.reset}\n`);
	}

	onTestEnd(test: TestCase, result: TestResult): void
	{
		const durationSeconds: string =
			(result.duration / 1000).toFixed(1);

		this.totalDurationMs += result.duration;

		const testTitle: string =
			test.title;

		switch (result.status)
		{
			case "passed":
				this.logPassed(testTitle, durationSeconds, test.outcome() === "flaky");
				break;
			case "failed":
			case "timedOut":
				this.logFailed(testTitle, durationSeconds, result, test);
				break;
			case "skipped":
				this.skippedCount++;
				console.log(
					`  ${COLORS.yellow}- ${testTitle} ${COLORS.dim}(skipped)${COLORS.reset}`);
				break;
			case "interrupted":
				this.skippedCount++;
				console.log(
					`  ${COLORS.yellow}${testTitle} ${COLORS.dim}(interrupted)${COLORS.reset}`);
				break;
		}
	}

	/**
	 * Logs a passed (or flaky) test result to the console.
	 * @param testTitle
	 * Display name of the test case.
	 * @param durationSeconds
	 * Formatted duration string (e.g. "1.2").
	 * @param isFlaky
	 * Whether the test passed on retry (flaky).
	 */
	private logPassed(testTitle: string, durationSeconds: string, isFlaky: boolean): void
	{
		if (isFlaky)
		{
			this.flakyCount++;
			console.log(
				`  ${COLORS.yellow}${testTitle} ${COLORS.dim}(${durationSeconds}s, flaky)${COLORS.reset}`);
		}
		else
		{
			this.passedCount++;
			console.log(
				`  ${COLORS.green}${testTitle} ${COLORS.dim}(${durationSeconds}s)${COLORS.reset}`);
		}
	}

	/**
	 * Logs a failed or timed-out test result with error details and file location.
	 * @param testTitle
	 * Display name of the test case.
	 * @param durationSeconds
	 * Formatted duration string (e.g. "1.2").
	 * @param result
	 * The Playwright TestResult containing error information.
	 * @param test
	 * The Playwright TestCase containing file location.
	 */
	private logFailed(
		testTitle: string,
		durationSeconds: string,
		result: TestResult,
		test: TestCase): void
	{
		this.failedCount++;
		const errorMessage: string =
			this.extractFirstErrorLine(result);
		const fileLocation: string =
			this.getFileLocation(test);

		console.log(
			`  ${COLORS.red}${testTitle} ${COLORS.dim}(${durationSeconds}s)${COLORS.reset}`);
		console.log(
			`    ${COLORS.red}${errorMessage}${COLORS.reset}`);
		console.log(
			`    ${COLORS.dim}at ${fileLocation}${COLORS.reset}`);
	}

	onEnd(result: FullResult): void
	{
		const totalSeconds: string =
			(this.totalDurationMs / 1000).toFixed(1);

		console.log(`\n${"─".repeat(50)}`);
		console.log(`${COLORS.bold}  Test Results${COLORS.reset}`);
		console.log(`${"─".repeat(50)}`);
		console.log(`  ${COLORS.green}Passed:  ${this.passedCount}${COLORS.reset}`);

		if (this.failedCount > 0)
		{
			console.log(`  ${COLORS.red}Failed:  ${this.failedCount}${COLORS.reset}`);
		}

		if (this.skippedCount > 0)
		{
			console.log(`  ${COLORS.yellow}Skipped: ${this.skippedCount}${COLORS.reset}`);
		}

		if (this.flakyCount > 0)
		{
			console.log(`  ${COLORS.yellow}Flaky:   ${this.flakyCount}${COLORS.reset}`);
		}

		console.log(`  ${COLORS.dim}Duration: ${totalSeconds}s${COLORS.reset}`);
		console.log(`  ${COLORS.dim}Status:   ${result.status}${COLORS.reset}`);
		console.log(`${"─".repeat(50)}\n`);
	}

	/**
	 * Extracts the first meaningful line from a test error.
	 * @param result
	 * The test result containing errors.
	 * @returns
	 * The first line of the error message.
	 */
	private extractFirstErrorLine(result: TestResult): string
	{
		const firstError =
			result.errors[0];

		if (!firstError?.message)
		{
			return "Unknown error";
		}

		// Strip ANSI codes and get first non-empty line
		const cleanMessage: string =
			firstError.message.replace(/\x1b\[[0-9;]*m/g, "");
		const firstLine: string =
			cleanMessage
				.split("\n")
				.map((line) => line.trim())
				.find((line) => line.length > 0)
			?? "Unknown error";

		// Truncate long messages
		const maxLength: number = 120;

		return firstLine.length > maxLength
			? `${firstLine.substring(0, maxLength)}...`
			: firstLine;
	}

	/**
	 * Gets the file location string for a test case.
	 * @param test
	 * The test case to get location for.
	 * @returns
	 * Formatted file:line string.
	 */
	private getFileLocation(test: TestCase): string
	{
		const location =
			test.location;

		return `${location.file}:${location.line}`;
	}
}

export default ConciseReporter;
