import { type Locator, type Page } from "@playwright/test";
import {
	test,
	expect,
	ROUTES,
	PAGE_TEXT
} from "../../fixtures";

/**
 * E2E Tests for Home Page
 *
 * The home page displays the landing page.
 * Detailed landing page content tests are in specs/home/landing-page.spec.ts.
 */

/**
 * Scrolls the landing page until the target element is visible.
 * Uses mouse wheel scrolling to trigger @defer (on viewport) blocks.
 * @param page - Playwright Page object
 * @param targetLocator - Locator for the element to scroll into view
 */
async function scrollToElement(
	page: Page,
	targetLocator: Locator): Promise<void>
{
	await page.locator(".landing-page").click({ position: { x: 100, y: 100 } });

	const maxAttempts: number = 30;
	const scrollIncrement: number = 400;

	for (let attempt: number = 0; attempt < maxAttempts; attempt++)
	{
		await page.mouse.wheel(0, scrollIncrement);

		const isVisible: boolean =
			await targetLocator.count()
				.then((count) => count > 0);

		if (isVisible)
		{
			return;
		}
	}
}

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
						await scrollToElement(page, homePage.featuresSection);
						await expect(homePage.featuresSection)
							.toBeVisible();
					});

				test("should display architecture section",
					async ({ page, homePage }) =>
					{
						await scrollToElement(page, homePage.architectureSection);
						await expect(homePage.architectureSection)
							.toBeVisible();
					});

				test("should display CTA footer",
					async ({ page, homePage }) =>
					{
						await scrollToElement(page, homePage.ctaFooter);
						await expect(homePage.ctaFooter)
							.toBeVisible();
					});
			});
	});
