import { expect, expectAccessible, ROUTES, test } from "@e2e-fixtures";
import type { Locator } from "@playwright/test";

/**
 * E2E Tests: Legal Pages (Privacy Policy + Terms of Service)
 *
 * Verifies that both legal pages are publicly accessible,
 * contain the required legal content, and meet WCAG 2.2 AA.
 */
test.describe("Legal Pages",
	() =>
	{
	// Legal pages are public — verify without auth state
		test.use(
			{
				storageState: undefined
			});

		test.describe("Privacy Policy",
			() =>
			{
				test.beforeEach(
					async ({ page }) =>
					{
						await page.goto(ROUTES.legal.privacyPolicy);
					});

				test("is accessible without authentication",
					async ({ page }) =>
					{
						await expect(page)
							.toHaveURL(/privacy-policy/);
					});

				test("displays Privacy Policy heading",
					async ({ page }) =>
					{
						await expect(
							page.getByRole("heading",
								{ name: "Privacy Policy", level: 1 }))
							.toBeVisible();
					});

				test("contains GDPR rights section",
					async ({ page }) =>
					{
						await expect(
							page.getByRole("heading",
								{ name: /Your Rights/i }))
							.toBeVisible();
					});

				test("contains CCPA rights section",
					async ({ page }) =>
					{
						await expect(
							page.getByRole("heading",
								{ name: /California Privacy Rights/i }))
							.toBeVisible();
					});

				test("contains cookie policy section with cookie table",
					async ({ page }) =>
					{
						await expect(
							page.getByRole("heading",
								{ name: /Cookie Policy/i }))
							.toBeVisible();

						// Cookie table should list seventysix_consent
						await expect(
							page.getByRole("table"))
							.toBeVisible();
					});

				// eslint-disable-next-line playwright/expect-expect -- assertions inside expectAccessible
				test("has no critical accessibility violations",
					async ({ page }) =>
					{
						await expectAccessible(page, "Privacy Policy");
					});
			});

		test.describe("Terms of Service",
			() =>
			{
				test.beforeEach(
					async ({ page }) =>
					{
						await page.goto(ROUTES.legal.termsOfService);
					});

				test("is accessible without authentication",
					async ({ page }) =>
					{
						await expect(page)
							.toHaveURL(/terms-of-service/);
					});

				test("displays Terms of Service heading",
					async ({ page }) =>
					{
						await expect(
							page.getByRole("heading",
								{ name: "Terms of Service", level: 1 }))
							.toBeVisible();
					});

				test("contains all 11 required sections",
					async ({ page }) =>
					{
						const requiredHeadings: Array<RegExp> =
							[
								/Acceptance of Terms/i,
								/Use of the Service/i,
								/Account Responsibilities/i,
								/Acceptable Use Policy/i,
								/Intellectual Property/i,
								/Disclaimer of Warranties/i,
								/Limitation of Liability/i,
								/Termination/i,
								/Governing Law/i,
								/Changes to Terms/i,
								/Contact/i
							];

						for (const pattern of requiredHeadings)
						{
							await expect(
								page.getByRole("heading",
									{ name: pattern }))
								.toBeVisible();
						}
					});

				// eslint-disable-next-line playwright/expect-expect -- assertions inside expectAccessible
				test("has no critical accessibility violations",
					async ({ page }) =>
					{
						await expectAccessible(page, "Terms of Service");
					});
			});

		test.describe("Footer legal navigation",
			() =>
			{
				// The home page uses the full-width landing layout which intentionally
				// hides the app-footer (via CSS :has(.full-width-page) > app-footer).
				// Navigate to a non-full-width page so the footer is visible.
				// /auth/login is a simple public page with no conflicting legal links.

				test("footer contains Privacy Policy link",
					async ({ page }) =>
					{
						await page.goto(ROUTES.auth.login);

						// Dismiss banner — wait for it to fully disappear before checking footer.
						const banner: Locator =
							page.getByRole("region",
								{ name: "Cookie consent" });
						await page
							.getByRole("button",
								{ name: "Accept All Cookies" })
							.click();
						await expect(banner)
							.toBeHidden();

						// Scope to footer (contentinfo) to avoid any page-level ambiguity.
						const footer: Locator =
							page.getByRole("contentinfo");
						const privacyLink: Locator =
							footer.getByRole("link",
								{ name: "Privacy Policy" });
						await expect(privacyLink)
							.toBeVisible();
						await privacyLink.click();
						await expect(page)
							.toHaveURL(/privacy-policy/);
					});

				test("footer contains Terms of Service link",
					async ({ page }) =>
					{
						await page.goto(ROUTES.auth.login);

						// Dismiss banner — wait for it to fully disappear before checking footer.
						const banner: Locator =
							page.getByRole("region",
								{ name: "Cookie consent" });
						await page
							.getByRole("button",
								{ name: "Accept All Cookies" })
							.click();
						await expect(banner)
							.toBeHidden();

						// Scope to footer (contentinfo) to avoid any page-level ambiguity.
						const footer: Locator =
							page.getByRole("contentinfo");
						const tosLink: Locator =
							footer.getByRole("link",
								{ name: "Terms of Service" });
						await expect(tosLink)
							.toBeVisible();
						await tosLink.click();
						await expect(page)
							.toHaveURL(/terms-of-service/);
					});

				test("footer contains Cookie Preferences button that shows banner",
					async ({ page }) =>
					{
						await page.goto(ROUTES.auth.login);

						// Dismiss banner — wait for it to fully disappear before re-opening.
						const banner: Locator =
							page.getByRole("region",
								{ name: "Cookie consent" });
						await page
							.getByRole("button",
								{ name: "Accept All Cookies" })
							.click();
						await expect(banner)
							.toBeHidden();

						// Click Cookie Preferences in footer — should reopen banner.
						// Scope to footer (contentinfo) to target the footer button specifically.
						const footer: Locator =
							page.getByRole("contentinfo");
						await footer
							.getByRole("button",
								{ name: "Manage cookie preferences" })
							.click();

						await expect(banner)
							.toBeVisible();
					});
			});
	});