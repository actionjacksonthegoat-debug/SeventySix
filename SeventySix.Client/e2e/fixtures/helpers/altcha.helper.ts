// <copyright file="altcha.helper.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { expect, type Locator, type Page } from "@playwright/test";
import { SELECTORS } from "../selectors.constant";
import { TIMEOUTS } from "../timeouts.constant";

/**
 * Solves the ALTCHA proof-of-work challenge on the current page.
 * Waits for the widget to initialize, clicks the checkbox, and waits
 * for the challenge to be verified.
 *
 * ALTCHA uses light DOM: `data-state` lives on the inner `.altcha` div,
 * not on the `<altcha-widget>` element itself.
 *
 * @param page
 * The Playwright page instance.
 *
 * @param options
 * Optional timeout overrides.
 */
export async function solveAltchaChallenge(
	page: Page,
	options?: { initTimeout?: number; solveTimeout?: number; }): Promise<void>
{
	const initTimeout: number =
		options?.initTimeout ?? TIMEOUTS.api;
	const solveTimeout: number =
		options?.solveTimeout ?? TIMEOUTS.altchaSolve;

	const altchaWidget: Locator =
		page.locator(SELECTORS.altcha.widget);
	const altchaInner: Locator =
		altchaWidget.locator(".altcha");

	// Wait for widget to be in DOM
	await altchaWidget.waitFor(
		{ state: "attached", timeout: initTimeout });

	// Check current state — may already be verified (idempotent)
	const currentState: string | null =
		await altchaInner.getAttribute("data-state",
			{ timeout: initTimeout });

	if (currentState === "verified")
	{
		return;
	}

	// Ensure we are in unverified state before clicking
	await expect(altchaInner)
		.toHaveAttribute(
			"data-state",
			"unverified",
			{ timeout: initTimeout });

	// Click the checkbox to start proof-of-work challenge
	await altchaWidget
		.locator("input[type='checkbox']")
		.click(
			{ timeout: solveTimeout });

	// Wait for challenge to solve (unverified → verifying → verified)
	await expect(altchaInner)
		.toHaveAttribute(
			"data-state",
			"verified",
			{ timeout: solveTimeout });
}