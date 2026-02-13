import { Page } from "@playwright/test";
import {
	test,
	expect,
	ROUTES,
	ROUTE_GROUPS,
	SELECTORS,
	PAGE_TEXT,
	expectNoAccessDenied,
	expectNoApplicationErrors,
	unauthenticatedTest
} from "../../fixtures";

/**
 * E2E Tests for User Account Routes - Authentication Required
 *
 * Priority: P1 (Core Flow)
 * Verifies account area access control:
 * - Any authenticated user can access their own account
 * - Unauthenticated users are redirected to login
 */
test.describe("User Account Routes - Access Control",
	() =>
	{
		test.describe("Authenticated User Access",
			() =>
			{
				test("should allow user role to access profile page",
					async ({ userPage }: { userPage: Page }) =>
					{
						await userPage.goto(ROUTES.account.root);

						// Should remain on account page
						await expect(userPage)
							.toHaveURL(/\/account/);

						// Should see profile content without errors
						await expectNoAccessDenied(userPage);
						await expectNoApplicationErrors(userPage);
					});

				test("should allow user role to access permissions request page",
					async ({ userPage }: { userPage: Page }) =>
					{
						await userPage.goto(ROUTES.account.permissions);

						// Should load permissions request page
						await expect(userPage)
							.toHaveURL(/\/account\/permissions/);
					});

				test("should allow admin to access own account",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						await adminPage.goto(ROUTES.account.root);

						// Admin should also have account access
						await expect(adminPage)
							.toHaveURL(/\/account/);
					});

				test("should allow developer to access own account",
					async ({ developerPage }: { developerPage: Page }) =>
					{
						await developerPage.goto(ROUTES.account.root);

						// Developer should have account access
						await expect(developerPage)
							.toHaveURL(/\/account/);
					});
			});

		unauthenticatedTest.describe("Unauthenticated Access",
			() =>
			{
				ROUTE_GROUPS.accountRoutes.forEach(
					(route) =>
					{
						unauthenticatedTest(`should redirect anonymous user to login from ${route}`,
							async ({ unauthenticatedPage }) =>
							{
								await unauthenticatedPage.goto(route);

								// Should redirect to login with returnUrl
								await expect(unauthenticatedPage)
									.toHaveURL(/\/auth\/login\?returnUrl=/);
							});
					});
			});

		test.describe("Profile Page Content",
			() =>
			{
				test("should display user information on profile page",
					async ({ userPage }: { userPage: Page }) =>
					{
						await userPage.goto(ROUTES.account.root);

						// Should see profile card with username (mat-card-title)
						await expect(userPage.locator("mat-card-title"))
							.toBeVisible();
					});
			});

		test.describe("Permission Request Page",
			() =>
			{
				test("should make permission request page accessible",
					async ({ userPage }: { userPage: Page }) =>
					{
						await userPage.goto(ROUTES.account.permissions);

						// Page should load without errors
						await expect(userPage)
							.toHaveURL(/\/account\/permissions/);
						await expect(userPage.locator("body"))
							.not.toContainText(PAGE_TEXT.errors.error);
					});
			});
	});
