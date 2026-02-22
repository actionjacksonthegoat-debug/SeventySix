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
} from "@e2e-fixtures";

/**
 * E2E Tests for Admin Routes - Role-Based Access Control
 *
 * Priority: P0 (Security Critical)
 * Verifies admin area RBAC enforcement:
 * - Admin role can access all admin routes
 * - User role is redirected (insufficient permissions)
 * - Developer role is redirected (insufficient permissions)
 * - Unauthenticated users are redirected to login
 */
test.describe("Admin Routes - RBAC",
	() =>
	{
		test.describe("Admin Role Access",
			() =>
			{
				ROUTE_GROUPS.adminRoutes.forEach(
					(route) =>
					{
						test(`should allow admin to access ${route}`,
							async ({ adminPage }: { adminPage: Page }) =>
							{
								await adminPage.goto(route);

								// Should remain on the admin route
								await expect(adminPage)
									.toHaveURL(createRouteRegex(route));

							// Should not show access denied or application errors
							await expectNoAccessDenied(adminPage);
							await expectNoApplicationErrors(adminPage);
							});
					});

				test("should allow admin to navigate admin dashboard",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						await adminPage.goto(ROUTES.admin.dashboard);

						// Dashboard should load with expected content
						await expect(adminPage.locator(SELECTORS.layout.pageHeading))
							.toBeVisible();
					});
			});

		test.describe("User Role Blocked",
			() =>
			{
				ROUTE_GROUPS.adminRoutes.forEach(
					(route) =>
					{
						test(`should redirect user role from ${route}`,
							async ({ userPage }: { userPage: Page }) =>
							{
								await userPage.goto(route);

								// Should redirect away from admin area
								await expect(userPage)
									.not.toHaveURL(createRouteRegex(route));
							});
					});

				test("should redirect user role to home from admin dashboard",
					async ({ userPage }: { userPage: Page }) =>
					{
						await userPage.goto(ROUTES.admin.dashboard);

						// Should redirect to home (insufficient permissions)
						await userPage.waitForURL(
							(url) => !url.pathname.startsWith("/admin"),
							{ timeout: TIMEOUTS.api });

						// Verify not on admin dashboard
						await expect(userPage)
							.not.toHaveURL(/\/admin\/dashboard/);
					});
			});

		test.describe("Developer Role Blocked",
			() =>
			{
				test("should block developer role from admin dashboard",
					async ({ developerPage }: { developerPage: Page }) =>
					{
						await developerPage.goto(ROUTES.admin.dashboard);

						// Developer should be redirected away from admin
						await expect(developerPage)
							.not.toHaveURL(/\/admin\/dashboard/);
					});

				test("should block developer role from user management",
					async ({ developerPage }: { developerPage: Page }) =>
					{
						await developerPage.goto(ROUTES.admin.users);

						// Developer should be redirected
						await expect(developerPage)
							.not.toHaveURL(/\/admin\/users/);
					});
			});

		unauthenticatedTest.describe("Unauthenticated Access",
			() =>
			{
				ROUTE_GROUPS.adminRoutes.forEach(
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

		test.describe("Admin User Management",
			() =>
			{
				test("should allow admin to view user list",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						await adminPage.goto(ROUTES.admin.users);

						// Should see user management page
						await expect(adminPage)
							.toHaveURL(/\/admin\/users/);
					});

				test("should allow admin to access create user page",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						await adminPage.goto(`${ROUTES.admin.users}/create`);

						// Should load create user form
						await expect(adminPage)
							.toHaveURL(/\/admin\/users\/create/);
					});
			});

		test.describe("Admin Permission Requests",
			() =>
			{
				test("should allow admin to view permission requests",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						await adminPage.goto(ROUTES.admin.permissionRequests);

						// Should see permission requests page
						await expect(adminPage)
							.toHaveURL(/\/admin\/permission-requests/);
					});
			});
	});
