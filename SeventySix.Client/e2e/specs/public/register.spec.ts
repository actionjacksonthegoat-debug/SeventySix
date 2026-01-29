import { Locator } from "@playwright/test";
import {
	test,
	expect,
	EmailTestHelper,
	SELECTORS,
	ROUTES,
	PAGE_TEXT,
	TIMEOUTS
} from "../../fixtures";

/**
 * E2E Tests for Registration Flow
 *
 * Priority: P1 (Core Flow)
 * Tests the two-step registration flow:
 * 1. Email entry (register-email page)
 * 2. Complete registration (register-complete page - via email link)
 */
test.describe("Registration Flow",
	() =>
	{
		test.describe("Email Entry Page",
			() =>
			{
				test.beforeEach(
					async ({ page }) =>
					{
						await page.goto(ROUTES.auth.register);
					});

				test.describe("Page Structure",
					() =>
					{
						test("should display create account heading",
							async ({ page }) =>
							{
								await expect(page.locator(SELECTORS.layout.pageHeading))
									.toHaveText(PAGE_TEXT.headings.createAccount);
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

						test("should display continue button",
							async ({ page }) =>
							{
								const submitButton: Locator =
									page.locator(SELECTORS.form.submitButton);

								await expect(submitButton)
									.toBeVisible();
								await expect(submitButton)
									.toContainText(/Continue|Sending/);
							});

						test("should display sign in link",
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
									.toHaveURL(ROUTES.auth.register);
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
							// Use unique email to avoid conflicts
							const uniqueEmail =
								`e2e_register_${Date.now()}@test.local`;
								await authPage.submitEmail(uniqueEmail);

								// Should show success state
								await expect(page.locator(SELECTORS.layout.pageHeading))
									.toHaveText(
										PAGE_TEXT.confirmation.checkYourEmail,
										{ timeout: TIMEOUTS.api });

								await expect(page.locator(SELECTORS.auth.successState))
									.toContainText(PAGE_TEXT.descriptions.verificationLink);
							});

						test("should provide return to sign in link after submission",
							async ({ page, authPage }) =>
							{
								const uniqueEmail =
									`e2e_register_${Date.now()}@test.local`;

								await authPage.submitEmail(uniqueEmail);

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
							const uniqueEmail =
								`e2e_register_${Date.now()}@test.local`;
								await authPage.submitEmail(uniqueEmail);

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
						test("should navigate to login when clicking sign in link",
							async ({ page }) =>
							{
								await page.click(SELECTORS.auth.signInLink);

								await expect(page)
									.toHaveURL(ROUTES.auth.login);
							});
					});
			});

		test.describe("Email Verification (with MailDev)",
			() =>
			{
				test(
					"should send verification email when registering",
					async ({ page, authPage }) =>
					{
						const uniqueEmail =
							`e2e_verify_${Date.now()}@test.local`;

						// Clear any existing emails
						await EmailTestHelper.clearAllEmails();

						// Submit registration
						await page.goto(ROUTES.auth.register);
						await authPage.submitEmail(uniqueEmail);

						// Wait for success state
						await expect(page.locator(SELECTORS.layout.pageHeading))
							.toHaveText(
								PAGE_TEXT.confirmation.checkYourEmail,
								{ timeout: TIMEOUTS.api });

						// Check MailDev for the email
						const verificationEmail =
							await EmailTestHelper.waitForEmail(
								uniqueEmail,
								{ timeout: TIMEOUTS.email });

						expect(verificationEmail)
							.toBeTruthy();
						expect(verificationEmail.subject)
							.toContain(PAGE_TEXT.subjects.verify);
					});
			});
	});
