import { test, expect } from "@playwright/test";
import { ROUTES } from "../../fixtures";

/**
 * E2E Tests for ALTCHA Proof-of-Work on Registration Page
 *
 * Priority: P2 (Security Enhancement)
 * Tests that the ALTCHA widget renders and solves when ALTCHA is enabled.
 * Runs against the e2e-altcha Angular build on port 4202.
 */
test.describe("ALTCHA Registration",
	() =>
	{
		test.beforeEach(
			async ({ page }) =>
			{
				await page.goto(ROUTES.auth.register);
				await page.waitForLoadState("load");
			});

		test("should show ALTCHA widget on registration page",
			async ({ page }) =>
			{
				const altchaWidget =
					page.locator("altcha-widget");

				await expect(altchaWidget)
					.toBeVisible({ timeout: 10000 });
			});

		test("should solve ALTCHA challenge and enable registration submission",
			async ({ page }) =>
			{
				const altchaWidget =
					page.locator("altcha-widget");

				// Widget should be visible
				await expect(altchaWidget)
					.toBeVisible({ timeout: 10000 });

				// Wait for the widget to auto-solve the challenge
				await expect(altchaWidget)
					.toHaveAttribute(
						"data-state",
						"verified",
						{ timeout: 30000 });

				// After ALTCHA is verified, fill in email
				await page
					.getByLabel("Email Address")
					.fill("altcha_test@example.com");

				// Submit button should be enabled after ALTCHA verification + email entry
				const submitButton =
					page.locator("button[type='submit']");

				await expect(submitButton)
					.toBeEnabled();
			});
	});
