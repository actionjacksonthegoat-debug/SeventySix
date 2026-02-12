// <copyright file="altcha-forgot-password.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { test, expect } from "@playwright/test";
import { ROUTES } from "../../fixtures";

/**
 * E2E Tests for ALTCHA Proof-of-Work on Forgot Password Page
 *
 * Priority: P2 (Security Enhancement)
 * Tests that the ALTCHA widget renders and solves when ALTCHA is enabled.
 * Runs against the e2e-altcha Angular build (port 4202) where ALTCHA is active.
 */
test.describe("ALTCHA Forgot Password",
	() =>
	{
		test.beforeEach(
			async ({ page }) =>
			{
				await page.goto(ROUTES.auth.forgotPassword);
				await page.waitForLoadState("load");
			});

		test("should show ALTCHA widget on forgot password page",
			async ({ page }) =>
			{
				const altchaWidget =
					page.locator("altcha-widget");

				await expect(altchaWidget)
					.toBeVisible({ timeout: 10000 });
			});

		test("should solve ALTCHA challenge and enable forgot password submission",
			async ({ page }) =>
			{
				const altchaWidget =
					page.locator("altcha-widget");

				// Widget should be visible
				await expect(altchaWidget)
					.toBeVisible({ timeout: 10000 });

				// Wait for the widget to auto-solve the challenge
				// The widget transitions: unverified → verifying → verified
				await expect(altchaWidget)
					.toHaveAttribute(
						"data-state",
						"verified",
						{ timeout: 30000 });

				// After ALTCHA is verified, fill in email
				await page
					.getByLabel("Email Address")
					.fill("e2e_user@test.local");

				// Submit button should be enabled after ALTCHA verification
				const submitButton =
					page.locator("button[type='submit']");

				await expect(submitButton)
					.toBeEnabled();
			});
	});
