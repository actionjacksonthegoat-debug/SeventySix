// <copyright file="change-password.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import {
	expect,
	PAGE_TEXT,
	ROUTES,
	SELECTORS,
	test
} from "@e2e-fixtures";
import type { Locator } from "@playwright/test";

/**
 * E2E Tests for Change Password Page
 *
 * Priority: P1 (Authenticated User Security Flow)
 * Tests the password change form:
 * - Page loads with correct form fields
 * - Validation for required fields and password requirements
 * Note: Read-only UI checks — uses `userPage` (stored auth state).
 * Actual password change execution is in `change-password-flow.spec.ts`.
 */
test.describe("Change Password",
	() =>
	{
		test.beforeEach(
			async ({ userPage }) =>
			{
				await userPage.goto(ROUTES.auth.changePassword);
			});

		test("should display change password heading",
			async ({ userPage }) =>
			{
				await expect(userPage.locator(SELECTORS.layout.pageHeading))
					.toHaveText(PAGE_TEXT.headings.changePassword);
			});

		test("should display password form fields",
			async ({ userPage }) =>
			{
				await expect(userPage
					.locator(SELECTORS.changePassword.currentPasswordInput))
					.toBeVisible();
				await expect(userPage
					.locator(SELECTORS.changePassword.newPasswordInput))
					.toBeVisible();
				await expect(userPage
					.locator(SELECTORS.changePassword.confirmPasswordInput))
					.toBeVisible();
			});

		test("should disable submit when form is empty",
			async ({ userPage }) =>
			{
				const submitButton: Locator =
					userPage.locator(SELECTORS.form.submitButton);

				await expect(submitButton)
					.toBeDisabled();
			});

		test("should show validation hint for new password",
			async ({ userPage }) =>
			{
				const passwordHint: Locator =
					userPage.locator(SELECTORS.changePassword.passwordHint);

				await expect(passwordHint)
					.toBeVisible();
				await expect(passwordHint)
					.toContainText(PAGE_TEXT.validation.minimumCharacters);
			});
	});