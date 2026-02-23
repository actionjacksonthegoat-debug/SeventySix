// <copyright file="diagnostics.fixture.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { test as base } from "@playwright/test";
import type { Page, TestInfo } from "@playwright/test";
import * as fs from "fs";

/**
 * Collects diagnostic information during a test run for failure reporting.
 */
export interface DiagnosticsCollector
{
	/**
	 * Console error and warning messages captured during the test.
	 */
	consoleErrors: string[];

	/**
	 * Network requests that failed (requestfailed event).
	 */
	failedRequests: string[];

	/**
	 * API responses with HTTP status >= 400.
	 */
	apiErrors: string[];
}

/**
 * Creates a new empty diagnostics collector.
 *
 * @returns
 * An initialized diagnostics collector with empty arrays.
 */
export function createDiagnosticsCollector(): DiagnosticsCollector
{
	return {
		consoleErrors: [],
		failedRequests: [],
		apiErrors: []
	};
}

/**
 * Registers console, requestfailed, and response listeners on a page to capture
 * diagnostic information during a test. Call this immediately after creating a page.
 *
 * @param page
 * The Playwright page to instrument.
 *
 * @param collector
 * The diagnostics collector to populate with captured events.
 */
export function instrumentPageForDiagnostics(
	page: Page,
	collector: DiagnosticsCollector): void
{
	page.on(
		"console",
		(message) =>
		{
			if (message.type() === "error" || message.type() === "warning")
			{
				collector.consoleErrors.push(
					`[${message.type()
						.toUpperCase()}] ${message.text()}`);
			}
		});

	page.on(
		"requestfailed",
		(request) =>
		{
			collector.failedRequests.push(
				`${request.method()} ${request.url()} — ${request.failure()?.errorText ?? "unknown"}`);
		});

	page.on(
		"response",
		(response) =>
		{
			if (response.status() >= 400)
			{
				collector.apiErrors.push(
					`${response.status()} ${response.request()
						.method()} ${response.url()}`);
			}
		});
}

/**
 * Attaches failure diagnostics (screenshot, URL, console errors, network errors)
 * to the test report when a test fails. Safe to call unconditionally — only
 * runs when `testInfo.status !== testInfo.expectedStatus`.
 *
 * @param page
 * The page to screenshot and read the URL from.
 *
 * @param collector
 * The populated diagnostics collector from the test run.
 *
 * @param testInfo
 * Playwright TestInfo used for attaching files to the test report.
 */
export async function attachDiagnosticsOnFailure(
	page: Page,
	collector: DiagnosticsCollector,
	testInfo: TestInfo): Promise<void>
{
	if (testInfo.status === testInfo.expectedStatus)
	{
		return;
	}

	// Capture screenshot
	const screenshot: Buffer | null =
		await page
			.screenshot(
				{ fullPage: false })
			.catch(() => null);

	if (screenshot)
	{
		await testInfo.attach(
			"failure-screenshot",
			{
				body: screenshot,
				contentType: "image/png"
			});
	}

	// Build structured diagnostics text
	const diagnosticsLines: string[] =
		[
			`URL: ${page.url()}`,
			"",
			`Console Errors (${collector.consoleErrors.length}):`,
			...collector.consoleErrors.map((error) => `  ${error}`),
			"",
			`Failed Requests (${collector.failedRequests.length}):`,
			...collector.failedRequests.map((failedRequest) => `  ${failedRequest}`),
			"",
			`API Errors (${collector.apiErrors.length}):`,
			...collector.apiErrors.map((apiError) => `  ${apiError}`)
		];

	const diagnosticsText: string =
		diagnosticsLines.join("\n");

	// Write to file and attach to report
	const logFile: string =
		testInfo.outputPath("diagnostics.txt");

	await fs.promises.writeFile(logFile, diagnosticsText, "utf8");

	testInfo.attachments.push(
		{
			name: "diagnostics",
			contentType: "text/plain",
			path: logFile
		});
}

/**
 * Extended test with an auto-failure diagnostics fixture.
 * Instruments the default `page` fixture for console/network error capture.
 * Extend from this instead of `@playwright/test` in fixture files that use `page`.
 */
export const test: ReturnType<typeof base.extend<{ autoFailureDiagnostics: void; }>> =
	base.extend<
		{ autoFailureDiagnostics: void; }>(
		{
			autoFailureDiagnostics: [
				async ({ page }, use, testInfo) =>
				{
					const collector: DiagnosticsCollector =
						createDiagnosticsCollector();

					instrumentPageForDiagnostics(page, collector);

					await use();

					await attachDiagnosticsOnFailure(page, collector, testInfo);
				},
				{ auto: true }
			]
		});