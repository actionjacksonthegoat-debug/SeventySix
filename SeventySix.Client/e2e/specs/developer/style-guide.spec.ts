import {
	DEVELOPER_STYLEGUIDE_USER,
	expect,
	PAGE_TEXT,
	ROUTES,
	SELECTORS,
	test,
	TIMEOUTS
} from "@e2e-fixtures";
import { Locator, Page } from "@playwright/test";

/**
 * E2E Tests for Style Guide Page
 *
 * Priority: P2 (Developer Feature)
 * Tests the style guide documentation including:
 * - Page structure and content
 * - Theme controls
 */
test.describe("Style Guide Page",
	() =>
	{
		let page: Page;

		test.beforeEach(
			async ({ authenticatedPage }) =>
			{
				page =
					await authenticatedPage(DEVELOPER_STYLEGUIDE_USER);
				await page.goto(ROUTES.developer.styleGuide);

				// Warm-up: wait for the style guide to fully load (handles token refresh delay under Docker load)
				await expect(page.locator(SELECTORS.developer.styleGuideHeader))
					.toBeVisible(
						{ timeout: TIMEOUTS.navigation * 2 });
			});

		test.afterEach(
			async () =>
			{
				await page
					.context()
					.close();
			});

		test.describe("Page Structure",
			() =>
			{
				test("should display style guide heading",
					async () =>
					{
						const heading: Locator =
							page.locator(SELECTORS.developer.styleGuideHeader);

						await expect(heading)
							.toHaveText(PAGE_TEXT.developer.styleGuide.title);
					});

				test("should display style guide description",
					async () =>
					{
						const header: Locator =
							page.locator(SELECTORS.developer.styleGuideContainer);

						await expect(header)
							.toContainText(PAGE_TEXT.developer.styleGuide.description,
								{ timeout: TIMEOUTS.navigation * 2 });
					});

				test("should display theme toggle button",
					async () =>
					{
						const themeToggle: Locator =
							page.locator(SELECTORS.developer.themeToggle);

						await expect(themeToggle)
							.toBeVisible();
					});
			});

		test.describe("Theme Controls",
			() =>
			{
				test("should display color scheme selector",
					async () =>
					{
						const colorSchemeSelect: Locator =
							page.locator(SELECTORS.developer.colorSchemeSelect);
						await expect(colorSchemeSelect)
							.toBeVisible(
								{ timeout: TIMEOUTS.navigation });
					});
			});

		test.describe("Content Tabs",
			() =>
			{
				test("should display tab group",
					async () =>
					{
						const tabGroup: Locator =
							page.locator(SELECTORS.developer.tabGroup);
						await expect(tabGroup)
							.toBeVisible();
					});

				test("should display Colors tab",
					async () =>
					{
						const colorsTab: Locator =
							page.locator(
								`${SELECTORS.developer.tab}:has-text('${PAGE_TEXT.developer.styleGuide.colorsTab}')`);
						await expect(colorsTab)
							.toBeVisible();
					});
			});
	});