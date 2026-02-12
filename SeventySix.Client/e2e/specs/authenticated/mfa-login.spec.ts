// <copyright file="mfa-login.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { Page } from "@playwright/test";
import {
	unauthenticatedTest,
	expect,
	SELECTORS,
	ROUTES,
	PAGE_TEXT,
	TIMEOUTS,
	getTestUserByRole,
	generateTotpCode,
	MFA_BACKUP_CODES
} from "../../fixtures";
import type { TestUser } from "../../fixtures";

const mfaUser: TestUser =
	getTestUserByRole("MfaUser");

/**
 * E2E Tests for MFA Login Flow
 *
 * Priority: P0 (Critical Security Path)
 * Tests the MFA verification flow for users with MFA enabled:
 * - Redirect to MFA verify page after login
 * - Valid TOTP code completes authentication
 * - Invalid code shows error
 * - Backup code authentication
 * - Trust device checkbox
 */
unauthenticatedTest.describe("MFA Login",
	() =>
	{
		/**
		 * Logs in the MFA user and waits for the MFA verify page.
		 * @param page
		 * The Playwright page.
		 */
		async function loginAsMfaUser(page: Page): Promise<void>
		{
			await page.goto(ROUTES.auth.login);
			await page
				.locator(SELECTORS.form.usernameInput)
				.waitFor({ state: "visible", timeout: TIMEOUTS.globalSetup });

			await page
				.locator(SELECTORS.form.usernameInput)
				.fill(mfaUser.username);
			await page
				.locator(SELECTORS.form.passwordInput)
				.fill(mfaUser.password);
			await page
				.locator(SELECTORS.form.submitButton)
				.click();

			await page.waitForURL(
				`**${ROUTES.auth.mfaVerify}**`,
				{ timeout: TIMEOUTS.navigation });

			// Wait for MFA verify component to fully render
			await page.locator("h1")
				.waitFor({ state: "visible", timeout: TIMEOUTS.element });
		}

		unauthenticatedTest("should redirect to MFA verify page after login",
			async ({ unauthenticatedPage }) =>
			{
				await loginAsMfaUser(unauthenticatedPage);

				await expect(unauthenticatedPage)
					.toHaveURL(new RegExp(ROUTES.auth.mfaVerify.replace(/\//g, "\\/")));

				await expect(unauthenticatedPage.locator("h1"))
					.toBeVisible();
			});

		unauthenticatedTest("should complete login with valid TOTP code",
			async ({ unauthenticatedPage }) =>
			{
				await loginAsMfaUser(unauthenticatedPage);

				const totpCode: string =
					generateTotpCode();

				await unauthenticatedPage
					.locator(SELECTORS.mfaVerify.codeInput)
					.fill(totpCode);
				await unauthenticatedPage
					.locator(SELECTORS.form.submitButton)
					.click();

				await unauthenticatedPage.waitForURL(
					ROUTES.home,
					{ timeout: TIMEOUTS.navigation });

				await expect(unauthenticatedPage
					.locator(SELECTORS.layout.userMenuButton))
					.toBeVisible({ timeout: TIMEOUTS.auth });
			});

		unauthenticatedTest("should show error for invalid TOTP code",
			async ({ unauthenticatedPage }) =>
			{
				await loginAsMfaUser(unauthenticatedPage);

				await unauthenticatedPage
					.locator(SELECTORS.mfaVerify.codeInput)
					.fill("000000");
				await unauthenticatedPage
					.locator(SELECTORS.form.submitButton)
					.click();

				// Should remain on MFA verify page
				await expect(unauthenticatedPage)
					.toHaveURL(new RegExp(ROUTES.auth.mfaVerify.replace(/\//g, "\\/")));
			});

		unauthenticatedTest("should login with backup code",
			async ({ unauthenticatedPage }) =>
			{
				await loginAsMfaUser(unauthenticatedPage);

				// Switch to backup code mode
				await unauthenticatedPage
					.locator(SELECTORS.mfaVerify.useBackupCodeButton)
					.click();

				await expect(unauthenticatedPage.locator("h1"))
					.toHaveText(PAGE_TEXT.headings.useBackupCode);

				// Enter a known backup code
				await unauthenticatedPage
					.locator(SELECTORS.mfaVerify.codeInput)
					.fill(MFA_BACKUP_CODES[0]);
				await unauthenticatedPage
					.locator(SELECTORS.form.submitButton)
					.click();

				await unauthenticatedPage.waitForURL(
					ROUTES.home,
					{ timeout: TIMEOUTS.navigation });

				await expect(unauthenticatedPage
					.locator(SELECTORS.layout.userMenuButton))
					.toBeVisible({ timeout: TIMEOUTS.auth });
			});

		unauthenticatedTest("should display trust device checkbox",
			async ({ unauthenticatedPage }) =>
			{
				await loginAsMfaUser(unauthenticatedPage);

				await expect(unauthenticatedPage
					.locator(SELECTORS.mfaVerify.trustDeviceCheckbox))
					.toBeVisible();
			});

		unauthenticatedTest("should navigate back to login",
			async ({ unauthenticatedPage }) =>
			{
				await loginAsMfaUser(unauthenticatedPage);

				await unauthenticatedPage
					.locator(SELECTORS.mfaVerify.backToLoginButton)
					.click();

				await unauthenticatedPage.waitForURL(
					`**${ROUTES.auth.login}**`,
					{ timeout: TIMEOUTS.navigation });

				await expect(unauthenticatedPage)
					.toHaveURL(new RegExp(ROUTES.auth.login.replace(/\//g, "\\/")));
			});

		unauthenticatedTest("should bypass MFA on subsequent login when trust device is checked",
			async ({ unauthenticatedPage }) =>
			{
				// Step 1: Login and complete MFA with "Trust Device" checked
				await loginAsMfaUser(unauthenticatedPage);

				// Check trust device (mat-checkbox requires click, not check)
				await unauthenticatedPage
					.locator(SELECTORS.mfaVerify.trustDeviceCheckbox)
					.click();

				// Enter valid TOTP code
				const totpCode: string =
					generateTotpCode();

				await unauthenticatedPage
					.locator(SELECTORS.mfaVerify.codeInput)
					.fill(totpCode);
				await unauthenticatedPage
					.locator(SELECTORS.form.submitButton)
					.click();

				// Wait for successful login
				await unauthenticatedPage.waitForURL(
					ROUTES.home,
					{ timeout: TIMEOUTS.navigation });

				await expect(unauthenticatedPage
					.locator(SELECTORS.layout.userMenuButton))
					.toBeVisible({ timeout: TIMEOUTS.auth });

				// Step 2: Logout
				await unauthenticatedPage
					.locator(SELECTORS.layout.userMenuButton)
					.click();
				await unauthenticatedPage
					.locator(SELECTORS.layout.logoutButton)
					.click();

				await expect(unauthenticatedPage
					.locator(SELECTORS.layout.userMenuButton))
					.toBeHidden({ timeout: TIMEOUTS.navigation });

				// Step 3: Login again — MFA should be bypassed due to trusted device
				await unauthenticatedPage.goto(ROUTES.auth.login);
				await unauthenticatedPage
					.locator(SELECTORS.form.usernameInput)
					.waitFor({ state: "visible", timeout: TIMEOUTS.globalSetup });

				await unauthenticatedPage
					.locator(SELECTORS.form.usernameInput)
					.fill(mfaUser.username);
				await unauthenticatedPage
					.locator(SELECTORS.form.passwordInput)
					.fill(mfaUser.password);
				await unauthenticatedPage
					.locator(SELECTORS.form.submitButton)
					.click();

				// Should go directly to home (no MFA verify page)
				await unauthenticatedPage.waitForURL(
					ROUTES.home,
					{ timeout: TIMEOUTS.navigation });

				await expect(unauthenticatedPage
					.locator(SELECTORS.layout.userMenuButton))
					.toBeVisible({ timeout: TIMEOUTS.auth });
			});
	});
