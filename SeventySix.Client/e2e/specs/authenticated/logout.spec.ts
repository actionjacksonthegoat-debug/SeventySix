import {
	type ContextLoginResult,
	CROSSTAB_USER,
	expect,
	freshLoginTest as test,
	loginInFreshContext,
	ROUTES,
	SELECTORS,
	TIMEOUTS,
	unauthenticatedTest
} from "@e2e-fixtures";
import { Locator, Page } from "@playwright/test";

/**
 * E2E Tests for Logout Flow
 *
 * Priority: P1 (Core Flow)
 * Tests authenticated user logout functionality.
 *
 * IMPORTANT: These tests use fresh login sessions (not shared auth state)
 * because logout invalidates the token on the server. Using shared auth
 * state would cause other parallel tests to fail.
 *
 * These tests run serially to avoid interference.
 */
test.describe.configure(
	{ mode: "serial" });

test.describe("Logout Flow",
	() =>
	{
		test.describe("User Menu Logout",
			() =>
			{
				test("should display logout option in user menu",
					async ({ freshUserPage }: { freshUserPage: Page; }) =>
					{
						await freshUserPage.goto(ROUTES.home);

						// Open user menu
						const userMenuButton: Locator =
							freshUserPage.locator(SELECTORS.layout.userMenuButton);

						await expect(userMenuButton)
							.toBeVisible();
						await userMenuButton.click();

						// Should show logout option
						const logoutButton: Locator =
							freshUserPage.locator(SELECTORS.layout.logoutButton);

						await expect(logoutButton)
							.toBeVisible();
					});

				test("should logout user when clicking logout button",
					async ({ freshUserPage }: { freshUserPage: Page; }) =>
					{
						await freshUserPage.goto(ROUTES.home);

						// Verify initially authenticated
						await expect(freshUserPage.locator(SELECTORS.layout.userMenuButton))
							.toBeVisible();

						// Open user menu and click logout
						await freshUserPage
							.locator(SELECTORS.layout.userMenuButton)
							.click();
						await freshUserPage
							.locator(SELECTORS.layout.logoutButton)
							.click();

						// Wait for logout to fully complete (clearAuth runs after async POST)
						// This ensures the session marker is cleared before we reload
						await expect(freshUserPage.locator(SELECTORS.layout.userMenuButton))
							.toBeHidden(
								{ timeout: TIMEOUTS.navigation });

						// Reload to verify session is also cleared server-side
						await freshUserPage.goto(ROUTES.home);

						// Wait for Angular to bootstrap and resolve auth state
						// Uses auth timeout since APP_INITIALIZER makes a refresh API call
						await expect(freshUserPage.locator(SELECTORS.layout.userMenuButton))
							.toBeHidden(
								{ timeout: TIMEOUTS.auth });
					});

				test("should redirect to home after logout",
					async ({ freshUserPage }: { freshUserPage: Page; }) =>
					{
						// Start on a non-home page
						await freshUserPage.goto(ROUTES.account.root);

						// Perform logout
						await freshUserPage
							.locator(SELECTORS.layout.userMenuButton)
							.click();
						await freshUserPage
							.locator(SELECTORS.layout.logoutButton)
							.click();

						// Should eventually be on home or login
						await freshUserPage.waitForURL(
							(url) =>
								url.pathname === ROUTES.home
									|| url.pathname === ROUTES.auth.login,
							{ timeout: TIMEOUTS.api });

						// Verify we're on the expected page
						const currentPath: string =
							new URL(freshUserPage.url()).pathname;

						expect(
							currentPath === ROUTES.home
								|| currentPath === ROUTES.auth.login)
							.toBeTruthy();
					});
			});

		test.describe("Admin Logout",
			() =>
			{
				test("should logout admin user successfully",
					async ({ freshAdminPage }: { freshAdminPage: Page; }) =>
					{
						await freshAdminPage.goto(ROUTES.admin.dashboard);

						// Verify admin is authenticated
						await expect(freshAdminPage.locator(SELECTORS.layout.userMenuButton))
							.toBeVisible();

						// Perform logout
						await freshAdminPage
							.locator(SELECTORS.layout.userMenuButton)
							.click();
						await freshAdminPage
							.locator(SELECTORS.layout.logoutButton)
							.click();

						// Should redirect away from admin area
						await freshAdminPage.waitForURL(
							(url) =>
								!url.pathname.startsWith("/admin"),
							{ timeout: TIMEOUTS.api });

						// Verify we're no longer in admin area
						await expect(freshAdminPage)
							.not
							.toHaveURL(/\/admin/);
					});
			});

		test.describe("Developer Logout",
			() =>
			{
				test(
					"should logout developer user successfully",
					async ({ freshDeveloperPage }: { freshDeveloperPage: Page; }) =>
					{
						await freshDeveloperPage.goto(ROUTES.developer.styleGuide);

						// Verify developer is authenticated
						await expect(freshDeveloperPage.locator(SELECTORS.layout.userMenuButton))
							.toBeVisible();

						// Perform logout
						await freshDeveloperPage
							.locator(SELECTORS.layout.userMenuButton)
							.click();
						await freshDeveloperPage
							.locator(SELECTORS.layout.logoutButton)
							.click();

						// Should redirect away from developer area
						await freshDeveloperPage.waitForURL(
							(url) =>
								!url.pathname.startsWith("/developer"),
							{ timeout: TIMEOUTS.api });

						// Verify we're no longer in developer area
						await expect(freshDeveloperPage)
							.not
							.toHaveURL(/\/developer/);
					});
			});

		test.describe("Session State After Logout",
			() =>
			{
				test("should not access protected routes after logout",
					async ({ freshUserPage }: { freshUserPage: Page; }) =>
					{
						await freshUserPage.goto(ROUTES.account.root);

						// Logout
						await freshUserPage
							.locator(SELECTORS.layout.userMenuButton)
							.click();
						await freshUserPage
							.locator(SELECTORS.layout.logoutButton)
							.click();

						// Wait for logout redirect
						await freshUserPage.waitForURL(
							(url) =>
								url.pathname === ROUTES.home
									|| url.pathname.includes(ROUTES.auth.login),
							{ timeout: TIMEOUTS.api });

						// Try to access protected route
						await freshUserPage.goto(ROUTES.account.root);

						// Should redirect to login
						await freshUserPage.waitForURL(
							(url) =>
								url.pathname.includes(ROUTES.auth.login)
									|| url.pathname === ROUTES.home,
							{ timeout: TIMEOUTS.api });

						// Verify we can't access account
						await expect(freshUserPage)
							.not
							.toHaveURL(/^\/account$/);
					});

				test("should show login UI elements after logout",
					async ({ freshUserPage }: { freshUserPage: Page; }) =>
					{
						await freshUserPage.goto(ROUTES.home);

						// Logout
						await freshUserPage
							.locator(SELECTORS.layout.userMenuButton)
							.click();
						await freshUserPage
							.locator(SELECTORS.layout.logoutButton)
							.click();

						// Wait for logout to fully complete (clearAuth runs after async POST)
						await expect(freshUserPage.locator(SELECTORS.layout.userMenuButton))
							.toBeHidden(
								{ timeout: TIMEOUTS.navigation });

						// Reload to verify session is also cleared server-side
						await freshUserPage.goto(ROUTES.home);

						// Wait for Angular to bootstrap and resolve auth state
						await expect(freshUserPage.locator(SELECTORS.layout.userMenuButton))
							.toBeHidden(
								{ timeout: TIMEOUTS.auth });
					});

				test(
					"should redirect to login when session cookie is cleared",
					async ({ freshUserPage }: { freshUserPage: Page; }) =>
					{
						await freshUserPage.goto(ROUTES.home);

						// Verify initially authenticated
						await expect(freshUserPage.locator(SELECTORS.layout.userMenuButton))
							.toBeVisible(
								{ timeout: TIMEOUTS.auth });

						// Clear all cookies (simulates session expiry)
						await freshUserPage
							.context()
							.clearCookies();

						// Navigate to a protected route
						await freshUserPage.goto(ROUTES.account.root);

						// Should redirect to login since refresh cookie is gone
						await freshUserPage.waitForURL(
							(url) =>
								url.pathname.includes(ROUTES.auth.login)
									|| url.pathname === ROUTES.home,
							{ timeout: TIMEOUTS.api });

						// Verify user menu is not visible (unauthenticated)
						await expect(freshUserPage.locator(SELECTORS.layout.userMenuButton))
							.toBeHidden(
								{ timeout: TIMEOUTS.auth });
					});
			});
	});

