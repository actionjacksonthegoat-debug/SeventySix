// <copyright file="auth.fixture.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import type { Browser, BrowserContext, Page } from "@playwright/test";
import { E2E_CONFIG } from "./config.constant";
import {
	attachDiagnosticsOnFailure,
	createDiagnosticsCollector,
	type DiagnosticsCollector,
	instrumentPageForDiagnostics
} from "./diagnostics.fixture";
import { test as base } from "./page-helpers.fixture";
import { TestUser } from "./test-users.constant";

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
	role: string): Promise<{ page: Page; browserContext: BrowserContext; }>
{
	const authStatePath: string =
		`e2e/.auth/${role.toLowerCase()}.json`;
	const browserContext: BrowserContext =
		await browser.newContext(
			{
				storageState: authStatePath,
				// Mirror the playwright.config.ts `use` settings for manually-created
				// contexts. browser.newContext() does not inherit config-level `use`
				// options, so ignoreHTTPSErrors must be set explicitly to prevent SSL
				// errors against the self-signed dev certificate in CI.
				baseURL: E2E_CONFIG.clientBaseUrl,
				ignoreHTTPSErrors: true
			});
	const page: Page =
		await browserContext.newPage();

	return { page, browserContext };
}

export const test: ReturnType<typeof base.extend<AuthFixtures>> =
	base.extend<AuthFixtures>(
		{
			userPage: async ({ browser }, use, testInfo) =>
			{
				const { page, browserContext } =
					await createAuthenticatedPage(browser, "user");
				const collector: DiagnosticsCollector =
					createDiagnosticsCollector();
				instrumentPageForDiagnostics(page, collector);
				await use(page);
				await attachDiagnosticsOnFailure(page, collector, testInfo);
				await browserContext.close();
			},

			adminPage: async ({ browser }, use, testInfo) =>
			{
				const { page, browserContext } =
					await createAuthenticatedPage(browser, "admin");
				const collector: DiagnosticsCollector =
					createDiagnosticsCollector();
				instrumentPageForDiagnostics(page, collector);
				await use(page);
				await attachDiagnosticsOnFailure(page, collector, testInfo);
				await browserContext.close();
			},

			developerPage: async ({ browser }, use, testInfo) =>
			{
				const { page, browserContext } =
					await createAuthenticatedPage(browser, "developer");
				const collector: DiagnosticsCollector =
					createDiagnosticsCollector();
				instrumentPageForDiagnostics(page, collector);
				await use(page);
				await attachDiagnosticsOnFailure(page, collector, testInfo);
				await browserContext.close();
			},

			authenticatedPage: async ({ browser }, use) =>
			{
				const createPage: (testUser: TestUser) => Promise<Page> =
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