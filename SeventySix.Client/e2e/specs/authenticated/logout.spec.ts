import { Page, Locator } from "@playwright/test";
import {
	freshLoginTest as test,
	expect,
	ROUTES,
	SELECTORS,
	PAGE_TEXT,
	TIMEOUTS
} from "../../fixtures";

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
test.describe.configure({ mode: "serial" });

test.describe("Logout Flow",
	() =>
	{
		test.describe("User Menu Logout",
			() =>
			{
				test("should display logout option in user menu",
					async ({ freshUserPage }: { freshUserPage: Page }) =>
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
					async ({ freshUserPage }: { freshUserPage: Page }) =>
					{
						await freshUserPage.goto(ROUTES.home);

						// Verify initially authenticated
						await expect(freshUserPage.locator(SELECTORS.layout.userMenuButton))
							.toBeVisible();

						// Open user menu and click logout
						await freshUserPage.locator(SELECTORS.layout.userMenuButton).click();
						await freshUserPage.locator(SELECTORS.layout.logoutButton).click();

						// Wait for logout to fully complete (clearAuth runs after async POST)
						// This ensures the session marker is cleared before we reload
						await expect(freshUserPage.locator(SELECTORS.layout.userMenuButton))
							.toBeHidden({ timeout: TIMEOUTS.navigation });

						// Reload to verify session is also cleared server-side
						await freshUserPage.goto(ROUTES.home);
						await freshUserPage.waitForLoadState("domcontentloaded");

						// Wait for Angular to bootstrap and resolve auth state
						// Uses auth timeout since APP_INITIALIZER makes a refresh API call
						await expect(freshUserPage.locator(SELECTORS.layout.userMenuButton))
							.toBeHidden({ timeout: TIMEOUTS.auth });
					});

				test("should redirect to home after logout",
					async ({ freshUserPage }: { freshUserPage: Page }) =>
					{
						// Start on a non-home page
						await freshUserPage.goto(ROUTES.account.root);

						// Perform logout
						await freshUserPage.locator(SELECTORS.layout.userMenuButton).click();
						await freshUserPage.locator(SELECTORS.layout.logoutButton).click();

						// Should eventually be on home or login
						await freshUserPage.waitForURL(
							(url) =>
								url.pathname === ROUTES.home
								|| url.pathname === ROUTES.auth.login,
							{ timeout: TIMEOUTS.api });

						// Verify we're on the expected page
						const currentPath =
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
					async ({ freshAdminPage }: { freshAdminPage: Page }) =>
					{
						await freshAdminPage.goto(ROUTES.admin.dashboard);

						// Verify admin is authenticated
						await expect(freshAdminPage.locator(SELECTORS.layout.userMenuButton))
							.toBeVisible();

						// Perform logout
						await freshAdminPage.locator(SELECTORS.layout.userMenuButton).click();
						await freshAdminPage.locator(SELECTORS.layout.logoutButton).click();

						// Should redirect away from admin area
						await freshAdminPage.waitForURL(
							(url) => !url.pathname.startsWith("/admin"),
							{ timeout: TIMEOUTS.api });

						// Verify we're no longer in admin area
						await expect(freshAdminPage)
							.not.toHaveURL(/\/admin/);
					});
			});

		test.describe("Developer Logout",
			() =>
			{
				test("should logout developer user successfully",
					async ({ freshDeveloperPage }: { freshDeveloperPage: Page }) =>
					{
						await freshDeveloperPage.goto(ROUTES.developer.styleGuide);

						// Verify developer is authenticated
						await expect(freshDeveloperPage.locator(SELECTORS.layout.userMenuButton))
							.toBeVisible();

						// Perform logout
						await freshDeveloperPage.locator(SELECTORS.layout.userMenuButton).click();
						await freshDeveloperPage.locator(SELECTORS.layout.logoutButton).click();

						// Should redirect away from developer area
						await freshDeveloperPage.waitForURL(
							(url) => !url.pathname.startsWith("/developer"),
							{ timeout: TIMEOUTS.api });

						// Verify we're no longer in developer area
						await expect(freshDeveloperPage)
							.not.toHaveURL(/\/developer/);
					});
			});

		test.describe("Session State After Logout",
			() =>
			{
				test("should not access protected routes after logout",
					async ({ freshUserPage }: { freshUserPage: Page }) =>
					{
						await freshUserPage.goto(ROUTES.account.root);

						// Logout
						await freshUserPage.locator(SELECTORS.layout.userMenuButton).click();
						await freshUserPage.locator(SELECTORS.layout.logoutButton).click();

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
							.not.toHaveURL(/^\/account$/);
					});

				test("should show login UI elements after logout",
					async ({ freshUserPage }: { freshUserPage: Page }) =>
					{
						await freshUserPage.goto(ROUTES.home);

						// Logout
						await freshUserPage.locator(SELECTORS.layout.userMenuButton).click();
						await freshUserPage.locator(SELECTORS.layout.logoutButton).click();

						// Wait for logout to fully complete (clearAuth runs after async POST)
						await expect(freshUserPage.locator(SELECTORS.layout.userMenuButton))
							.toBeHidden({ timeout: TIMEOUTS.navigation });

						// Reload to verify session is also cleared server-side
						await freshUserPage.goto(ROUTES.home);
						await freshUserPage.waitForLoadState("domcontentloaded");

						// Wait for Angular to bootstrap and resolve auth state
						await expect(freshUserPage.locator(SELECTORS.layout.userMenuButton))
							.toBeHidden({ timeout: TIMEOUTS.auth });
					});

				test("should redirect to login when session cookie is cleared",
					async ({ freshUserPage }: { freshUserPage: Page }) =>
					{
						await freshUserPage.goto(ROUTES.home);

						// Verify initially authenticated
						await expect(freshUserPage.locator(SELECTORS.layout.userMenuButton))
							.toBeVisible({ timeout: TIMEOUTS.auth });

						// Clear all cookies (simulates session expiry)
						await freshUserPage.context().clearCookies();

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
							.toBeHidden({ timeout: TIMEOUTS.auth });
					});
			});
	});
