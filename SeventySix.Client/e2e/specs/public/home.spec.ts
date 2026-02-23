import {
	expect,
	PAGE_TEXT,
	ROUTES,
	scrollUntilVisible,
	test
} from "@e2e-fixtures";

/**
 * E2E Tests for Home Page
 *
 * The home page displays the landing page.
 * Detailed landing page content tests are in specs/home/landing-page.spec.ts.
 */

test.describe("Home Page",
	() =>
	{
		test.beforeEach(
			async ({ page }) =>
			{
				await page.goto(ROUTES.home);
			});

		test.describe("Page Structure",
			() =>
			{
				test("should display hero section",
					async ({ homePage }) =>
					{
						await expect(homePage.heroSection)
							.toBeVisible();
					});

				test("should display hero title",
					async ({ homePage }) =>
					{
						await expect(homePage.heroTitle)
							.toHaveText(PAGE_TEXT.home.landingPage.heroTitle);
					});

				test("should display hero tagline",
					async ({ homePage }) =>
					{
						await expect(homePage.heroTagline)
							.toHaveText(PAGE_TEXT.home.landingPage.heroTagline);
					});
			});

		test.describe("Landing Page Sections",
			() =>
			{
				test("should display tech stack section",
					async ({ homePage }) =>
					{
						await expect(homePage.techStackSection)
							.toBeVisible();
					});

				test("should display stats bar",
					async ({ homePage }) =>
					{
						await expect(homePage.statsBar)
							.toBeVisible();
					});

				test("should display features section",
					async ({ page, homePage }) =>
					{
						await scrollUntilVisible(page,
							{ targetLocator: homePage.featuresSection });
						await expect(homePage.featuresSection)
							.toBeVisible();
					});

				test("should display architecture section",
					async ({ page, homePage }) =>
					{
						await scrollUntilVisible(page,
							{ targetLocator: homePage.architectureSection });
						await expect(homePage.architectureSection)
							.toBeVisible();
					});

				test("should display CTA footer",
					async ({ page, homePage }) =>
					{
						await scrollUntilVisible(page,
							{ targetLocator: homePage.ctaFooter });
						await expect(homePage.ctaFooter)
							.toBeVisible();
					});
			});
	});