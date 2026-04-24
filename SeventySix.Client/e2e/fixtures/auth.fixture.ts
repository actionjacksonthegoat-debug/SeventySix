// <copyright file="auth.fixture.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import type { Browser, BrowserContext, Page } from "@playwright/test";
import {
	attachDiagnosticsOnFailure,
	createDiagnosticsCollector,
	type DiagnosticsCollector,
	instrumentPageForDiagnostics
} from "./diagnostics.fixture";
import { loginInFreshContext } from "./helpers/context-login.helper";
import { test as base } from "./page-helpers.fixture";
import { AdminDashboardPageHelper } from "./pages/admin-dashboard.page";
import { ROUTES } from "./routes.constant";
import { TEST_USERS, type TestUser } from "./test-users.constant";
import { SELECTORS } from "./selectors.constant";
import { TIMEOUTS } from "./timeouts.constant";
import { solveAltchaChallenge } from "./helpers/altcha.helper";

/**
 * Extended test fixture with role-based authentication.
 * Extends page-helpers.fixture to include authPage, homePage, adminDashboardPage.
 * Each test gets a fresh page from a worker-scoped browser context.
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
 * Worker-scoped fixtures that hold a single browser context per role per worker.
 * Sharing the context across tests within a worker ensures that rotating refresh
 * tokens remain valid: each test's Angular bootstrap refreshes the token in-place
 * inside the shared context's cookie store, so the next test in the same worker
 * uses the already-rotated (still valid) token rather than re-reading the stale
 * token from the session file on disk.
 */
interface AuthWorkerFixtures
{
	/**
	 * Browser context authenticated as User role (one per worker).
	 */
	userContext: BrowserContext;

	/**
	 * Browser context authenticated as Admin role (one per worker).
	 */
	adminContext: BrowserContext;

	/**
	 * Browser context authenticated as Developer role (one per worker).
	 */
	developerContext: BrowserContext;
}

/**
 * Finds a test user by role case-insensitively.
 * @param role
 * The role to match (e.g. "user", "admin", "developer").
 * @returns
 * The matching test user.
 */
function findTestUserByRole(role: string): TestUser
{
	const normalized: string =
		role.toLowerCase();
	const user: TestUser | undefined =
		TEST_USERS.find(
			(candidate: TestUser): boolean =>
				candidate.role.toLowerCase() === normalized);

	if (user === undefined)
	{
		throw new Error(`No TEST_USERS entry found for role "${role}"`);
	}

	return user;
}

/**
 * Creates a worker-scoped authenticated browser context by performing a fresh
 * programmatic login. This avoids relying on stale refresh tokens that may have
 * been rotated on disk by the global setup but rotated further in-memory by
 * other workers. Each worker gets its own login session with a distinct token
 * family so parallel workers never compete over the same refresh token chain.
 * @param browser
 * The browser instance.
 * @param role
 * The role to authenticate as (case-insensitive).
 * @returns
 * A browser context with fresh authenticated cookies.
 */
async function createFreshWorkerContext(
	browser: Browser,
	role: string): Promise<BrowserContext>
{
	const user: TestUser =
		findTestUserByRole(role);
	const { page, context } =
		await loginInFreshContext(
			browser,
			user,
			{
				expectedUrl: (url: URL): boolean =>
					url.pathname === ROUTES.home
						|| url.pathname.includes("/mfa/")
			});

	// Close the login page; subsequent tests open their own pages in this context.
	await page.close();
	return context;
}

/**
 * Ensures the browser context still holds a valid authenticated session.
 * Opens a probe page, navigates to the home route, and checks whether Angular
 * redirected to the login page (indicating the refresh token was invalidated).
 * If authentication has lapsed, performs a fresh in-context login so the shared
 * worker context is restored before the test page is handed to the caller.
 *
 * @param context
 * The worker-scoped browser context to probe and optionally re-authenticate.
 *
 * @param role
 * The role to re-authenticate as if the session has expired.
 */
