// <copyright file="data-table.helper.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { expect, type Locator, type Page } from "@playwright/test";
import { TIMEOUTS } from "../timeouts.constant";

/**
 * Waits for a Material data table to be loaded and populated.
 * Ensures the table is visible AND at least one row is present.
 *
 * @param page
 * The Playwright page instance.
 *
 * @param tableSelector
 * CSS selector for the table element (default: "mat-table").
 *
 * @param options
 * Optional timeout and minimum row count overrides.
 */
export async function waitForTableReady(
	page: Page,
	tableSelector: string = "mat-table",
	options?: { timeout?: number; minRows?: number; }): Promise<void>
{
	const timeout: number =
		options?.timeout ?? TIMEOUTS.api;
	const minRows: number =
		options?.minRows ?? 1;
	const table: Locator =
		page.locator(tableSelector);

	await table.waitFor(
		{ state: "visible", timeout });

	// Wait for at least minRows data rows to render.
	// NOTE: toHaveCount() only accepts an exact integer — do NOT use
	// expect.any(Number) (that is a Jest/Vitest matcher, not Playwright).
	await expect(
		table
			.locator("mat-row")
			.nth(minRows - 1))
		.toBeVisible(
			{ timeout });
}

/**
 * Waits for the table loading indicator to disappear.
 * Some tables show a progress bar during API fetch.
 *
 * @param page
 * The Playwright page instance.
 *
 * @param options
 * Optional timeout override.
 */
export async function waitForTableLoaded(
	page: Page,
	options?: { timeout?: number; }): Promise<void>
{
	const timeout: number =
		options?.timeout ?? TIMEOUTS.api;

	// Wait for any progress bar to disappear (if present)
	const progressBar: Locator =
		page.locator("mat-progress-bar");
	const progressVisible: boolean =
		await progressBar
			.isVisible()
			.catch(() => false);

	if (progressVisible)
	{
		await progressBar
			.waitFor(
				{ state: "hidden", timeout });
	}
}