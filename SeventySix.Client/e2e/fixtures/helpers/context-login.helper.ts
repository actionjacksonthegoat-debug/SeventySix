// <copyright file="context-login.helper.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import type { Browser, BrowserContext, Page } from "@playwright/test";
import { E2E_CONFIG } from "../config.constant";
import { ROUTES } from "../routes.constant";
import { SELECTORS } from "../selectors.constant";
import type { TestUser } from "../test-users.constant";
import { TIMEOUTS } from "../timeouts.constant";
import { solveAltchaChallenge } from "./altcha.helper";

/**
 * Result of creating a fresh browser context and logging in.
 */
export interface ContextLoginResult
{
	page: Page;
	context: BrowserContext;
}

/**
 * Creates a fresh browser context and performs a full login.
 * Used for cross-tab, concurrent session, and isolation tests.
 *
 * @param browser
 * The browser instance.
 *
 * @param user
 * The test user credentials.
 *
 * @param options
 * Optional overrides for context label and expected URL.
 *
 * @returns
 * A new page and context with an authenticated session.
 */
export async function loginInFreshContext(
	browser: Browser,
	user: TestUser,
	options?: {
		contextLabel?: string;
		expectedUrl?: string | RegExp | ((url: URL) => boolean);
	}): Promise<ContextLoginResult>
{
	const context: BrowserContext =
		await browser.newContext(
			{
				baseURL: E2E_CONFIG.clientBaseUrl,
				storageState: undefined,
				ignoreHTTPSErrors: true
			});
	const page: Page =
		await context.newPage();

	await page.goto(ROUTES.auth.login);
	await page
		.locator(SELECTORS.form.usernameInput)
		.waitFor(
			{ state: "visible", timeout: TIMEOUTS.auth });
	await page
		.locator(SELECTORS.form.usernameInput)
		.fill(user.username);
	await page
		.locator(SELECTORS.form.passwordInput)
		.fill(user.password);

	await solveAltchaChallenge(page);
	await page
		.locator(SELECTORS.form.submitButton)
		.click();

	const expectedUrl: string | RegExp | ((url: URL) => boolean) =
		options?.expectedUrl ?? ROUTES.home;
	await page.waitForURL(expectedUrl,
		{ timeout: TIMEOUTS.auth });

	return { page, context };
}