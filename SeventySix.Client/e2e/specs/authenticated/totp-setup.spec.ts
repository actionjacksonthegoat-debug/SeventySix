// <copyright file="totp-setup.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import {
	test,
	expect,
	unauthenticatedTest,
	loginAsUser,
	TOTP_ENROLL_USER,
	TOTP_VIEWER_USER,
	generateSafeTotpCodeFromSecret,
	disableTotpViaApi,
	SELECTORS,
	ROUTES,
	PAGE_TEXT,
	TIMEOUTS
} from "@e2e-fixtures";
import type { Page } from "@playwright/test";

/**
 * E2E Tests for TOTP Setup Page
 *
 * Priority: P1 (Authenticator Enrollment)
 * Tests the TOTP authenticator setup flow:
 * - QR code and secret key display
 * - Manual entry toggle
 * - Verification step
 * - Full enrollment end-to-end with cleanup
 *
 * Uses a dedicated `e2e_totp_viewer` user so navigating to the setup page
 * (which creates pending TOTP state server-side) doesn't conflict with
 * the shared `e2e_user` in parallel.
 */
unauthenticatedTest.describe("TOTP Setup",
	() =>
	{
		// Run serially: all tests login as the same TOTP_VIEWER_USER and create
		// pending TOTP state server-side — parallel logins cause session races.
		unauthenticatedTest.describe.configure({ mode: "serial" });

		unauthenticatedTest.beforeEach(
			async ({ unauthenticatedPage }) =>
			{
				await loginAsUser(unauthenticatedPage, TOTP_VIEWER_USER);

				await unauthenticatedPage.goto(ROUTES.auth.totpSetup);

				await expect(unauthenticatedPage.locator(SELECTORS.layout.pageHeading))
					.toHaveText(
						PAGE_TEXT.headings.setUpAuthenticatorApp,
						{ timeout: TIMEOUTS.globalSetup });
			});

		unauthenticatedTest("should display QR code",
			async ({ unauthenticatedPage }: { unauthenticatedPage: Page }) =>
			{
				const qrCode =
					unauthenticatedPage.locator(SELECTORS.totpSetup.qrCodeImage);

				await expect(qrCode)
					.toBeVisible({ timeout: TIMEOUTS.navigation });

				// Verify the QR code src is populated (data URL)
				await expect(qrCode)
					.toHaveAttribute("src", /^data:image/, { timeout: TIMEOUTS.api });
			});

		unauthenticatedTest("should toggle to manual entry and show secret",
			async ({ unauthenticatedPage }: { unauthenticatedPage: Page }) =>
			{
				const manualEntryButton =
					unauthenticatedPage.locator(SELECTORS.totpSetup.cantScanButton,
						{ hasText: PAGE_TEXT.buttons.cantScan });

				await manualEntryButton.click();

				await expect(unauthenticatedPage
					.locator(SELECTORS.totpSetup.secretCode))
					.toBeVisible();
			});

		unauthenticatedTest("should proceed to verify step",
			async ({ unauthenticatedPage }: { unauthenticatedPage: Page }) =>
			{
				const scannedButton =
					unauthenticatedPage.locator("button",
						{ hasText: PAGE_TEXT.buttons.scannedCode });

				await scannedButton.click();

				await expect(unauthenticatedPage.locator(SELECTORS.layout.pageHeading))
					.toHaveText(
						PAGE_TEXT.headings.verifySetup,
						{ timeout: TIMEOUTS.navigation });

				await expect(unauthenticatedPage
					.locator(SELECTORS.totpSetup.verificationCodeInput))
					.toBeVisible();
			});
	});

/**
 * TOTP Enrollment — Isolated Test
 *
 * Uses a dedicated `e2e_totp_enroll` user via `unauthenticatedTest` so that
 * enabling/disabling TOTP never affects the shared `e2e_user` auth state.
 * Even if cleanup fails, no other test uses this user.
 */
unauthenticatedTest.describe("TOTP Enrollment",
	() =>
	{
		unauthenticatedTest("should complete TOTP enrollment with valid code",
			async ({ unauthenticatedPage }) =>
			{
				// Login + TOTP wizard (scan + verify) + API cleanup
				unauthenticatedTest.setTimeout(90_000);

				const testUser =
					TOTP_ENROLL_USER;

				// Step 0: Login as the dedicated enrollment user
				await loginAsUser(unauthenticatedPage, testUser);

				// Navigate to TOTP setup
				await unauthenticatedPage.goto(ROUTES.auth.totpSetup);

				await expect(unauthenticatedPage.locator(SELECTORS.layout.pageHeading))
					.toHaveText(
						PAGE_TEXT.headings.setUpAuthenticatorApp,
						{ timeout: TIMEOUTS.globalSetup });

				// Step 1: Toggle to manual entry to extract the secret
				const manualEntryButton =
					unauthenticatedPage.locator(SELECTORS.totpSetup.cantScanButton,
						{ hasText: PAGE_TEXT.buttons.cantScan });

				await manualEntryButton.click();

				const secretElement =
					unauthenticatedPage.locator(SELECTORS.totpSetup.secretCode);

				await expect(secretElement)
					.toBeVisible({ timeout: TIMEOUTS.api });

				const secret: string =
					(await secretElement.textContent())?.trim() ?? "";

				expect(secret.length)
					.toBeGreaterThan(0);

				// Step 2: Proceed to verify step
				const scannedButton =
					unauthenticatedPage.locator("button",
						{ hasText: PAGE_TEXT.buttons.scannedCode });

				await scannedButton.click();

				await expect(unauthenticatedPage.locator(SELECTORS.layout.pageHeading))
					.toHaveText(PAGE_TEXT.headings.verifySetup);

				// Step 3: Generate TOTP code from extracted secret and verify
				const enrollmentCode: string =
					await generateSafeTotpCodeFromSecret(secret);

				await unauthenticatedPage
					.locator(SELECTORS.totpSetup.verificationCodeInput)
					.fill(enrollmentCode);

				await unauthenticatedPage
					.locator("button",
						{ hasText: PAGE_TEXT.buttons.verifyAndEnable })
					.click();

				// Step 4: Should show success
				await expect(unauthenticatedPage.locator(SELECTORS.layout.pageHeading))
					.toHaveText(
						PAGE_TEXT.headings.authenticatorEnabled,
						{ timeout: TIMEOUTS.api });

				// Step 5: Best-effort cleanup — disable TOTP via API.
				await disableTotpViaApi(
					unauthenticatedPage,
					testUser,
					secret,
					enrollmentCode);
			});
	});
