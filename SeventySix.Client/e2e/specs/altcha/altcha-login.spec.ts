import { test, expect } from "@playwright/test";
import { ROUTES } from "../../fixtures";

/**
 * E2E Tests for ALTCHA Proof-of-Work on Login Page
 *
 * Priority: P2 (Security Enhancement)
 * Tests that the ALTCHA widget renders and solves when ALTCHA is enabled.
 * Runs against the e2e-altcha Angular build on port 4202.
 */
test.describe("ALTCHA Login",
	() =>
	{
		test.beforeEach(
			async ({ page }) =>
			{
				await page.goto(ROUTES.auth.login);
				await page.waitForLoadState("load");
			});

		test("should show ALTCHA widget on login page",
			async ({ page }) =>
			{
				const altchaWidget =
					page.locator("altcha-widget");

				await expect(altchaWidget)
					.toBeVisible({ timeout: 10000 });
			});

		test("should solve ALTCHA challenge and enable login submission",
			async ({ page }) =>
			{
				const altchaWidget =
					page.locator("altcha-widget");

				// Widget should be visible
				await expect(altchaWidget)
					.toBeVisible({ timeout: 10000 });

				// Wait for the widget to auto-solve the challenge
				// The widget transitions through: unverified → verifying → verified
				await expect(altchaWidget)
					.toHaveAttribute(
						"data-state",
						"verified",
						{ timeout: 30000 });

				// After ALTCHA is verified, fill in credentials
				await page
					.getByLabel("Username or Email")
					.fill("e2e_user");
				await page
					.getByLabel("Password")
					.fill("E2E_User_Password_123!");

				// Submit button should be enabled after ALTCHA verification
				const submitButton =
					page.locator("button[type='submit']");

				await expect(submitButton)
					.toBeEnabled();
			});
	});
