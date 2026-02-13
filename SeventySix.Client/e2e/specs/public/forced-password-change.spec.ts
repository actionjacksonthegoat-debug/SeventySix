// <copyright file="forced-password-change.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import {
	unauthenticatedTest as test,
	expect,
	FORCE_PASSWORD_CHANGE_USER,
	SELECTORS,
	ROUTES,
	PAGE_TEXT,
	TIMEOUTS,
	E2E_CONFIG,
	loginAsUser,
	ChangePasswordPageHelper
} from "../../fixtures";

/**
 * E2E Tests for Forced Password Change Flow
 *
 * Priority: P0 (Critical Security Flow)
 * Tests the forced password change enforcement:
 * - Login redirect when RequiresPasswordChange is true
 * - Required notice visibility
 * - Route guard blocking protected pages
 * - Complete password change lifecycle with cleanup
 * - Server 403 enforcement for protected API endpoints
 *
 * Uses `e2e_force_pw` user seeded with RequiresPasswordChange = true.
 */
test.describe("Forced Password Change",
	() =>
	{
		// Serial mode: the lifecycle test clears the RequiresPasswordChange flag
		// which would break parallel tests that depend on the flag being set.
		test.describe.configure({ mode: "serial" });

		/**
		 * Logs in with the forced password change user and waits for redirect
		 * to the change-password page.
		 *
		 * @param page
		 * The Playwright page instance.
		 */
		async function loginAsForcedUser(page: import("@playwright/test").Page): Promise<void>
		{
			await loginAsUser(
				page,
				FORCE_PASSWORD_CHANGE_USER,
				{
					expectedUrl: /change-password/,
					timeout: TIMEOUTS.navigation
				});
		}

		test("should redirect to change password after login",
			async ({ unauthenticatedPage }) =>
			{
				await loginAsForcedUser(unauthenticatedPage);

				await expect(unauthenticatedPage)
					.toHaveURL(/change-password.*required=true/);
			});

		test("should show required password change notice",
			async ({ unauthenticatedPage }) =>
			{
				await loginAsForcedUser(unauthenticatedPage);

				const requiredNotice =
					unauthenticatedPage.locator(
						SELECTORS.changePassword.requiredNotice);

				await expect(requiredNotice)
					.toBeVisible();
				await expect(requiredNotice)
					.toHaveText(
						PAGE_TEXT.changePassword.requiredNotice);
			});

		test("should block navigation to account route via guard",
			async ({ unauthenticatedPage }) =>
			{
				await loginAsForcedUser(unauthenticatedPage);

				await unauthenticatedPage.goto(ROUTES.account.root);

				await expect(unauthenticatedPage)
					.toHaveURL(
						/change-password/,
						{ timeout: TIMEOUTS.auth });
			});

		test("should display change password form fields",
			async ({ unauthenticatedPage }) =>
			{
				await loginAsForcedUser(unauthenticatedPage);

				await expect(unauthenticatedPage
					.locator(SELECTORS.changePassword.currentPasswordInput))
					.toBeVisible();
				await expect(unauthenticatedPage
					.locator(SELECTORS.changePassword.newPasswordInput))
					.toBeVisible();
				await expect(unauthenticatedPage
					.locator(SELECTORS.changePassword.confirmPasswordInput))
					.toBeVisible();
				await expect(unauthenticatedPage
					.locator(SELECTORS.changePassword.submitButton))
					.toBeVisible();
			});

		test("should block navigation to admin route via guard",
			async ({ unauthenticatedPage }) =>
			{
				await loginAsForcedUser(unauthenticatedPage);

				await unauthenticatedPage.goto(ROUTES.admin.dashboard);

				await expect(unauthenticatedPage)
					.toHaveURL(
						/change-password/,
						{ timeout: TIMEOUTS.auth });
			});

		test("should block navigation to developer route via guard",
			async ({ unauthenticatedPage }) =>
			{
				await loginAsForcedUser(unauthenticatedPage);

				await unauthenticatedPage.goto(ROUTES.developer.styleGuide);

				await expect(unauthenticatedPage)
					.toHaveURL(
						/change-password/,
						{ timeout: TIMEOUTS.auth });
			});

		test("should receive 403 from protected API while password change pending",
			async ({ unauthenticatedPage }) =>
			{
				// Capture access token from login API response.
				// Filter must match the API URL specifically to avoid
				// catching the page navigation HTML response.
				const loginResponsePromise =
					unauthenticatedPage.waitForResponse(
						(response) =>
							response.url().includes("/api/v1/auth/login")
								&& response.status() === 200);

				await loginAsForcedUser(unauthenticatedPage);

				const loginResponse =
					await loginResponsePromise;
				const responseBody =
					await loginResponse.json();
				const capturedToken: string =
					responseBody.accessToken;

				// Make direct API request to a protected endpoint.
				// Must use absolute API URL since the E2E nginx serves
				// the client app and has no /api/ proxy.
				const apiUrl: string =
					`${E2E_CONFIG.apiBaseUrl}/api/v1/auth/trusted-devices`;

				const apiStatus: number =
					await unauthenticatedPage.evaluate(
						async ({ token, url }: { token: string; url: string }) =>
						{
							const response =
								await fetch(
									url,
									{
										headers:
										{
											Authorization: `Bearer ${token}`
										}
									});

							return response.status;
						},
						{ token: capturedToken, url: apiUrl });

				expect(apiStatus).toBe(403);
			});

		test("should complete forced password change and login with new password",
			async ({ unauthenticatedPage }) =>
			{
				const originalPassword: string =
					FORCE_PASSWORD_CHANGE_USER.password;
				const newPassword: string =
					"E2E_ForcePw_Changed_456!";

				const changePasswordPage =
					new ChangePasswordPageHelper(unauthenticatedPage);

				// Step 1: Login — redirected to change-password
				await loginAsForcedUser(unauthenticatedPage);

				// Step 2: Fill and submit the change password form
				await changePasswordPage.fillAndSubmit(
					originalPassword,
					newPassword);

				// Step 3: Should redirect to login after password change
				await expect(unauthenticatedPage)
					.toHaveURL(
						/login/,
						{ timeout: TIMEOUTS.auth });

				// Step 4: Login with new password — no forced change redirect
				await loginAsUser(
					unauthenticatedPage,
					{ ...FORCE_PASSWORD_CHANGE_USER, password: newPassword });

				// Step 5: Cleanup — change password back to original
				await unauthenticatedPage.goto(ROUTES.auth.changePassword);
				await unauthenticatedPage.waitForLoadState("load");

				await changePasswordPage.fillAndSubmit(
					newPassword,
					originalPassword);

				// Verify cleanup — redirected to login
				await expect(unauthenticatedPage)
					.toHaveURL(
						/login/,
						{ timeout: TIMEOUTS.auth });
			});
	});
