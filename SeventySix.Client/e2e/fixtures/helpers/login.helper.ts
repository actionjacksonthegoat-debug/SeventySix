// <copyright file="login.helper.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import type { Locator, Page } from "@playwright/test";
import { ROUTES } from "../routes.constant";
import { SELECTORS } from "../selectors.constant";
import type { TestUser } from "../test-users.constant";
import { TIMEOUTS } from "../timeouts.constant";
import { solveAltchaChallenge } from "./altcha.helper";

/**
 * Performs a full login flow: navigates to login page,
 * fills credentials, submits, and waits for expected URL.
 *
 * @param page
 * The Playwright page instance.
 *
 * @param user
 * The test user credentials.
 *
 * @param options
 * Optional overrides for wait behavior.
 */
export async function loginAsUser(
	page: Page,
	user: TestUser,
	options?: {
		expectedUrl?: string | RegExp;
		timeout?: number;
	}): Promise<void>
{
	await page.goto(ROUTES.auth.login);

	// Wait for the form to be interactive (Angular rendered)
	const usernameInput: Locator =
		page.locator(SELECTORS.form.usernameInput);
	await usernameInput.waitFor(
		{ state: "visible", timeout: TIMEOUTS.auth });

	await usernameInput
		.fill(user.username);
	await page
		.locator(SELECTORS.form.passwordInput)
		.fill(user.password);

	await solveAltchaChallenge(page);

	await page
		.locator(SELECTORS.form.submitButton)
		.click();

	const expectedUrl: string | RegExp =
		options?.expectedUrl ?? ROUTES.home;
	const timeout: number =
		options?.timeout ?? TIMEOUTS.auth;

	await page.waitForURL(
		expectedUrl,
		{ timeout });
}