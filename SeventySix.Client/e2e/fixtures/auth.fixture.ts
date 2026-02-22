// <copyright file="auth.fixture.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { test as base } from "./page-helpers.fixture";
import type { Page, BrowserContext, Browser } from "@playwright/test";
import { TestUser } from "./test-users.constant";
import {
	createDiagnosticsCollector,
	instrumentPageForDiagnostics,
	attachDiagnosticsOnFailure
} from "./diagnostics.fixture";

/**
 * Extended test fixture with role-based authentication.
 * Extends page-helpers.fixture to include authPage, homePage, adminDashboardPage.
 * Each test gets a pre-authenticated browser context based on role.
 */
interface AuthFixtures
{
	/**
	 * Page authenticated as User role.
	 */
	userPage: Page;

	/**
	 * Page authenticated as Admin role.
	 */
	adminPage: Page;

	/**
	 * Page authenticated as Developer role.
	 */
	developerPage: Page;

	/**
	 * Creates a page for a specific test user.
	 * @param testUser
	 * The test user configuration to use.
	 * @returns
	 * A page with the user's authentication state.
	 */
	authenticatedPage: (testUser: TestUser) => Promise<Page>;
}

/**
 * Creates an authenticated page for a role.
 * Shared helper to avoid code duplication.
 * @param browser
 * The browser instance.
 * @param role
 * The role to authenticate as.
 * @returns
 * A page with the role's authentication state.
 */
async function createAuthenticatedPage(
	browser: Browser,
	role: string): Promise<{ page: Page; browserContext: BrowserContext }>
{
	const authStatePath: string =
		`e2e/.auth/${role.toLowerCase()}.json`;
	const browserContext: BrowserContext =
		await browser.newContext({ storageState: authStatePath });
	const page: Page =
		await browserContext.newPage();

	return { page, browserContext };
}

export const test =
	base.extend<AuthFixtures>({
		userPage:
			async ({ browser }, use, testInfo) =>
			{
				const { page, browserContext } =
					await createAuthenticatedPage(browser, "user");
				const collector =
					createDiagnosticsCollector();
				instrumentPageForDiagnostics(page, collector);
				await use(page);
				await attachDiagnosticsOnFailure(page, collector, testInfo);
				await browserContext.close();
			},

		adminPage:
			async ({ browser }, use, testInfo) =>
			{
				const { page, browserContext } =
					await createAuthenticatedPage(browser, "admin");
				const collector =
					createDiagnosticsCollector();
				instrumentPageForDiagnostics(page, collector);
				await use(page);
				await attachDiagnosticsOnFailure(page, collector, testInfo);
				await browserContext.close();
			},

		developerPage:
			async ({ browser }, use, testInfo) =>
			{
				const { page, browserContext } =
					await createAuthenticatedPage(browser, "developer");
				const collector =
					createDiagnosticsCollector();
				instrumentPageForDiagnostics(page, collector);
				await use(page);
				await attachDiagnosticsOnFailure(page, collector, testInfo);
				await browserContext.close();
			},

		authenticatedPage:
			async ({ browser }, use) =>
			{
				const createPage =
					async (testUser: TestUser): Promise<Page> =>
					{
						const { page } =
							await createAuthenticatedPage(browser, testUser.role);
						return page;
					};
				await use(createPage);
			}
	});

export { expect } from "@playwright/test";