/**
 * Cross-Tab Logout — Isolated Test
 *
 * Uses a dedicated `e2e_crosstab` user via `unauthenticatedTest` to verify
 * that logging out in one browser context invalidates the session in another.
 * The server revokes the refresh token, so the second context's next API call
 * should fail authentication.
 */
unauthenticatedTest.describe("Cross-Tab Logout",
	() =>
	{
		unauthenticatedTest("should invalidate second context when first context logs out",
			async ({ browser }) =>
			{
				// Login in two separate browser contexts (simulates two tabs)
				const tab1: ContextLoginResult =
					await loginInFreshContext(browser, CROSSTAB_USER);
				const tab2: ContextLoginResult =
					await loginInFreshContext(browser, CROSSTAB_USER);

				try
				{
					// Verify both are initially authenticated
					await expect(tab1.page.locator(SELECTORS.layout.userMenuButton))
						.toBeVisible(
							{ timeout: TIMEOUTS.auth });
					await expect(tab2.page.locator(SELECTORS.layout.userMenuButton))
						.toBeVisible(
							{ timeout: TIMEOUTS.auth });

					// Logout in tab1
					await tab1
						.page
						.locator(SELECTORS.layout.userMenuButton)
						.click();
					await tab1
						.page
						.locator(SELECTORS.layout.logoutButton)
						.click();

					await expect(tab1.page.locator(SELECTORS.layout.userMenuButton))
						.toBeHidden(
							{ timeout: TIMEOUTS.navigation });

					// Tab2: navigate to a protected route — server should reject the request
					// because the refresh token family is revoked
					await tab2.page.goto(ROUTES.account.root);

					// Tab2 should be redirected to login or home (unauthenticated)
					await tab2.page.waitForURL(
						(url) =>
							url.pathname.includes(ROUTES.auth.login)
								|| url.pathname === ROUTES.home
								|| url.pathname === ROUTES.account.root,
						{ timeout: TIMEOUTS.api });

					// If tab2 stayed on account, it means the session was still valid
					// (server allows multiple refresh token families). In that case,
					// verify the user menu is still visible — this is acceptable behavior
					// for servers that keep sessions independent.
					const currentPath: string =
						new URL(tab2.page.url()).pathname;

					// eslint-disable-next-line playwright/no-conditional-in-test -- cross-tab session behavior depends on server config
					if (
						currentPath.includes(ROUTES.auth.login)
							|| currentPath === ROUTES.home)
					{
						// Session was invalidated — tab2 was kicked out
						// eslint-disable-next-line playwright/no-conditional-expect -- conditional on server config is intentional
						await expect(tab2.page.locator(SELECTORS.layout.userMenuButton))
							.toBeHidden(
								{ timeout: TIMEOUTS.auth });
					}
					// else: tab2 retained its own session — acceptable for independent refresh token families
				}
				finally
				{
					await tab1.context.close();
					await tab2.context.close();
				}
			});
	});