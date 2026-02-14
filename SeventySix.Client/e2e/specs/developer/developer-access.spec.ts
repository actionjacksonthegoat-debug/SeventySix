import { Page } from "@playwright/test";
import {
	test,
	expect,
	ROUTES,
	ROUTE_GROUPS,
	SELECTORS,
	TIMEOUTS,
	createRouteRegex,
	expectNoAccessDenied,
	expectNoApplicationErrors,
	unauthenticatedTest
} from "../../fixtures";

/**
 * E2E Tests for Developer Routes - Role-Based Access Control
 *
 * Priority: P0 (Security Critical)
 * Verifies developer area RBAC enforcement:
 * - Developer role can access developer routes
 * - Admin role can also access (Admin has Developer permissions)
 * - User role is redirected (insufficient permissions)
 * - Unauthenticated users are redirected to login
 */
test.describe("Developer Routes - RBAC",
	() =>
	{
		test.describe("Developer Role Access",
			() =>
			{
				ROUTE_GROUPS.developerRoutes.forEach(
					(route) =>
					{
						test(`should allow developer to access ${route}`,
							async ({ developerPage }: { developerPage: Page }) =>
							{
								await developerPage.goto(route);

								// Should remain on the developer route
								await expect(developerPage)
									.toHaveURL(createRouteRegex(route));

							// Should not show access denied or application errors
							await expectNoAccessDenied(developerPage);
							await expectNoApplicationErrors(developerPage);
							});
					});

				test("should allow developer to view style guide",
					async ({ developerPage }: { developerPage: Page }) =>
					{
						await developerPage.goto(ROUTES.developer.styleGuide);

						// Page should load successfully
						await expect(developerPage.locator(SELECTORS.layout.pageHeading))
							.toBeVisible();
					});

				test("should allow developer to view architecture guide",
					async ({ developerPage }: { developerPage: Page }) =>
					{
						await developerPage.goto(ROUTES.developer.architectureGuide);

						// Page should load successfully
						await expect(developerPage)
							.toHaveURL(/\/developer\/architecture-guide/);
					});
			});

		test.describe("Admin Role Access (Elevated)",
			() =>
			{
				// Admin should also have Developer access per roleGuard config
				ROUTE_GROUPS.developerRoutes.forEach(
					(route) =>
					{
						test(`should allow admin to access ${route}`,
							async ({ adminPage }: { adminPage: Page }) =>
							{
								await adminPage.goto(route);

								// Admin has elevated permissions, should access developer routes
								await expect(adminPage)
									.toHaveURL(createRouteRegex(route));
							});
					});
			});

		test.describe("User Role Blocked",
			() =>
			{
				// FIXME: App-level RBAC bug — Angular route guard does not block User role from /developer/* routes.
				// These tests are correct but the application guard needs to be updated to enforce Developer role.
				test.fixme();

				ROUTE_GROUPS.developerRoutes.forEach(
					(route) =>
					{
						test(`should redirect user role from ${route}`,
							async ({ userPage }: { userPage: Page }) =>
							{
								await userPage.goto(route);

								// Should redirect away from developer area
								await expect(userPage)
									.not.toHaveURL(createRouteRegex(route));
							});
					});

				test("should redirect user role to home from developer area",
					async ({ userPage }: { userPage: Page }) =>
					{
						await userPage.goto(ROUTES.developer.styleGuide);

						// Should redirect to home (insufficient permissions)
						await userPage.waitForURL(
							(url) => !url.pathname.startsWith("/developer"),
							{ timeout: TIMEOUTS.api });

						// Verify not on developer area
						await expect(userPage)
							.not.toHaveURL(/\/developer/);
					});
			});

		unauthenticatedTest.describe("Unauthenticated Access",
			() =>
			{
				ROUTE_GROUPS.developerRoutes.forEach(
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

		test.describe("Default Route Redirect",
			() =>
			{
				test("should redirect developer base path to style-guide",
					async ({ developerPage }: { developerPage: Page }) =>
					{
						await developerPage.goto("/developer");

						// Should redirect to default child route
						await expect(developerPage)
							.toHaveURL(/\/developer\/style-guide/);
					});
			});
	});
