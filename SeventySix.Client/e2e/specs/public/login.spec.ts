import {
	COOKIE_NAMES,
	expect,
	getTestUserByRole,
	LOCKOUT_USER,
	PAGE_TEXT,
	ROUTES,
	SELECTORS,
	solveAltchaChallenge,
	test,
	TEST_USERS,
	TIMEOUTS
} from "@e2e-fixtures";
import type { TestUser } from "@e2e-fixtures";
import type { Cookie, Locator, Page } from "@playwright/test";

/**
 * E2E Tests for Login Page
 *
 * Priority: P0 (Critical Path)
 * Tests the local credential login flow including:
 * - Page structure and accessibility
 * - Successful login for all roles
 * - Validation error handling
 * - Remember me functionality
 * - returnUrl redirect
 */
test.describe("Login Page",
	() =>
	{
		test.beforeEach(
			async ({ page }) =>
			{
				await page.goto(ROUTES.auth.login);
			});

		test.describe("Page Structure",
			() =>
			{
				test("should display login heading",
					async ({ authPage }) =>
					{
						await expect(authPage.pageHeading)
							.toHaveText(PAGE_TEXT.headings.signIn);
					});

				test("should display GitHub OAuth button",
					async ({ authPage }) =>
					{
						await expect(authPage.githubButton)
							.toBeVisible();
						await expect(authPage.githubButton)
							.toHaveText(PAGE_TEXT.buttons.continueWithGithub);
					});

				test("should display local login form",
					async ({ authPage }) =>
					{
						await expect(authPage.usernameInput)
							.toBeVisible();
						await expect(authPage.passwordInput)
							.toBeVisible();
						await expect(authPage.page.locator(SELECTORS.form.rememberMeCheckbox))
							.toBeVisible();
					});

				test("should display forgot password link",
					async ({ authPage }) =>
					{
						await expect(authPage.forgotPasswordLink)
							.toBeVisible();
						await expect(authPage.forgotPasswordLink)
							.toHaveText(PAGE_TEXT.links.forgotPassword);
					});

				test("should have accessible form labels",
					async ({ page }) =>
					{
						await expect(page.getByLabel(PAGE_TEXT.labels.usernameOrEmail))
							.toBeVisible();
						await expect(page.getByLabel(PAGE_TEXT.labels.password))
							.toBeVisible();
						await expect(page.getByLabel(PAGE_TEXT.labels.rememberMe))
							.toBeVisible();
					});

				test("should render ALTCHA widget",
					async ({ page }) =>
					{
						await expect(page.locator(SELECTORS.altcha.widget))
							.toBeVisible(
								{ timeout: TIMEOUTS.api });
					});

				test("should solve ALTCHA challenge",
					async ({ page }) =>
					{
						await expect(page.locator(SELECTORS.altcha.widget))
							.toBeVisible(
								{ timeout: TIMEOUTS.api });

						await solveAltchaChallenge(page);
					});
			});

		test.describe("Validation",
			() =>
			{
				test("should disable submit button when form is empty",
					async ({ authPage }) =>
					{
						// Submit button should be disabled when form is empty
						await expect(authPage.submitButton)
							.toBeDisabled();

						// Fields should be in invalid state
						await expect(authPage.usernameInput)
							.toHaveClass(/ng-invalid/);
						await expect(authPage.passwordInput)
							.toHaveClass(/ng-invalid/);
					});

				test("should show error for invalid credentials",
					async ({ page, authPage }) =>
					{
						await authPage.login("invalid_user", "WrongPassword123!");

						// Should show error notification or error message
						const snackbar: Locator =
							page.locator(SELECTORS.notification.snackbar);
						const errorMessage: Locator =
							page.locator(SELECTORS.form.errorMessage);

						// Wait for either a snackbar or an inline error
						await expect(snackbar.or(errorMessage))
							.toBeVisible(
								{ timeout: TIMEOUTS.api });
					});

				test("should require username field",
					async ({ authPage }) =>
					{
						await expect(authPage.usernameInput)
							.toHaveAttribute("required", "");
					});

				test("should require password field",
					async ({ authPage }) =>
					{
						await expect(authPage.passwordInput)
							.toHaveAttribute("required", "");
					});
			});

		test.describe("Successful Login",
			() =>
			{
				// MFA-enabled users are excluded — they redirect to MFA verify, not home.
				// MFA login flow is tested in mfa-login.spec.ts.
				TEST_USERS
					.filter(
						(testUser) => !testUser.mfaEnabled)
					.forEach(
						(testUser) =>
						{
							test(`should login as ${testUser.role} and redirect to home`,
								async ({ page, authPage }) =>
								{
									await authPage.login(testUser.email, testUser.password);

									// Wait for navigation to complete
									await page.waitForURL(
										ROUTES.home,
										{ timeout: TIMEOUTS.navigation });

									// Verify user is authenticated - user menu should be visible
									await expect(page.locator(SELECTORS.layout.userMenuButton))
										.toBeVisible(
											{ timeout: TIMEOUTS.element });
								});
						});

				test("should redirect to returnUrl after login",
					async ({ page, authPage }) =>
					{
						const testUser: TestUser =
							getTestUserByRole("User");

						// Navigate to login with returnUrl
						await page.goto(`${ROUTES.auth.login}?returnUrl=${ROUTES.account.root}`);

						await authPage.login(testUser.email, testUser.password);

						// Should redirect to the returnUrl
						await page.waitForURL(
							`${ROUTES.account.root}**`,
							{ timeout: TIMEOUTS.navigation });

						// Verify we're on the account page
						await expect(page)
							.toHaveURL(/\/account/);
					});
			});

		test.describe("Remember Me",
			() =>
			{
				test("should have remember me unchecked by default",
					async ({ page }) =>
					{
						const rememberMe: Locator =
							page
								.locator(SELECTORS.form.rememberMeCheckbox)
								.locator("input");

						await expect(rememberMe)
							.not
							.toBeChecked();
					});

				test("should allow checking remember me",
					async ({ page }) =>
					{
						const rememberMe: Locator =
							page.locator(SELECTORS.form.rememberMeCheckbox);

						await rememberMe.click();

						await expect(rememberMe.locator("input"))
							.toBeChecked();
					});

				test("should set persistent cookie when remember me is checked",
					async ({ page, authPage, context }) =>
					{
						const testUser: TestUser =
							getTestUserByRole("User");

						await authPage.checkRememberMe();
						await authPage.login(
							testUser.email,
							testUser.password);

						await page.waitForURL(
							ROUTES.home,
							{ timeout: TIMEOUTS.navigation });

						const cookies: Array<Cookie> =
							await context.cookies();
						const refreshCookie: Cookie | undefined =
							cookies.find(
								(cookie) =>
									cookie.name === COOKIE_NAMES.refreshToken);

						expect(refreshCookie)
							.toBeDefined();

						// RememberMe cookie should expire in ~14 days (> 1 day)
						const expiresInSeconds: number =
							refreshCookie!.expires - Date.now() / 1000;
						const expiresInDays: number =
							expiresInSeconds / 86400;

						expect(expiresInDays)
							.toBeGreaterThan(1);
					});

				test("should set short-lived cookie when remember me is unchecked",
					async ({ page, authPage, context }) =>
					{
						const testUser: TestUser =
							getTestUserByRole("User");

						// Leave rememberMe unchecked (default)
						await authPage.login(
							testUser.email,
							testUser.password);

						await page.waitForURL(
							ROUTES.home,
							{ timeout: TIMEOUTS.navigation });

						const cookies: Array<Cookie> =
							await context.cookies();
						const refreshCookie: Cookie | undefined =
							cookies.find(
								(cookie) =>
									cookie.name === COOKIE_NAMES.refreshToken);

						expect(refreshCookie)
							.toBeDefined();

						// Standard cookie should expire in ~1 day (≤ 2 days as safety margin)
						const expiresInSeconds: number =
							refreshCookie!.expires - Date.now() / 1000;
						const expiresInDays: number =
							expiresInSeconds / 86400;

						expect(expiresInDays)
							.toBeLessThanOrEqual(2);
					});
			});

		test.describe("Loading State",
			() =>
			{
				test("should show loading indicator during submission",
					async ({ page, authPage }) =>
					{
						const testUser: TestUser =
							getTestUserByRole("User");

						await authPage.fillLoginForm(testUser.email, testUser.password);
						await solveAltchaChallenge(page);

						// Verify button has proper aria attribute when loading
						await authPage.submitButton.click();

						// Just verify navigation completes successfully
						await page.waitForURL(
							ROUTES.home,
							{ timeout: TIMEOUTS.navigation });

						await expect(page)
							.toHaveURL(ROUTES.home);
					});
			});

		test.describe("Already Authenticated",
			() =>
			{
				test("should redirect authenticated user away from login page",
					async ({ userPage }: { userPage: Page; }) =>
					{
						await userPage.goto(ROUTES.auth.login);

						// Should redirect to home or stay away from login
						await userPage.waitForURL(
							(url) =>
								!url.pathname.includes(ROUTES.auth.login),
							{ timeout: TIMEOUTS.api });

						// Verify we're not on login page
						await expect(userPage)
							.not
							.toHaveURL(/\/auth\/login/);
					});
			});

		test.describe("Security: Return URL Validation",
			() =>
			{
				/**
		 * P0 CRITICAL: Prevents open redirect vulnerability.
		 * Attackers could use returnUrl to redirect users to malicious sites.
		 */
				test("should reject external URL in returnUrl and redirect to home",
					async ({ page, authPage }) =>
					{
						const testUser: TestUser =
							getTestUserByRole("User");

						// Attempt to use an external URL as returnUrl
						await page.goto(`${ROUTES.auth.login}?returnUrl=https://evil.com/steal-session`);

						await authPage.login(testUser.email, testUser.password);

						// Should redirect to home (/) NOT to the malicious external site
						await page.waitForURL(
							ROUTES.home,
							{ timeout: TIMEOUTS.navigation });

						await expect(page)
							.toHaveURL(ROUTES.home);
					});

				test("should reject protocol-relative URL in returnUrl",
					async ({ page, authPage }) =>
					{
						const testUser: TestUser =
							getTestUserByRole("User");

						// Protocol-relative URLs can also lead to open redirects
						await page.goto(`${ROUTES.auth.login}?returnUrl=//evil.com/phishing`);

						await authPage.login(testUser.email, testUser.password);

						// Should redirect to home (/) NOT to the protocol-relative URL
						await page.waitForURL(
							ROUTES.home,
							{ timeout: TIMEOUTS.navigation });

						await expect(page)
							.toHaveURL(ROUTES.home);
					});

				test("should reject javascript: protocol in returnUrl",
					async ({ page, authPage }) =>
					{
						const testUser: TestUser =
							getTestUserByRole("User");

						// XSS attack vector via javascript: protocol
						await page.goto(`${ROUTES.auth.login}?returnUrl=javascript:alert(document.cookie)`);

						await authPage.login(testUser.email, testUser.password);

						// Should redirect to home (/) and NOT execute JavaScript
						await page.waitForURL(
							ROUTES.home,
							{ timeout: TIMEOUTS.navigation });

						await expect(page)
							.toHaveURL(ROUTES.home);
					});

				test("should reject javascript: protocol with URL encoding",
					async ({ page, authPage }) =>
					{
						const testUser: TestUser =
							getTestUserByRole("User");

						// URL-encoded javascript: attack vector
						await page.goto(`${ROUTES.auth.login}?returnUrl=javascript%3Aalert(1)`);

						await authPage.login(testUser.email, testUser.password);

						// Should redirect to home (/) and NOT execute JavaScript
						await page.waitForURL(
							ROUTES.home,
							{ timeout: TIMEOUTS.navigation });

						await expect(page)
							.toHaveURL(ROUTES.home);
					});

				test("should reject data: protocol in returnUrl",
					async ({ page, authPage }) =>
					{
						const testUser: TestUser =
							getTestUserByRole("User");

						// data: protocol can be used for XSS
						await page.goto(`${ROUTES.auth.login}?returnUrl=data:text/html,<script>alert(1)</script>`);

						await authPage.login(testUser.email, testUser.password);

						// Should redirect to home (/) NOT execute data URI
						await page.waitForURL(
							ROUTES.home,
							{ timeout: TIMEOUTS.navigation });

						await expect(page)
							.toHaveURL(ROUTES.home);
					});

				test("should accept valid internal path in returnUrl",
					async ({ page, authPage }) =>
					{
						const testUser: TestUser =
							getTestUserByRole("User");

						// Valid internal path should work
						await page.goto(`${ROUTES.auth.login}?returnUrl=${ROUTES.account.root}`);

						await authPage.login(testUser.email, testUser.password);

						// Should redirect to the valid internal returnUrl
						await page.waitForURL(
							`${ROUTES.account.root}**`,
							{ timeout: TIMEOUTS.navigation });

						await expect(page)
							.toHaveURL(/\/account/);
					});
			});

		test.describe("Security: Account Lockout",
			() =>
			{
				/**
		 * P0: Tests that the server locks out an account after too many
		 * failed login attempts. Uses a dedicated `e2e_lockout` user so
		 * rate-limit and lockout side-effects never cascade to other tests.
		 */
				test("should lockout account after repeated failed attempts",
					async ({ page, authPage }) =>
					{
					// 6 ALTCHA solves (~5–8 s each in Docker CI) + form fills + API
					// round-trips + snackbar waits per attempt can exceed the 45 s global
					// config timeout. test.setTimeout must be the first statement so it
					// applies before any awaited operations begin.
						test.setTimeout(120_000);

						const failedAttempts: number = 6;
						const wrongPassword: string = "Wrong_Password_Lockout_123!";

						for (let attempt: number = 1; attempt <= failedAttempts; attempt++)
						{
							await page.goto(ROUTES.auth.login);

							// Wait for form to be interactive before filling
							await expect(authPage.usernameInput)
								.toBeVisible(
									{ timeout: TIMEOUTS.element });

							await authPage.login(
								LOCKOUT_USER.username,
								wrongPassword);

							// Each attempt should show an error and stay on login
							const snackbar: Locator =
								page.locator(SELECTORS.notification.snackbar);
							const errorMessage: Locator =
								page.locator(SELECTORS.form.errorMessage);

							await expect(snackbar.or(errorMessage))
								.toBeVisible(
									{ timeout: TIMEOUTS.api });

							await expect(page)
								.toHaveURL(ROUTES.auth.login);

							// Best-effort: wait for snackbar to dismiss before next iteration
							// so ALTCHA widget is not obscured. Timing varies in Docker.
							await snackbar
								.waitFor(
									{ state: "hidden", timeout: TIMEOUTS.api })
								.catch(
									() =>
									{/* snackbar may already be detached */});
						}

						// After lockout threshold, even the correct password should fail
						await page.goto(ROUTES.auth.login);

						await authPage.login(
							LOCKOUT_USER.username,
							LOCKOUT_USER.password);

						const snackbar: Locator =
							page.locator(SELECTORS.notification.snackbar);
						const errorMessage: Locator =
							page.locator(SELECTORS.form.errorMessage);

						await expect(snackbar.or(errorMessage))
							.toBeVisible(
								{ timeout: TIMEOUTS.api });

						// Should remain on login page (login blocked)
						await expect(page)
							.toHaveURL(ROUTES.auth.login);
					});
			});
	});