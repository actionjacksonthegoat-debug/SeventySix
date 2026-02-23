import {
	expect,
	ROUTES,
	SELECTORS,
	test,
	TIMEOUTS
} from "@e2e-fixtures";
import { Locator, Page } from "@playwright/test";

/**
 * E2E Tests for Navigation Components
 *
 * Priority: P2 (UX Feature)
 * Tests authenticated navigation including:
 * - User menu visibility
 * - Role-based navigation items
 */
test.describe("Navigation",
	() =>
	{
		test.describe("User Menu - Authenticated",
			() =>
			{
				test("should display user menu button when authenticated",
					async ({ userPage }: { userPage: Page; }) =>
					{
						await userPage.goto(ROUTES.home);

						const userMenuButton: Locator =
							userPage.locator(SELECTORS.layout.userMenuButton);

						await expect(userMenuButton)
							.toBeVisible(
								{ timeout: TIMEOUTS.element });
					});

				test("should open user menu when clicking button",
					async ({ userPage }: { userPage: Page; }) =>
					{
						await userPage.goto(ROUTES.home);

						const userMenuButton: Locator =
							userPage.locator(SELECTORS.layout.userMenuButton);
						await userMenuButton.click();

						// Menu should open and show logout option
						const logoutButton: Locator =
							userPage.locator(SELECTORS.layout.logoutButton);

						await expect(logoutButton)
							.toBeVisible();
					});
			});

		test.describe("Role-Based Navigation - Admin",
			() =>
			{
				test("should display admin navigation for admin users",
					async ({ adminPage }: { adminPage: Page; }) =>
					{
						await adminPage.goto(ROUTES.home);

						// Admin users should have access to admin routes
						await adminPage.goto(ROUTES.admin.dashboard);

						await expect(adminPage)
							.toHaveURL(/\/admin\/dashboard/);
					});
			});

		test.describe("Role-Based Navigation - Developer",
			() =>
			{
				test(
					"should display developer navigation for developer users",
					async ({ developerPage }: { developerPage: Page; }) =>
					{
						await developerPage.goto(ROUTES.home);

						// Developer users should have access to developer routes
						await developerPage.goto(ROUTES.developer.styleGuide);

						await expect(developerPage)
							.toHaveURL(/\/developer\/style-guide/);
					});
			});

		test.describe("Role-Based Navigation - Standard User",
			() =>
			{
				test("should not allow user to access admin routes",
					async ({ userPage }: { userPage: Page; }) =>
					{
						await userPage.goto(ROUTES.admin.dashboard);

						// User should be redirected away from admin
						await expect(userPage)
							.not
							.toHaveURL(/\/admin\/dashboard/);
					});

				test("should not allow user to access developer routes",
					async ({ userPage }: { userPage: Page; }) =>
					{
						await userPage.goto(ROUTES.developer.styleGuide);

						// User should be redirected away from developer
						await expect(userPage)
							.not
							.toHaveURL(/\/developer\/style-guide/);
					});
			});
	});