async function ensureContextAuthenticated(
	context: BrowserContext,
	role: string): Promise<void>
{
	const probe: Page =
		await context.newPage();

	try
	{
		await probe.goto(ROUTES.home,
			{ timeout: TIMEOUTS.auth });
		await probe.waitForURL(
			(url: URL): boolean =>
				url.pathname === ROUTES.home
					|| url.pathname.startsWith(ROUTES.auth.login),
			{ timeout: TIMEOUTS.auth });

		const currentUrl: string =
			probe.url();

		if (currentUrl.includes(ROUTES.auth.login))
		{
			// Session has expired — re-authenticate inside this context
			const user: TestUser =
				findTestUserByRole(role);

			await probe.locator(SELECTORS.form.usernameInput)
				.waitFor(
					{ state: "visible", timeout: TIMEOUTS.auth });
			await probe.locator(SELECTORS.form.usernameInput)
				.fill(user.username);
			await probe.locator(SELECTORS.form.passwordInput)
				.fill(user.password);
			await solveAltchaChallenge(probe);
			await probe.locator(SELECTORS.form.submitButton)
				.click();
			await probe.waitForURL(ROUTES.home,
				{ timeout: TIMEOUTS.auth });
		}
	}
	finally
	{
		await probe.close();
	}
}

export const test: ReturnType<typeof base.extend<AuthFixtures, AuthWorkerFixtures>> =
	base.extend<
		AuthFixtures,
		AuthWorkerFixtures>(
		{
		// --- Worker-scoped contexts (one per worker, shared across tests) ---
		// Using worker scope ensures each test in a worker reuses the same
		// cookie store. When a test's Angular bootstrap rotates the refresh
		// token the updated cookie lives in the shared context so the next
		// test in the same worker uses the current (valid) token, not the
		// stale one from the session file on disk.

			userContext: [
				async ({ browser }, use) =>
				{
					const context: BrowserContext =
						await createFreshWorkerContext(browser, "user");
					await use(context);
					await context.close();
				},
				{ scope: "worker" }
			],

			adminContext: [
				async ({ browser }, use) =>
				{
					const context: BrowserContext =
						await createFreshWorkerContext(browser, "admin");
					await use(context);
					await context.close();
				},
				{ scope: "worker" }
			],

			developerContext: [
				async ({ browser }, use) =>
				{
					const context: BrowserContext =
						await createFreshWorkerContext(browser, "developer");
					await use(context);
					await context.close();
				},
				{ scope: "worker" }
			],

			// --- Test-scoped pages (fresh page per test, shared context) ---

			userPage: async ({ userContext }, use, testInfo) =>
			{
				await ensureContextAuthenticated(userContext, "user");
				const page: Page =
					await userContext.newPage();
				const collector: DiagnosticsCollector =
					createDiagnosticsCollector();
				instrumentPageForDiagnostics(page, collector);
				await use(page);
				await attachDiagnosticsOnFailure(page, collector, testInfo);
				await page.close();
			},

			adminPage: async ({ adminContext }, use, testInfo) =>
			{
				await ensureContextAuthenticated(adminContext, "admin");
				const page: Page =
					await adminContext.newPage();
				const collector: DiagnosticsCollector =
					createDiagnosticsCollector();
				instrumentPageForDiagnostics(page, collector);
				await use(page);
				await attachDiagnosticsOnFailure(page, collector, testInfo);
				await page.close();
			},

			developerPage: async ({ developerContext }, use, testInfo) =>
			{
				await ensureContextAuthenticated(developerContext, "developer");
				const page: Page =
					await developerContext.newPage();
				const collector: DiagnosticsCollector =
					createDiagnosticsCollector();
				instrumentPageForDiagnostics(page, collector);
				await use(page);
				await attachDiagnosticsOnFailure(page, collector, testInfo);
				await page.close();
			},

			authenticatedPage: async ({ browser }, use) =>
			{
				const createPage: (testUser: TestUser) => Promise<Page> =
					async (testUser: TestUser): Promise<Page> =>
					{
						const { page } =
							await loginInFreshContext(
								browser,
								testUser,
								{
									expectedUrl: (url: URL): boolean =>
										url.pathname === ROUTES.home
											|| url.pathname.includes("/mfa/")
								});
						return page;
					};
				await use(createPage);
			},

			// Override the parent page-helpers.fixture adminDashboardPage so that it
			// wraps adminPage (the worker-scoped authenticated page) instead of the
			// built-in page fixture (which uses the project-level storageState shared
			// across all workers). Using adminPage prevents token-rotation conflicts
			// when multiple parallel workers all navigate to the admin dashboard.
			adminDashboardPage: async ({ adminPage }, use) =>
			{
				await use(new AdminDashboardPageHelper(adminPage));
			}
		});

export { expect } from "@playwright/test";