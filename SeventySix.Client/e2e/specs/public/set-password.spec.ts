// <copyright file="set-password.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import {
	unauthenticatedTest,
	expect,
	SELECTORS,
	ROUTES,
	PAGE_TEXT,
	TIMEOUTS
} from "../../fixtures";

/**
 * E2E Tests for Set Password Page
 *
 * Priority: P1 (Password Reset Completion)
 * Tests the set-password page:
 * - Invalid/missing token shows error
 * - Password form fields and validation
 * Note: Full flow requires a valid email token; we test page structure
 * and the invalid-token error path.
 */
unauthenticatedTest.describe("Set Password",
	() =>
	{
		unauthenticatedTest("should show invalid link when no token provided",
			async ({ unauthenticatedPage }) =>
			{
				await unauthenticatedPage.goto(ROUTES.auth.setPassword);
				await unauthenticatedPage.waitForLoadState("load");

				await expect(unauthenticatedPage
					.locator(SELECTORS.setPassword.invalidLinkSection))
					.toBeVisible({ timeout: TIMEOUTS.element });

				await expect(unauthenticatedPage.locator(SELECTORS.layout.pageHeading))
					.toHaveText(PAGE_TEXT.headings.invalidLink);
			});

		unauthenticatedTest("should show return to login link on invalid token",
			async ({ unauthenticatedPage }) =>
			{
				await unauthenticatedPage.goto(ROUTES.auth.setPassword);
				await unauthenticatedPage.waitForLoadState("load");

				const returnLink =
					unauthenticatedPage.locator("a",
						{ hasText: PAGE_TEXT.links.returnToLogin });

				await expect(returnLink)
					.toBeVisible({ timeout: TIMEOUTS.element });
				await expect(returnLink)
					.toHaveAttribute("href", ROUTES.auth.login);
			});

		unauthenticatedTest("should show password form when token is present",
			async ({ unauthenticatedPage }) =>
			{
				await unauthenticatedPage.goto(
					`${ROUTES.auth.setPassword}?token=invalid-token-value&email=test@test.local`);
				await unauthenticatedPage.waitForLoadState("load");

				// When a token is present, the form is shown (token is validated server-side on submit)
				await expect(unauthenticatedPage
					.locator(SELECTORS.setPassword.newPasswordInput))
					.toBeVisible({ timeout: TIMEOUTS.element });
				await expect(unauthenticatedPage
					.locator(SELECTORS.setPassword.confirmPasswordInput))
					.toBeVisible({ timeout: TIMEOUTS.element });
			});

		unauthenticatedTest("should show error when submitting with expired or invalid token",
			async ({ unauthenticatedPage }) =>
			{
				// Navigate with a fabricated expired token
				await unauthenticatedPage.goto(
					`${ROUTES.auth.setPassword}?token=expired-fabricated-token-123&email=test@test.local`);
				await unauthenticatedPage.waitForLoadState("load");

				// Fill in valid password fields
				await unauthenticatedPage
					.locator(SELECTORS.setPassword.newPasswordInput)
					.fill("NewStrongP@ss123!");
				await unauthenticatedPage
					.locator(SELECTORS.setPassword.confirmPasswordInput)
					.fill("NewStrongP@ss123!");

				// Submit the form
				await unauthenticatedPage
					.locator(SELECTORS.form.submitButton)
					.click();

				// Server should reject the invalid token
				// The page should show the invalid link section or an error
				const invalidSection =
					unauthenticatedPage.locator(SELECTORS.setPassword.invalidLinkSection);
				const snackbar =
					unauthenticatedPage.locator(SELECTORS.notification.snackbar);
				const errorAlert =
					unauthenticatedPage.locator(SELECTORS.accessibility.alert);

				await expect(invalidSection.or(snackbar).or(errorAlert))
					.toBeVisible({ timeout: TIMEOUTS.api });
			});
	});
