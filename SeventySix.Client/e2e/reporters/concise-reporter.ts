// <copyright file="concise-reporter.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import type {
	FullConfig,
	FullResult,
	Location,
	Reporter,
	Suite,
	TestCase,
	TestError,
	TestResult
} from "@playwright/test/reporter";
import * as fs from "fs";

/**
 * ANSI color codes for terminal output.
 */
type AnsiColors = {
	green: string;
	red: string;
	yellow: string;
	cyan: string;
	dim: string;
	reset: string;
	bold: string;
};

const COLORS: AnsiColors =
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

	private static print(message: string): void
	{
		process.stdout.write(`${message}\n`);
	}

	onBegin(_config: FullConfig, suite: Suite): void
	{
		const testCount: number =
			suite.allTests().length;

		ConciseReporter.print(
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
				ConciseReporter.print(
					`  ${COLORS.yellow}- ${testTitle} ${COLORS.dim}(skipped)${COLORS.reset}`);
				break;
			case "interrupted":
				this.skippedCount++;
				ConciseReporter.print(
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
			ConciseReporter.print(
				`  ${COLORS.yellow}${testTitle} ${COLORS.dim}(${durationSeconds}s, flaky)${COLORS.reset}`);
		}
		else
		{
			this.passedCount++;
			ConciseReporter.print(
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

		ConciseReporter.print(
			`  ${COLORS.red}${testTitle} ${COLORS.dim}(${durationSeconds}s)${COLORS.reset}`);
		ConciseReporter.print(
			`    ${COLORS.red}${errorMessage}${COLORS.reset}`);
		ConciseReporter.print(
			`    ${COLORS.dim}at ${fileLocation}${COLORS.reset}`);
		this.printDiagnostics(result);
	}

	onEnd(result: FullResult): void
	{
		const totalSeconds: string =
			(this.totalDurationMs / 1000).toFixed(1);

		ConciseReporter.print(`\n${"─".repeat(50)}`);
		ConciseReporter.print(`${COLORS.bold}  Test Results${COLORS.reset}`);
		ConciseReporter.print(`${"─".repeat(50)}`);
		ConciseReporter.print(`  ${COLORS.green}Passed:  ${this.passedCount}${COLORS.reset}`);

		if (this.failedCount > 0)
		{
			ConciseReporter.print(`  ${COLORS.red}Failed:  ${this.failedCount}${COLORS.reset}`);
		}

		if (this.skippedCount > 0)
		{
			ConciseReporter.print(`  ${COLORS.yellow}Skipped: ${this.skippedCount}${COLORS.reset}`);
		}

		if (this.flakyCount > 0)
		{
			ConciseReporter.print(`  ${COLORS.yellow}Flaky:   ${this.flakyCount}${COLORS.reset}`);
		}

		ConciseReporter.print(`  ${COLORS.dim}Duration: ${totalSeconds}s${COLORS.reset}`);
		ConciseReporter.print(`  ${COLORS.dim}Status:   ${result.status}${COLORS.reset}`);
		ConciseReporter.print(`${"─".repeat(50)}\n`);
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
		const firstError: TestError | undefined =
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
		const maxLength: number = 200;

		return firstLine.length > maxLength
			? `${firstLine.substring(0, maxLength)}...`
			: firstLine;
	}

	/**
	 * Prints diagnostics attachment content (console errors, network failures)
	 * to the terminal when a test fails.
	 * @param result
	 * The test result to read diagnostics from.
	 */
	private printDiagnostics(result: TestResult): void
	{
		const attachment: TestResult["attachments"][number] | undefined =
			result.attachments.find(
				(attachment) =>
					attachment.name === "diagnostics" && attachment.path != null);

		if (!attachment?.path || !fs.existsSync(attachment.path))
		{
			return;
		}

		const content: string =
			fs.readFileSync(attachment.path, "utf8");

		const lines: string[] =
			content
				.split("\n")
				.filter((line) => line.trim().length > 0);

		if (lines.length === 0)
		{
			return;
		}

		ConciseReporter.print(`    ${COLORS.dim}── Diagnostics ──${COLORS.reset}`);

		for (const line of lines)
		{
			ConciseReporter.print(`    ${COLORS.dim}${line}${COLORS.reset}`);
		}
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
		const location: Location =
			test.location;

		return `${location.file}:${location.line}`;
	}
}

export default ConciseReporter;