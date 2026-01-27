// <copyright file="assertions.helper.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { expect, Page, Locator } from "@playwright/test";
import { PAGE_TEXT } from "./page-text.constant";
import { createRouteRegex } from "./routes.constant";

/**
 * Asserts body does not contain access denied text.
 * @param page
 * Playwright page.
 */
export async function expectNoAccessDenied(page: Page): Promise<void>
{
	await expect(page.locator("body"))
		.not.toContainText(PAGE_TEXT.errors.accessDenied);
}

/**
 * Comprehensive error detection that checks for all known error patterns.
 * Detects server errors, client errors, HTTP status codes, and Angular errors.
 * @param page
 * Playwright page.
 * @throws
 * Assertion error if any error pattern is found on the page.
 */
export async function expectNoApplicationErrors(page: Page): Promise<void>
{
	const bodyLocator: Locator =
		page.locator("body");

	// Check server error patterns
	for (const pattern of PAGE_TEXT.errors.serverPatterns)
	{
		await expect(
			bodyLocator,
			`Server error detected: ${pattern}`)
			.not.toContainText(pattern);
	}

	// Check client error patterns
	for (const pattern of PAGE_TEXT.errors.clientPatterns)
	{
		await expect(
			bodyLocator,
			`Client error detected: ${pattern}`)
			.not.toContainText(pattern);
	}

	// Check Angular error patterns
	for (const pattern of PAGE_TEXT.errors.angularPatterns)
	{
		await expect(
			bodyLocator,
			`Angular error detected: ${pattern}`)
			.not.toContainText(pattern);
	}
}

/**
 * Captures and returns any browser console errors during a page action.
 * Use this to detect JavaScript runtime errors that don't show in UI.
 * @param page
 * Playwright page.
 * @param action
 * The action to perform while monitoring console.
 * @returns
 * Array of console error messages captured during the action.
 */
export async function captureConsoleErrors(
	page: Page,
	action: () => Promise<void>): Promise<string[]>
{
	const consoleErrors: string[] = [];

	const consoleHandler =
		(message: { type: () => string; text: () => string }) =>
		{
			if (message.type() === "error")
			{
				consoleErrors.push(message.text());
			}
		};

	page.on("console", consoleHandler);

	try
	{
		await action();
	}
	finally
	{
		page.off("console", consoleHandler);
	}

	return consoleErrors;
}

/**
 * Asserts no console errors occurred during a page action.
 * @param page
 * Playwright page.
 * @param action
 * The action to perform while monitoring console.
 */
export async function expectNoConsoleErrors(
	page: Page,
	action: () => Promise<void>): Promise<void>
{
	const consoleErrors: string[] =
		await captureConsoleErrors(page, action);

	expect(
		consoleErrors,
		`Console errors detected: ${consoleErrors.join(", ")}`)
		.toHaveLength(0);
}

/**
 * Asserts navigation occurred to expected route.
 * @param page
 * Playwright page instance.
 * @param route
 * Expected route path.
 */
export async function expectNavigatedTo(
	page: Page,
	route: string): Promise<void>
{
	await expect(page)
		.toHaveURL(createRouteRegex(route));
}
