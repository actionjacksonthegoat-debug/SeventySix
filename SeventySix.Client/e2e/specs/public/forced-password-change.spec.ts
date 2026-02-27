// <copyright file="forced-password-change.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import {
	API_ROUTES,
	ChangePasswordPageHelper,
	E2E_CONFIG,
	expect,
	FORCE_PASSWORD_CHANGE_LIFECYCLE_USER,
	FORCE_PASSWORD_CHANGE_USER,
	loginAsUser,
	PAGE_TEXT,
	ROUTES,
	SELECTORS,
	TIMEOUTS,
	unauthenticatedTest
} from "@e2e-fixtures";
import type { Locator, Response as PlaywrightResponse } from "@playwright/test";

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
 * Uses `e2e_force_pw` user (read-only tests) and `e2e_force_pw_lifecycle` user
 * (password change lifecycle test) to prevent state interference.
 */
unauthenticatedTest.describe("Forced Password Change",
	() =>
	{
	/**
	 * Logs in with a forced password change user and waits for redirect
	 * to the change-password page.
	 *
	 * @param page
	 * The Playwright page instance.
	 * @param user
	 * The test user to log in with. Defaults to `FORCE_PASSWORD_CHANGE_USER`.
	 */
		async function loginAsForcedUser(
			page: import("@playwright/test").Page,
			user = FORCE_PASSWORD_CHANGE_USER): Promise<void>
		{
			await loginAsUser(
				page,
				user,
				{
					expectedUrl: /change-password/,
					timeout: TIMEOUTS.navigation
				});
		}

		unauthenticatedTest("should redirect to change password after login",
			async ({ unauthenticatedPage }) =>
			{
				await loginAsForcedUser(unauthenticatedPage);

				await expect(unauthenticatedPage)
					.toHaveURL(/change-password.*required=true/);
			});

		unauthenticatedTest("should show required password change notice",
			async ({ unauthenticatedPage }) =>
			{
				await loginAsForcedUser(unauthenticatedPage);

				const requiredNotice: Locator =
					unauthenticatedPage.locator(
						SELECTORS.changePassword.requiredNotice);

				await expect(requiredNotice)
					.toBeVisible();
				await expect(requiredNotice)
					.toHaveText(
						PAGE_TEXT.changePassword.requiredNotice);
			});

		unauthenticatedTest("should block navigation to account route via guard",
			async ({ unauthenticatedPage }) =>
			{
				await loginAsForcedUser(unauthenticatedPage);

				await unauthenticatedPage.goto(ROUTES.account.root);

				await expect(unauthenticatedPage)
					.toHaveURL(
						/change-password/,
						{ timeout: TIMEOUTS.auth });
			});

		unauthenticatedTest("should display change password form fields",
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

		unauthenticatedTest("should block navigation to admin route via guard",
			async ({ unauthenticatedPage }) =>
			{
				await loginAsForcedUser(unauthenticatedPage);

				await unauthenticatedPage.goto(ROUTES.admin.dashboard);

				await expect(unauthenticatedPage)
					.toHaveURL(
						/change-password/,
						{ timeout: TIMEOUTS.auth });
			});

		unauthenticatedTest("should block navigation to developer route via guard",
			async ({ unauthenticatedPage }) =>
			{
				await loginAsForcedUser(unauthenticatedPage);

				await unauthenticatedPage.goto(ROUTES.developer.styleGuide);

				await expect(unauthenticatedPage)
					.toHaveURL(
						/change-password/,
						{ timeout: TIMEOUTS.auth });
			});

		unauthenticatedTest(
			"should receive 403 from protected API while password change pending",
			async ({ unauthenticatedPage }) =>
			{
			// Capture access token from login API response.
			// Filter must match the API URL specifically to avoid
			// catching the page navigation HTML response.
				const loginResponsePromise: Promise<PlaywrightResponse> =
					unauthenticatedPage.waitForResponse(
						(response) =>
							response
								.url()
								.includes(API_ROUTES.auth.login)
								&& response.status() === 200);

				await loginAsForcedUser(unauthenticatedPage);

				const loginResponse: PlaywrightResponse =
					await loginResponsePromise;
				const responseBody: unknown =
					await loginResponse.json();
				const capturedToken: string =
					responseBody.accessToken;

				// Make API request to a protected endpoint via the nginx /api/ proxy.
				// Uses the client base URL so the request is same-origin, avoiding
				// CSP connect-src restrictions that block cross-origin fetches.
				const apiUrl: string =
					`${E2E_CONFIG.clientBaseUrl}${API_ROUTES.auth.trustedDevices}`;

				const apiStatus: number =
					await unauthenticatedPage.evaluate(
						async ({ token, url }: { token: string; url: string; }) =>
						{
							const response: Response =
								await fetch(
									url,
									{
										headers: {
											Authorization: `Bearer ${token}`
										}
									});

							return response.status;
						},
						{ token: capturedToken, url: apiUrl });

				expect(apiStatus)
					.toBe(403);
			});

		// Uses a dedicated lifecycle user so password changes
		// cannot interfere with the read-only tests above.
		unauthenticatedTest(
			"should complete forced password change and login with new password",
			async ({ unauthenticatedPage }) =>
			{
				const originalPassword: string =
					FORCE_PASSWORD_CHANGE_LIFECYCLE_USER.password;
				const newPassword: string = "E2E_ForcePw_Changed_456!";

				const changePasswordPage: ChangePasswordPageHelper =
					new ChangePasswordPageHelper(unauthenticatedPage);

				// Step 1: Login — redirected to change-password
				await loginAsForcedUser(
					unauthenticatedPage,
					FORCE_PASSWORD_CHANGE_LIFECYCLE_USER);

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
					{ ...FORCE_PASSWORD_CHANGE_LIFECYCLE_USER, password: newPassword });
			});
	});