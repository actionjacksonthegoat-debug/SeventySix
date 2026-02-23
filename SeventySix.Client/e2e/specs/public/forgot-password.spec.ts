import { Locator } from "@playwright/test";
import {
	test,
	expect,
	EmailTestHelper,
	getTestUserByRole,
	FORGOT_PASSWORD_USER,
	solveAltchaChallenge,
	SELECTORS,
	ROUTES,
	PAGE_TEXT,
	TIMEOUTS,
	E2E_CONFIG
} from "@e2e-fixtures";

/**
 * E2E Tests for Forgot Password Flow
 *
 * Priority: P1 (Core Flow)
 * Tests the password reset email flow:
 * - Page structure and accessibility
 * - Form validation
 * - Successful submission (always shows confirmation for security)
 * - Email delivery via MailDev
 * - Full end-to-end: request reset → MailDev → set password → login with new password → restore
 */
test.describe("Forgot Password Flow",
	() =>
	{
		test.beforeEach(
			async ({ page }) =>
			{
				await page.goto(ROUTES.auth.forgotPassword);
			});

		test.describe("Page Structure",
			() =>
			{
				test("should display forgot password heading",
					async ({ page }) =>
					{
						await expect(page.locator(SELECTORS.layout.pageHeading))
							.toHaveText(PAGE_TEXT.headings.forgotPassword);
					});

				test("should display description text",
					async ({ page }) =>
					{
						await expect(page.locator(SELECTORS.auth.description))
							.toContainText(PAGE_TEXT.descriptions.enterYourEmail);
					});

				test("should display email input field",
					async ({ page }) =>
					{
						const emailInput: Locator =
							page.locator(SELECTORS.form.emailInput);

						await expect(emailInput)
							.toBeVisible();
						await expect(emailInput)
							.toHaveAttribute("type", "email");
					});

				test("should display submit button",
					async ({ page }) =>
					{
						const submitButton: Locator =
							page.locator(SELECTORS.form.submitButton);

						await expect(submitButton)
							.toBeVisible();
						await expect(submitButton)
							.toContainText(PAGE_TEXT.buttons.sendResetLink);
					});

				test("should display back to sign in link",
					async ({ page }) =>
					{
						await expect(page.locator(SELECTORS.auth.signInLink))
							.toBeVisible();
					});

				test("should have accessible email label",
					async ({ page }) =>
					{
						await expect(page.getByLabel(PAGE_TEXT.labels.emailAddress))
							.toBeVisible();
					});

				test("should render ALTCHA widget",
					async ({ page }) =>
					{
						await expect(page.locator(SELECTORS.altcha.widget))
							.toBeVisible({ timeout: TIMEOUTS.api });
					});

				test("should solve ALTCHA challenge",
					async ({ page }) =>
					{
						await expect(page.locator(SELECTORS.altcha.widget))
							.toBeVisible({ timeout: TIMEOUTS.api });

						await solveAltchaChallenge(page);
					});
			});

		test.describe("Validation",
			() =>
			{
				test("should disable submit button when email is empty",
					async ({ page }) =>
					{
						const submitButton: Locator =
							page.locator(SELECTORS.form.submitButton);

						await expect(submitButton)
							.toBeDisabled();
					});

				test("should enable submit button when email is entered",
					async ({ page }) =>
					{
						const emailInput: Locator =
							page.locator(SELECTORS.form.emailInput);
						const submitButton: Locator =
							page.locator(SELECTORS.form.submitButton);

						await emailInput.fill("test@example.com");
						await solveAltchaChallenge(page);

						await expect(submitButton)
							.toBeEnabled();
					});

				test("should show error for invalid email format",
					async ({ page, authPage }) =>
					{
						// Use an email without @ which Angular's Validators.email rejects
						// Note: Angular considers 'user@' valid, so use 'invalid-email'
						await authPage.emailInput.fill("invalid-email");

						// Form should remain invalid, submit button should be disabled
						await expect(authPage.submitButton)
							.toBeDisabled();

						// Verify we're still on the same page
						await expect(page)
							.toHaveURL(ROUTES.auth.forgotPassword);
					});

				test("should require email field",
					async ({ page }) =>
					{
						const emailInput: Locator =
							page.locator(SELECTORS.form.emailInput);

						await expect(emailInput)
							.toHaveAttribute("required", "");
					});
			});

		test.describe("Successful Submission",
			() =>
			{
				test("should show confirmation after valid email submission",
					async ({ page, authPage }) =>
					{
						// Use test user email to test existing account
						const testUser =
							getTestUserByRole("User");

						await authPage.submitEmail(testUser.email);

						// Should show success state
						await expect(page.locator(SELECTORS.layout.pageHeading))
							.toHaveText(
								PAGE_TEXT.confirmation.checkYourEmail,
								{ timeout: TIMEOUTS.api });

						await expect(page.locator(SELECTORS.auth.successState))
							.toContainText(PAGE_TEXT.descriptions.passwordResetLink);
					});

				test("should show confirmation for non-existent email (security)",
					async ({ page, authPage }) =>
					{
						// Use email that definitely doesn't exist
						const nonExistentEmail =
							`nonexistent_${Date.now()}@example.com`;

						await authPage.submitEmail(nonExistentEmail);

						// Should still show success state (no email enumeration)
						await expect(page.locator(SELECTORS.layout.pageHeading))
							.toHaveText(
								PAGE_TEXT.confirmation.checkYourEmail,
								{ timeout: TIMEOUTS.api });
					});

				test("should provide return to sign in link after submission",
					async ({ page, authPage }) =>
					{
						const testUser =
							getTestUserByRole("User");

						await authPage.submitEmail(testUser.email);

						// Wait for success state
						await expect(page.locator(SELECTORS.layout.pageHeading))
							.toHaveText(
								PAGE_TEXT.confirmation.checkYourEmail,
								{ timeout: TIMEOUTS.api });

						// Should show return link
						await expect(authPage.signInLink)
							.toBeVisible();
						await expect(authPage.signInLink)
							.toContainText(PAGE_TEXT.links.returnToSignIn);
					});
			});

		test.describe("Loading State",
			() =>
			{
				test("should complete submission successfully",
					async ({ page, authPage }) =>
					{
						const testUser =
							getTestUserByRole("User");

						await authPage.submitEmail(testUser.email);

						// Verify success state is shown
						await expect(page.locator(SELECTORS.layout.pageHeading))
							.toHaveText(
								PAGE_TEXT.confirmation.checkYourEmail,
								{ timeout: TIMEOUTS.api });
					});
			});

		test.describe("Navigation",
			() =>
			{
				test("should navigate to login when clicking back link",
					async ({ page }) =>
					{
						await page.click(SELECTORS.auth.signInLink);

						await expect(page)
							.toHaveURL(ROUTES.auth.login);
					});
			});

		test.describe("Email Delivery (with MailDev)",
			() =>
			{
				test.beforeAll(
					async () =>
					{
						await EmailTestHelper.waitUntilReady(TIMEOUTS.email);
					});

				test(
					"should send password reset email for existing user",
					async ({ page, authPage }) =>
					{
						const testUser =
							getTestUserByRole("User");

						// Clear any existing emails
						await EmailTestHelper.clearAllEmails();

						// Submit password reset
						await authPage.submitEmail(testUser.email);

						// Wait for success state
						await expect(page.locator(SELECTORS.layout.pageHeading))
							.toHaveText(
								PAGE_TEXT.confirmation.checkYourEmail,
								{ timeout: TIMEOUTS.api });

						// Check MailDev for the email
						const resetEmail =
							await EmailTestHelper.waitForEmail(
								testUser.email,
								{ timeout: TIMEOUTS.email });

						expect(resetEmail)
							.toBeTruthy();
						expect(resetEmail.subject)
							.toContain(PAGE_TEXT.subjects.reset);
					});

				test("should not send email for non-existent user",
					async ({ page, authPage }) =>
					{
						const nonExistentEmail =
							`nonexistent_${Date.now()}@test.local`;

						// Clear any existing emails
						await EmailTestHelper.clearAllEmails();

						// Submit password reset for non-existent email
						await authPage.submitEmail(nonExistentEmail);

						// Wait for success state (always shown)
						await expect(page.locator(SELECTORS.layout.pageHeading))
							.toHaveText(
								PAGE_TEXT.confirmation.checkYourEmail,
								{ timeout: TIMEOUTS.api });

						// Attempt to get email with short timeout - should fail
						let emailFound =
							false;

						try
						{
							await EmailTestHelper.waitForEmail(
								nonExistentEmail,
								{ timeout: TIMEOUTS.negativeTest });
							emailFound =
								true;
						}
						catch
						{
							// Expected - no email should be sent
						}

						expect(emailFound)
							.toBeFalsy();
					});
			});

		test.describe("Full Password Reset End-to-End",
			() =>
			{
				test.beforeAll(
					async () =>
					{
						await EmailTestHelper.waitUntilReady(TIMEOUTS.email);
					});

				test("should complete full password reset via email link",
					async ({ page, authPage }) =>
					{
						// Use dedicated forgot-password user to avoid security
						// stamp conflicts with parallel tests.
						const testUser =
							FORGOT_PASSWORD_USER;
						const newPassword =
							"E2E_TempReset_Password_123!";

						// Clear emails for clean state
						await EmailTestHelper.clearAllEmails();

						// Step 1: Request password reset
						await page.goto(ROUTES.auth.forgotPassword);
						await authPage.submitEmail(testUser.email);

						await expect(page.locator(SELECTORS.layout.pageHeading))
							.toHaveText(
								PAGE_TEXT.confirmation.checkYourEmail,
								{ timeout: TIMEOUTS.api });

						// Step 2: Get reset email from MailDev
						const resetEmail =
							await EmailTestHelper.waitForEmail(
								testUser.email,
								{ timeout: TIMEOUTS.email });

						const resetLink: string | null =
							EmailTestHelper.extractLinkFromEmail(
								resetEmail,
								/href="([^"]*set-password[^"]*)"/);

						expect(resetLink)
							.toBeTruthy();

						// Step 3: Navigate to set-password via reset link
						const clientLink: string =
							resetLink!.replace(
								E2E_CONFIG.apiBaseUrl,
								E2E_CONFIG.clientBaseUrl);

						await page.goto(clientLink);

						// Step 4: Set new password
						await expect(page.locator(SELECTORS.layout.pageHeading))
							.toHaveText(
								PAGE_TEXT.headings.setNewPassword,
								{ timeout: TIMEOUTS.navigation });

						const newPasswordInput =
							page.locator(SELECTORS.setPassword.newPasswordInput);
						const confirmPasswordInput =
							page.locator(SELECTORS.setPassword.confirmPasswordInput);

						await newPasswordInput.waitFor(
							{ state: "visible", timeout: TIMEOUTS.element });

						await newPasswordInput.fill(newPassword);
						await confirmPasswordInput.fill(newPassword);

						await page
							.locator(SELECTORS.form.submitButton)
							.click();

						// Step 5: Should redirect to login after password set
						await page.waitForURL(
							(url) => url.pathname.includes(ROUTES.auth.login),
							{ timeout: TIMEOUTS.navigation });

						// Step 6: Login with new password
						await authPage.login(testUser.email, newPassword);

						await page.waitForURL(
							ROUTES.home,
							{ timeout: TIMEOUTS.navigation });

						await expect(page.locator(SELECTORS.layout.userMenuButton))
							.toBeVisible({ timeout: TIMEOUTS.element });
					});
			});
	});
