import { Page } from "@playwright/test";
import {
	test,
	expect,
	ROUTES,
	SELECTORS,
	PAGE_TEXT
} from "../../fixtures";

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
		test.beforeEach(
			async ({ developerPage }: { developerPage: Page }) =>
			{
				await developerPage.goto(ROUTES.developer.styleGuide);
				await developerPage.waitForLoadState("load");
			});

		test.describe("Page Structure",
			() =>
			{
				test("should display style guide heading",
					async ({ developerPage }: { developerPage: Page }) =>
					{
						const heading =
							developerPage.locator(SELECTORS.developer.styleGuideHeader);

						await expect(heading)
							.toHaveText(PAGE_TEXT.developer.styleGuide.title);
					});

				test("should display style guide description",
					async ({ developerPage }: { developerPage: Page }) =>
					{
						const header =
							developerPage.locator(SELECTORS.developer.styleGuideContainer);

						await expect(header)
							.toContainText(PAGE_TEXT.developer.styleGuide.description);
					});

				test("should display theme toggle button",
					async ({ developerPage }: { developerPage: Page }) =>
					{
						const themeToggle =
							developerPage.locator(SELECTORS.developer.themeToggle);

						await expect(themeToggle)
							.toBeVisible();
					});
			});

		test.describe("Theme Controls",
			() =>
			{
				test("should display color scheme selector",
					async ({ developerPage }: { developerPage: Page }) =>
					{
						const colorSchemeSelect =
						developerPage.locator(SELECTORS.developer.colorSchemeSelect);
						await expect(colorSchemeSelect)
							.toBeVisible();
					});
			});

		test.describe("Content Tabs",
			() =>
			{
				test("should display tab group",
					async ({ developerPage }: { developerPage: Page }) =>
					{
						const tabGroup =
						developerPage.locator(SELECTORS.developer.tabGroup);
						await expect(tabGroup)
							.toBeVisible();
					});

				test("should display Colors tab",
					async ({ developerPage }: { developerPage: Page }) =>
					{
						const colorsTab =
						developerPage.locator(`.mat-mdc-tab:has-text('${PAGE_TEXT.developer.styleGuide.colorsTab}')`);
						await expect(colorsTab)
							.toBeVisible();
					});
			});
	});
