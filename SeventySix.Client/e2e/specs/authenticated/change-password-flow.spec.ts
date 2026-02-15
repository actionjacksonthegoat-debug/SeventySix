// <copyright file="change-password-flow.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import {
	unauthenticatedTest as test,
	expect,
	PASSWORD_CHANGE_USER,
	SELECTORS,
	ROUTES,
	TIMEOUTS,
	loginAsUser,
	ChangePasswordPageHelper
} from "../../fixtures";

/**
 * E2E Tests for Change Password Execution Flow
 *
 * Priority: P1 (Authenticated User Security Flow)
 * Tests the full password change lifecycle:
 * - Error handling for wrong current password
 * - Successful password change with redirect to login
 * - Login with new password verification
 *
 * Uses `e2e_pw_change` user dedicated for password change tests.
 * Uses `unauthenticatedTest` to control login flow manually.
 */
test.describe("Change Password Flow",
	() =>
	{
		// Serial mode: tests share PASSWORD_CHANGE_USER and test 2 mutates the password.
		// Without serial, Playwright may run them in parallel causing state conflicts.
		test.describe.configure({ mode: "serial" });

		const originalPassword: string =
			PASSWORD_CHANGE_USER.password;
		const newPassword: string =
			"E2E_NewPw_Changed_456!";

		/**
		 * Logs in as PASSWORD_CHANGE_USER and navigates to password change page.
		 *
		 * @param page
		 * The Playwright page instance.
		 *
		 * @param password
		 * The password to use for login.
		 */
		async function loginAndNavigateToChangePassword(
			page: import("@playwright/test").Page,
			password: string): Promise<void>
		{
			await loginAsUser(
				page,
				{ ...PASSWORD_CHANGE_USER, password });

			await page.goto(ROUTES.auth.changePassword);
			await page.waitForLoadState("load");
		}

		test("should show error for incorrect current password",
			async ({ unauthenticatedPage }) =>
			{
				await loginAndNavigateToChangePassword(
					unauthenticatedPage,
					originalPassword);

				const changePasswordPage =
					new ChangePasswordPageHelper(unauthenticatedPage);

				await changePasswordPage.fillAndSubmit(
					"WrongCurrentPassword_123!",
					newPassword);

				const snackbar =
					unauthenticatedPage.locator(
						SELECTORS.notification.snackbar);

				await expect(snackbar)
					.toBeVisible({ timeout: TIMEOUTS.api });

				// Should remain on the change password page
				await expect(unauthenticatedPage)
					.toHaveURL(ROUTES.auth.changePassword);
			});

		test("should change password and allow login with new password",
			async ({ unauthenticatedPage }) =>
			{
				const changePasswordPage =
					new ChangePasswordPageHelper(unauthenticatedPage);

				// Step 1: Login with original password and change it
				await loginAndNavigateToChangePassword(
					unauthenticatedPage,
					originalPassword);

				await changePasswordPage.fillAndSubmit(
					originalPassword,
					newPassword);

				// Step 2: Should redirect to login after password change
				await expect(unauthenticatedPage)
					.toHaveURL(
						/login/,
						{ timeout: TIMEOUTS.auth });

				// Step 3: Login with new password
				await loginAsUser(
					unauthenticatedPage,
					{ ...PASSWORD_CHANGE_USER, password: newPassword });
			});
	});
