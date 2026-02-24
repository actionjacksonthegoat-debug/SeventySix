import {
	COOKIE_NAMES,
	expect,
	expectAccessible,
	loginAsUser,
	ROUTES,
	SELECTORS,
	test,
	TEST_USERS,
	TIMEOUTS
} from "@e2e-fixtures";
import type { Browser, BrowserContext, Locator, Page } from "@playwright/test";

/**
 * E2E Tests: Cookie Consent Banner
 *
 * Tests GDPR/CCPA cookie consent banner behaviour.
 * All tests in the main describe run in a fresh browser context with NO
 * pre-set cookies so the banner reliably appears on first visit.
 */
test.describe("Cookie Consent Banner",
	() =>
	{
	// Fresh context with no storage state — ensures no consent cookie pre-set
		test.use(
			{
				storageState: undefined
			});

		test("banner is visible on first visit with no consent cookie",
			async ({ page }) =>
			{
				await page.goto(ROUTES.auth.login);

				const banner: Locator =
					page.getByRole("region",
						{ name: "Cookie consent" });
				await expect(banner)
					.toBeVisible();
			});

		test("Accept All Cookies hides the banner and sets consent cookie",
			async ({ page }) =>
			{
				await page.goto(ROUTES.auth.login);

				const banner: Locator =
					page.getByRole("region",
						{ name: "Cookie consent" });
				await expect(banner)
					.toBeVisible();

				await page
					.getByRole("button",
						{ name: "Accept All Cookies" })
					.click();

				await expect(banner)
					.toBeHidden();

				const cookies: Array<{ name: string; }> =
					await page
						.context()
						.cookies();
				const consentCookie: { name: string; } | undefined =
					cookies.find((cookie) =>
						cookie.name === COOKIE_NAMES.cookieConsent);
				expect(consentCookie)
					.toBeDefined();
			});

		test("Reject Non-Essential hides the banner and sets consent cookie",
			async ({ page }) =>
			{
				await page.goto(ROUTES.auth.login);

				const banner: Locator =
					page.getByRole("region",
						{ name: "Cookie consent" });
				await expect(banner)
					.toBeVisible();

				await page
					.getByRole("button",
						{ name: "Reject Non-Essential" })
					.click();

				await expect(banner)
					.toBeHidden();

				const cookies: Array<{ name: string; value: string; }> =
					await page
						.context()
						.cookies();
				const consentCookie: { name: string; value: string; } | undefined =
					cookies.find((cookie) =>
						cookie.name === COOKIE_NAMES.cookieConsent);
				expect(consentCookie)
					.toBeDefined();
			});

		test("Cookie Settings button opens the preferences dialog",
			async ({ page }) =>
			{
				await page.goto(ROUTES.auth.login);

				await page
					.getByRole("button",
						{ name: "Cookie Settings" })
					.click();

				const dialog: Locator =
					page.getByRole("dialog",
						{ name: "Cookie Preferences" });
				await expect(dialog)
					.toBeVisible();
			});

		test("preferences dialog: Save My Choices closes dialog and sets cookie",
			async ({ page }) =>
			{
				await page.goto(ROUTES.auth.login);

				await page
					.getByRole("button",
						{ name: "Cookie Settings" })
					.click();

				const dialog: Locator =
					page.getByRole("dialog",
						{ name: "Cookie Preferences" });
				await expect(dialog)
					.toBeVisible();

				await page
					.getByRole("button",
						{ name: "Save My Choices" })
					.click();

				await expect(dialog)
					.toBeHidden();

				const cookies: Array<{ name: string; }> =
					await page
						.context()
						.cookies();
				const consentCookie: { name: string; } | undefined =
					cookies.find((cookie) =>
						cookie.name === COOKIE_NAMES.cookieConsent);
				expect(consentCookie)
					.toBeDefined();
			});

		test("banner does not reappear after accepting on page reload",
			async ({ page }) =>
			{
				await page.goto(ROUTES.auth.login);

				await page
					.getByRole("button",
						{ name: "Accept All Cookies" })
					.click();

				const banner: Locator =
					page.getByRole("region",
						{ name: "Cookie consent" });
				await expect(banner)
					.toBeHidden();

				await page.reload();

				await expect(banner)
					.toBeHidden();
			});

		test("banner has no critical accessibility violations",
			async ({ page }) =>
			{
				await page.goto(ROUTES.auth.login);

				const banner: Locator =
					page.getByRole("region",
						{ name: "Cookie consent" });
				await expect(banner)
					.toBeVisible();

				await expectAccessible(page, "Cookie Consent Banner");
			});

		test("banner is NOT shown on non-auth routes (home, legal pages)",
			async ({ page }) =>
			{
				const nonAuthPages: ReadonlyArray<string> =
					[
						ROUTES.home,
						ROUTES.legal.privacyPolicy,
						ROUTES.legal.termsOfService
					];

				for (const path of nonAuthPages)
				{
					await page.goto(path);

					const banner: Locator =
						page.getByRole("region",
							{ name: "Cookie consent" });
					await expect(banner)
						.toBeHidden(
							{ timeout: TIMEOUTS.navigation });
				}
			});

		test("footer 'Cookie Settings' shows banner even on a non-auth page",
			async ({ page }) =>
			{
				// Use /privacy-policy — a static public page with a visible footer.
				// (The home page uses a full-width layout that hides the app-footer.)
				await page.goto(ROUTES.legal.privacyPolicy);

				const banner: Locator =
					page.getByRole("region",
						{ name: "Cookie consent" });

				// Banner suppressed on public page by default
				await expect(banner)
					.toBeHidden();

				// Clicking footer Cookie Settings should force the banner open
				await page
					.getByRole("button",
						{ name: "Cookie Settings" })
					.click();

				await expect(banner)
					.toBeVisible();
			});
	});

test.describe("Cookie Consent — shared-device safety",
	() =>
	{
		test(
			"consent banner reappears after logout so the next user can set their own preferences",
			async ({ browser }: { browser: Browser; }) =>
			{
			// Use a completely fresh browser context — no storage state
				const context: BrowserContext =
					await browser.newContext(
						{ storageState: undefined });
				const page: Page =
					await context.newPage();

				try
				{
				// Step 1: First visit — banner should show (auth route is not a public-only route)
					await page.goto(ROUTES.auth.login);

					const banner: Locator =
						page.getByRole("region",
							{ name: "Cookie consent" });
					await expect(banner)
						.toBeVisible();

					// Step 2: Accept consent
					await page
						.getByRole("button",
							{ name: "Accept All Cookies" })
						.click();
					await expect(banner)
						.toBeHidden();

					// Step 3: Log in as the standard E2E user
					await loginAsUser(page, TEST_USERS[0]);

					// Step 4: Verify still logged in (home page user menu visible)
					await expect(page.locator(SELECTORS.layout.userMenuButton))
						.toBeVisible(
							{ timeout: TIMEOUTS.auth });

					// Step 5: Perform logout
					await page
						.locator(SELECTORS.layout.userMenuButton)
						.click();
					await page
						.locator(SELECTORS.layout.logoutButton)
						.click();

					// Wait for logout to complete (user menu disappears)
					await expect(page.locator(SELECTORS.layout.userMenuButton))
						.toBeHidden(
							{ timeout: TIMEOUTS.navigation });

					// Step 6: Navigate to a non-public route — banner must reappear
					await page.goto(ROUTES.auth.login);

					await expect(banner)
						.toBeVisible(
							{ timeout: TIMEOUTS.navigation });
				}
				finally
				{
					await context.close();
				}
			});
	});