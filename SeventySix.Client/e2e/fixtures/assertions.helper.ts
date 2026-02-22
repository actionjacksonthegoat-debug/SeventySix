// <copyright file="assertions.helper.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { expect, Page, Locator } from "@playwright/test";
import { PAGE_TEXT } from "./page-text.constant";

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
