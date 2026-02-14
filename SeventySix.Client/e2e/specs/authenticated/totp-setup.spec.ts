// <copyright file="totp-setup.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import {
	test,
	expect,
	unauthenticatedTest,
	solveAltchaChallenge,
	TOTP_ENROLL_USER,
	generateTotpCodeFromSecret,
	disableTotpViaApi,
	SELECTORS,
	ROUTES,
	PAGE_TEXT,
	TIMEOUTS
} from "../../fixtures";

/**
 * E2E Tests for TOTP Setup Page
 *
 * Priority: P1 (Authenticator Enrollment)
 * Tests the TOTP authenticator setup flow:
 * - QR code and secret key display
 * - Manual entry toggle
 * - Verification step
 * - Full enrollment end-to-end with cleanup
 */
test.describe("TOTP Setup",
	() =>
	{
		// Docker API calls can be slow
		test.slow();

		test.beforeEach(
			async ({ userPage }) =>
			{
				// Navigate to TOTP setup and wait for the scan step heading.
				// Retries once on failure because parallel E2E tests may cause
				// a server-side concurrency conflict when modifying the same user.
				const maxAttempts = 2;

				for (let attempt = 1; attempt <= maxAttempts; attempt++)
				{
					await userPage.goto(ROUTES.auth.totpSetup);
					await userPage.waitForLoadState("load");

					try
					{
						await expect(userPage.locator(SELECTORS.layout.pageHeading))
							.toHaveText(
								PAGE_TEXT.headings.setUpAuthenticatorApp,
								{ timeout: TIMEOUTS.globalSetup });
						return; // Success — exit beforeEach
					}
					catch (error)
					{
						if (attempt === maxAttempts)
						{
							throw error;
						}
						// Retry — parallel tests may have caused a row version conflict
					}
				}
			});

		test("should display QR code",
			async ({ userPage }) =>
			{
				const qrCode =
					userPage.locator(SELECTORS.totpSetup.qrCodeImage);

				await expect(qrCode)
					.toBeVisible({ timeout: TIMEOUTS.navigation });

				// Verify the QR code src is populated (data URL)
				await expect(qrCode)
					.toHaveAttribute("src", /^data:image/, { timeout: TIMEOUTS.api });
			});

		test("should toggle to manual entry and show secret",
			async ({ userPage }) =>
			{
				const manualEntryButton =
					userPage.locator(SELECTORS.totpSetup.cantScanButton,
						{ hasText: PAGE_TEXT.buttons.cantScan });

				await manualEntryButton.click();

				await expect(userPage
					.locator(SELECTORS.totpSetup.secretCode))
					.toBeVisible();
			});

		test("should proceed to verify step",
			async ({ userPage }) =>
			{
				const scannedButton =
					userPage.locator("button",
						{ hasText: PAGE_TEXT.buttons.scannedCode });

				await scannedButton.click();

				await expect(userPage.locator(SELECTORS.layout.pageHeading))
					.toHaveText(
						PAGE_TEXT.headings.verifySetup,
						{ timeout: TIMEOUTS.navigation });

				await expect(userPage
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
		unauthenticatedTest.slow();

		unauthenticatedTest("should complete TOTP enrollment with valid code",
			async ({ unauthenticatedPage }) =>
			{
				const testUser =
					TOTP_ENROLL_USER;

				// Step 0: Login as the dedicated enrollment user
				await unauthenticatedPage.goto(ROUTES.auth.login);
				await unauthenticatedPage
					.locator(SELECTORS.form.usernameInput)
					.waitFor({ state: "visible", timeout: TIMEOUTS.globalSetup });
				await unauthenticatedPage
					.locator(SELECTORS.form.usernameInput)
					.fill(testUser.username);
				await unauthenticatedPage
					.locator(SELECTORS.form.passwordInput)
					.fill(testUser.password);

				await solveAltchaChallenge(unauthenticatedPage);

				await unauthenticatedPage
					.locator(SELECTORS.form.submitButton)
					.click();
				await unauthenticatedPage.waitForURL(
					ROUTES.home,
					{ timeout: TIMEOUTS.globalSetup });

				// Navigate to TOTP setup
				await unauthenticatedPage.goto(ROUTES.auth.totpSetup);
				await unauthenticatedPage.waitForLoadState("load");

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
					generateTotpCodeFromSecret(secret);

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
