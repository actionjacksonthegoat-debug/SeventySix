import { Locator } from "@playwright/test";
import {
	test,
	expect,
	EmailTestHelper,
	solveAltchaChallenge,
	SELECTORS,
	ROUTES,
	PAGE_TEXT,
	TIMEOUTS,
	E2E_CONFIG
} from "../../fixtures";

/**
 * E2E Tests for Registration Flow
 *
 * Priority: P0 (Core Flow)
 * Tests the two-step registration flow:
 * 1. Email entry (register-email page)
 * 2. Complete registration (register-complete page - via email link)
 * 3. Full end-to-end: email → MailDev → complete → authenticated
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

		test.describe("Full Registration End-to-End",
			() =>
			{
				test.beforeAll(
					async () =>
					{
						await EmailTestHelper.waitUntilReady(TIMEOUTS.email);
					});

				test("should complete full registration via email verification link",
					async ({ page, authPage }) =>
					{
						const timestamp: number =
							Date.now();
						const uniqueEmail =
							`e2e_fullreg_${timestamp}@test.local`;
						const username =
							`e2e_fullreg_${timestamp}`;
						const password =
							"E2E_FullReg_Password_123!";

						// Clear emails for clean state
						await EmailTestHelper.clearAllEmails();

						// Step 1: Submit email on register page
						await page.goto(ROUTES.auth.register);
						await authPage.submitEmail(uniqueEmail);

						// Wait for confirmation
						await expect(page.locator(SELECTORS.layout.pageHeading))
							.toHaveText(
								PAGE_TEXT.confirmation.checkYourEmail,
								{ timeout: TIMEOUTS.api });

						// Step 2: Get verification email from MailDev
						const verificationEmail =
							await EmailTestHelper.waitForEmail(
								uniqueEmail,
								{ timeout: TIMEOUTS.email });

						const verificationLink: string | null =
							EmailTestHelper.extractLinkFromEmail(
								verificationEmail,
								/href="([^"]*register\/complete[^"]*)"/);

						expect(verificationLink)
							.toBeTruthy();

						// Step 3: Navigate to register-complete via verification link
						// Replace the API base URL with the client base URL for navigation
						const clientLink: string =
							verificationLink!.replace(
								E2E_CONFIG.apiBaseUrl,
								E2E_CONFIG.clientBaseUrl);

						await page.goto(clientLink);
						await page.waitForLoadState("load");

						// Step 4: Fill in registration form
						await page
							.locator(SELECTORS.registerComplete.usernameInput)
							.fill(username);
						await page
							.locator(SELECTORS.registerComplete.passwordInput)
							.fill(password);
						await page
							.locator(SELECTORS.registerComplete.confirmPasswordInput)
							.fill(password);

						// Step 5: Submit registration
						await page
							.locator(SELECTORS.registerComplete.submitButton)
							.click();

						// Step 6: Should redirect to login or home after completion
						await page.waitForURL(
							(url) =>
								url.pathname === ROUTES.home
								|| url.pathname === ROUTES.auth.login,
							{ timeout: TIMEOUTS.navigation });
					});
			});

		test.describe("Password Policy Enforcement",
			() =>
			{
				test("should reject weak password on registration completion",
					async ({ page }) =>
					{
						// Navigate to register-complete with a token (token is validated on submit)
						await page.goto(
							`${ROUTES.auth.registerComplete}?token=test-token-value&email=policy_test@test.local`);
						await page.waitForLoadState("load");

						const usernameInput =
							page.locator(SELECTORS.registerComplete.usernameInput);
						const passwordInput =
							page.locator(SELECTORS.registerComplete.passwordInput);
						const confirmPasswordInput =
							page.locator(SELECTORS.registerComplete.confirmPasswordInput);
						const submitButton =
							page.locator(SELECTORS.registerComplete.submitButton);

						// Fill valid username
						await usernameInput.fill("policy_test_user");

						// Try a password that's too short (< 8 chars)
						await passwordInput.fill("Abc1!");
						await confirmPasswordInput.fill("Abc1!");

						// Submit should remain disabled — client-side validation prevents submission
						await expect(submitButton)
							.toBeDisabled();
					});

				test("should disable submit when username is too short",
					async ({ page }) =>
					{
						await page.goto(
							`${ROUTES.auth.registerComplete}?token=test-token-value&email=policy_test@test.local`);
						await page.waitForLoadState("load");

						await page
							.locator(SELECTORS.registerComplete.usernameInput)
							.fill("ab");

						await page
							.locator(SELECTORS.registerComplete.passwordInput)
							.fill("V@lid_P4ssw0rd!");
						await page
							.locator(SELECTORS.registerComplete.confirmPasswordInput)
							.fill("V@lid_P4ssw0rd!");

						await expect(page.locator(SELECTORS.registerComplete.submitButton))
							.toBeDisabled();
					});

				test("should accept password meeting all policy requirements",
					async ({ page }) =>
					{
						await page.goto(
							`${ROUTES.auth.registerComplete}?token=test-token-value&email=policy_test@test.local`);
						await page.waitForLoadState("load");

						await page
							.locator(SELECTORS.registerComplete.usernameInput)
							.fill("policy_test_user");

						// Strong password: uppercase, lowercase, digit, special char, 8+ chars
						await page
							.locator(SELECTORS.registerComplete.passwordInput)
							.fill("StrongP@ss123!");
						await page
							.locator(SELECTORS.registerComplete.confirmPasswordInput)
							.fill("StrongP@ss123!");

						// Submit should be enabled with a valid policy-compliant password
						await expect(page.locator(SELECTORS.registerComplete.submitButton))
							.toBeEnabled();
					});
			});
	});
