// <copyright file="fresh-login.fixture.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { Browser, BrowserContext, Page, test as base } from "@playwright/test";
import {
	attachDiagnosticsOnFailure,
	createDiagnosticsCollector,
	type DiagnosticsCollector,
	instrumentPageForDiagnostics
} from "./diagnostics.fixture";
import { loginInFreshContext } from "./helpers/context-login.helper";
import { E2E_CONFIG, ROUTES, SELECTORS, TEST_USERS, TIMEOUTS } from "./index";
import type { TestUser } from "./test-users.constant";

/**
 * Fixture that provides pages with fresh login sessions.
 * Use this for tests that perform logout or other destructive auth operations.
 * These sessions are NOT shared with other tests.
 */
interface FreshLoginFixtures
{
	/**
	 * User page with fresh login (not from shared auth state).
	 */
	freshUserPage: Page;

	/**
	 * Admin page with fresh login (not from shared auth state).
	 */
	freshAdminPage: Page;

	/**
	 * Developer page with fresh login (not from shared auth state).
	 */
	freshDeveloperPage: Page;
}

/**
 * Performs a fresh login for a test user.
 * @param browser
 * The browser instance.
 * @param baseURL
 * The base URL for navigation.
 * @param testUser
 * The test user to log in as.
 * @returns
 * A page with fresh authentication.
 */
async function performFreshLogin(
	browser: Browser,
	baseURL: string,
	testUser: TestUser): Promise<{ page: Page; browserContext: BrowserContext; collector: DiagnosticsCollector; }>
{
	const { page, context } =
		await loginInFreshContext(browser, testUser,
			{
				expectedUrl: (url: URL) =>
					url.pathname === ROUTES.home
						|| url.pathname.includes("/mfa/")
			});

	// Instrument immediately after the page is created
	const collector: DiagnosticsCollector =
		createDiagnosticsCollector();
	instrumentPageForDiagnostics(page, collector);

	// If redirected to MFA, the user has TOTP enabled (likely from a parallel test).
	// Fail fast with a clear message instead of timing out.
	const currentPath: string =
		new URL(page.url()).pathname;

	if (currentPath.includes("/mfa/"))
	{
		throw new Error(
			`Fresh login for ${testUser.username} was redirected to MFA verify. `
				+ "Another test likely enabled TOTP on this shared user. "
				+ "Retry should succeed after TOTP cleanup completes.");
	}

	// Wait for the app to be fully interactive (user menu visible means auth complete)
	await page
		.locator(SELECTORS.layout.userMenuButton)
		.waitFor(
			{ state: "visible", timeout: TIMEOUTS.auth });

	return { page, browserContext: context, collector };
}

/**
 * Test fixture with fresh login sessions.
 * Use `freshLoginTest` from this file for logout/destructive auth tests.
 */
export const freshLoginTest: ReturnType<typeof base.extend<FreshLoginFixtures>> =
	base.extend<FreshLoginFixtures>(
		{
			freshUserPage: async ({ browser }, use, testInfo) =>
			{
				const userTestUser: TestUser | undefined =
					TEST_USERS.find(
						(testUser) => testUser.role === "User");

				if (!userTestUser)
				{
					throw new Error("User test account not found");
				}

				const { page, browserContext, collector } =
					await performFreshLogin(
						browser,
						E2E_CONFIG.clientBaseUrl,
						userTestUser);

				await use(page);
				await attachDiagnosticsOnFailure(page, collector, testInfo);
				await browserContext.close();
			},

			freshAdminPage: async ({ browser }, use, testInfo) =>
			{
				const adminTestUser: TestUser | undefined =
					TEST_USERS.find(
						(testUser) => testUser.role === "Admin");

				if (!adminTestUser)
				{
					throw new Error("Admin test account not found");
				}

				const { page, browserContext, collector } =
					await performFreshLogin(
						browser,
						E2E_CONFIG.clientBaseUrl,
						adminTestUser);

				await use(page);
				await attachDiagnosticsOnFailure(page, collector, testInfo);
				await browserContext.close();
			},

			freshDeveloperPage: async ({ browser }, use, testInfo) =>
			{
				const developerTestUser: TestUser | undefined =
					TEST_USERS.find(
						(testUser) =>
							testUser.role === "Developer");

				if (!developerTestUser)
				{
					throw new Error("Developer test account not found");
				}

				const { page, browserContext, collector } =
					await performFreshLogin(
						browser,
						E2E_CONFIG.clientBaseUrl,
						developerTestUser);

				await use(page);
				await attachDiagnosticsOnFailure(page, collector, testInfo);
				await browserContext.close();
			}
		});

export { expect } from "@playwright/test";