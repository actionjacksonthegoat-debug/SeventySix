// <copyright file="developer-access.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import {
	createRouteRegex,
	expect,
	expectNoAccessDenied,
	expectNoApplicationErrors,
	ROUTE_GROUPS,
	ROUTES,
	SELECTORS,
	test,
	TIMEOUTS,
	unauthenticatedTest
} from "@e2e-fixtures";
import { Page } from "@playwright/test";

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
							async ({ developerPage }: { developerPage: Page; }) =>
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
					async ({ developerPage }: { developerPage: Page; }) =>
					{
						await developerPage.goto(ROUTES.developer.styleGuide);

						// Page should load successfully
						await expect(developerPage.locator(SELECTORS.layout.pageHeading))
							.toBeVisible();
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
							async ({ adminPage }: { adminPage: Page; }) =>
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
				ROUTE_GROUPS.developerRoutes.forEach(
				(route) =>
				{
					test(`should redirect user role from ${route}`,
						async ({ userPage }: { userPage: Page; }) =>
						{
							// Use 'commit' so goto resolves as soon as the server responds,
							// before Angular bootstraps. Without this, goto may complete with
							// the page at about:blank when the canMatch guard redirects
							// client-side during the load event, causing waitForURL to time out.
							await userPage.goto(route, { waitUntil: "commit" });

							// Role guard redirects users without Developer/Admin role.
							// CI Docker is slower — use waitForURL with navigation timeout
							// rather than the global expect.timeout (10 s) to give Angular
							// time to run the canMatch guard and complete the redirect.
							await userPage.waitForURL(
								(url: URL) =>
									!url.pathname.startsWith("/developer"),
								{ timeout: TIMEOUTS.navigation });

							// Confirm the redirect completed (satisfies playwright/expect-expect).
							await expect(userPage)
								.not
								.toHaveURL(createRouteRegex(route));
							});
					});

				test("should redirect user role to home from developer area",
					async ({ userPage }: { userPage: Page; }) =>
					{
					// Use 'commit' so goto resolves before Angular bootstraps and the
					// canMatch guard fires. Without this, the guard's immediate client-side
					// redirect can leave the page at about:blank, causing waitForURL to
					// time out in CI where Docker is slower to process the redirect.
					await userPage.goto(ROUTES.developer.styleGuide, { waitUntil: "commit" });

				// Should redirect to home (insufficient permissions).
				// Use TIMEOUTS.navigation (15 s) instead of TIMEOUTS.api (10 s) —
				// CI Docker environments are slower to process the canMatch redirect.
				await userPage.waitForURL(
					(url: URL) =>
						!url.pathname.startsWith("/developer"),
					{ timeout: TIMEOUTS.navigation });

				// Verify not on developer area
				await expect(userPage)
					.not
					.toHaveURL(/\/developer/);
					});
			});

		unauthenticatedTest.describe("Unauthenticated Access",
			() =>
			{
				ROUTE_GROUPS.developerRoutes.forEach(
					(route) =>
					{
						unauthenticatedTest(
							`should redirect anonymous user to login from ${route}`,
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
				test(
					"should redirect developer base path to style-guide",
					async ({ developerPage }: { developerPage: Page; }) =>
					{
						await developerPage.goto("/developer");

						// Should redirect to default child route
						await expect(developerPage)
							.toHaveURL(/\/developer\/style-guide/);
					});
			});
	});