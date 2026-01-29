import { Locator } from "@playwright/test";
import {
	test,
	expect,
	EmailTestHelper,
	getTestUserByRole,
	SELECTORS,
	ROUTES,
	PAGE_TEXT,
	TIMEOUTS
} from "../../fixtures";

/**
 * E2E Tests for Forgot Password Flow
 *
 * Priority: P1 (Core Flow)
 * Tests the password reset email flow:
 * - Page structure and accessibility
 * - Form validation
 * - Successful submission (always shows confirmation for security)
 * - Email delivery via MailDev
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
	});
