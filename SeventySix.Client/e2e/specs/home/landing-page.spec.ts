import {
	expect,
	expectAccessible,
	PAGE_TEXT,
	ROUTES,
	SELECTORS,
	test,
	TIMEOUTS,
	triggerAllDeferBlocks
} from "@e2e-fixtures";
import { Locator, Page } from "@playwright/test";

/**
 * E2E Tests for Landing Page
 *
 * Priority: P1 (Public Page)
 * Tests the dual-theme parallax landing page including:
 * - Hero section with title and tagline
 * - Tech stack categories with external links
 * - Stats bar with animated counters
 * - Feature highlights
 * - Architecture expandable cards
 * - CTA footer with clone command
 * - Heading hierarchy (h1 → h2 → h3)
 * - Accessibility (axe-core scan)
 */

test.describe("Landing Page",
	() =>
	{
		test.beforeEach(
			async ({ page }: { page: Page; }) =>
			{
				await page.goto(ROUTES.home);

				// Wait for hero section to render before triggering defers
				await expect(page.locator(SELECTORS.home.heroSection))
					.toBeVisible();

				// Scroll through the page to trigger all @defer (on viewport) blocks
				await triggerAllDeferBlocks(page);
			});

		test.describe("Hero Section",
			() =>
			{
				test("should display hero with title and tagline",
					async ({ page }: { page: Page; }) =>
					{
						const hero: Locator =
							page.locator(SELECTORS.home.heroSection);

						await expect(hero)
							.toBeVisible();

						const title: Locator =
							page.locator(SELECTORS.home.heroTitle);

						await expect(title)
							.toHaveText(PAGE_TEXT.home.landingPage.heroTitle);

						const tagline: Locator =
							page.locator(SELECTORS.home.heroTagline);

						await expect(tagline)
							.toHaveText(PAGE_TEXT.home.landingPage.heroTagline);
					});

				test("should have GitHub link with noopener",
					async ({ page }: { page: Page; }) =>
					{
						const githubLink: Locator =
							page
								.locator(SELECTORS.home.heroSection)
								.locator("a[target='_blank']")
								.first();

						await expect(githubLink)
							.toHaveAttribute("rel", /noopener/);
					});
			});

		test.describe("Tech Stack Section",
			() =>
			{
				test("should display tech stack heading and categories",
					async ({ page }: { page: Page; }) =>
					{
						const section: Locator =
							page.locator(SELECTORS.home.techStackSection);

						await expect(section)
							.toBeVisible();

						const heading: Locator =
							section.locator("h2");

						await expect(heading)
							.toHaveText(PAGE_TEXT.home.landingPage.techStackHeading);

						const categories: Locator =
							section.locator(SELECTORS.home.techCategory);

						await expect(categories)
							.toHaveCount(3);
					});

				test("should have tech item links with noopener",
					async ({ page }: { page: Page; }) =>
					{
						const firstItem: Locator =
							page
								.locator(SELECTORS.home.techItem)
								.first();

						await expect(firstItem)
							.toHaveAttribute("rel", /noopener/);

						await expect(firstItem)
							.toHaveAttribute("target", "_blank");
					});
			});

		test.describe("Stats Section",
			() =>
			{
				test("should display stats bar with items",
					async ({ page }: { page: Page; }) =>
					{
						const statsBar: Locator =
							page.locator(SELECTORS.home.statsBar);

						await expect(statsBar)
							.toBeVisible();

						const statItems: Locator =
							statsBar.locator(SELECTORS.home.statItem);

						const count: number =
							await statItems.count();

						expect(count)
							.toBeGreaterThanOrEqual(3);
					});
			});

		test.describe("Features Section",
			() =>
			{
				test("should display features heading and articles",
					async ({ page }: { page: Page; }) =>
					{
						const section: Locator =
							page.locator(SELECTORS.home.featuresSection);

						await expect(section)
							.toBeVisible(
								{ timeout: TIMEOUTS.api });

						const heading: Locator =
							section.locator("h2");

						await expect(heading)
							.toHaveText(PAGE_TEXT.home.landingPage.featuresHeading);

						const articles: Locator =
							section.locator(SELECTORS.home.featureArticle);

						const articleCount: number =
							await articles.count();

						expect(articleCount)
							.toBeGreaterThanOrEqual(3);
					});
			});

		test.describe("Architecture Section",
			() =>
			{
				test("should display architecture cards",
					async ({ page }: { page: Page; }) =>
					{
						const section: Locator =
							page.locator(SELECTORS.home.architectureSection);

						await expect(section)
							.toBeVisible(
								{ timeout: TIMEOUTS.api });

						const heading: Locator =
							section.locator("h2");

						await expect(heading)
							.toHaveText(PAGE_TEXT.home.landingPage.architectureHeading);
					});

				test("should expand and collapse architecture card on click",
					async ({ page }: { page: Page; }) =>
					{
						const section: Locator =
							page.locator(SELECTORS.home.architectureSection);

						await expect(section)
							.toBeVisible(
								{ timeout: TIMEOUTS.api });

						// Scroll the container so the cards are in view
						await page.evaluate(
							() =>
							{
								const element: Element | null =
									document.querySelector("section.architecture");
								element?.scrollIntoView(
									{ behavior: "instant" });
							});

						const firstHeader: Locator =
							section
								.locator(SELECTORS.home.archCardHeader)
								.first();

						// Initially collapsed
						await expect(firstHeader)
							.toHaveAttribute("aria-expanded", "false");

						// Click to expand
						await firstHeader.click();

						await expect(firstHeader)
							.toHaveAttribute("aria-expanded", "true");

						const expandedContent: Locator =
							section.locator(SELECTORS.home.archCardContent);

						await expect(expandedContent)
							.toBeVisible();

						// Click again to collapse
						await firstHeader.click();

						await expect(firstHeader)
							.toHaveAttribute("aria-expanded", "false");
					});
			});

		test.describe("CTA Footer Section",
			() =>
			{
				test.beforeEach(
					async ({ page }: { page: Page; }) =>
					{
						// Scroll the CTA section into view within the parallax container
						await page.evaluate(
							() =>
							{
								const element: Element | null =
									document.querySelector("section.cta-footer");
								element?.scrollIntoView(
									{ behavior: "instant" });
							});
					});

				test("should display CTA footer with clone command",
					async ({ page }: { page: Page; }) =>
					{
						const cta: Locator =
							page.locator(SELECTORS.home.ctaFooter);

						await expect(cta)
							.toBeVisible(
								{ timeout: TIMEOUTS.api });

						const title: Locator =
							cta.locator("h2");

						await expect(title)
							.toHaveText(PAGE_TEXT.home.landingPage.ctaTitle);

						const cloneCmd: Locator =
							cta.locator(SELECTORS.home.ctaCloneCommand);

						await expect(cloneCmd)
							.toHaveText(PAGE_TEXT.home.landingPage.cloneCommand);
					});

				test("should have external links with noopener",
					async ({ page }: { page: Page; }) =>
					{
						const cta: Locator =
							page.locator(SELECTORS.home.ctaFooter);

						const externalLinks: Locator =
							cta.locator("a[target='_blank']");

						const linkCount: number =
							await externalLinks.count();

						expect(linkCount)
							.toBe(2);

						for (let idx: number = 0; idx < linkCount; idx++)
						{
							await expect(externalLinks.nth(idx))
								.toHaveAttribute("rel", /noopener/);
						}
					});
			});

		test.describe("Heading Hierarchy",
			() =>
			{
				test("should have exactly one h1 and correct h2 structure",
					async ({ page }: { page: Page; }) =>
					{
						const h1Count: number =
							await page
								.locator("h1")
								.count();

						expect(h1Count)
							.toBe(1);

						const h2Elements: Locator =
							page.locator("h2");

						const h2Count: number =
							await h2Elements.count();

						// Hero (none), Tech Stack, Stats (visually-hidden), Features, Architecture, CTA
						expect(h2Count)
							.toBeGreaterThanOrEqual(4);
					});
			});

		test.describe("Accessibility",
			() =>
			{
				// eslint-disable-next-line playwright/expect-expect -- assertions inside expectAccessible
				test("should have no critical accessibility violations",
					async ({ page }: { page: Page; }) =>
					{
						await expectAccessible(page, "Landing Page");
					});
			});
	});