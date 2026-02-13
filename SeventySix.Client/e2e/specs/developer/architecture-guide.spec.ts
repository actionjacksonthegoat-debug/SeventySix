import { Page } from "@playwright/test";
import {
	test,
	expect,
	ROUTES,
	SELECTORS,
	PAGE_TEXT
} from "../../fixtures";

/**
 * E2E Tests for Architecture Guide Page
 *
 * Priority: P2 (Developer Feature)
 * Tests the architecture guide documentation including:
 * - Page structure and content
 */
test.describe("Architecture Guide Page",
	() =>
	{
		test.beforeEach(
			async ({ developerPage }: { developerPage: Page }) =>
			{
				await developerPage.goto(ROUTES.developer.architectureGuide);
				await developerPage.waitForLoadState("load");
			});

		test.describe("Page Structure",
			() =>
			{
				test("should display architecture guide heading",
					async ({ developerPage }: { developerPage: Page }) =>
					{
						const heading =
							developerPage.locator(SELECTORS.developer.architectureGuideHeader);

						await expect(heading)
							.toHaveText(PAGE_TEXT.developer.architectureGuide.title);
					});

				test("should display guide card",
					async ({ developerPage }: { developerPage: Page }) =>
					{
						const guideCard =
							developerPage.locator("mat-card");

						await expect(guideCard)
							.toBeVisible();
					});

				test("should display card with Project Architecture title",
					async ({ developerPage }: { developerPage: Page }) =>
					{
						const cardTitle =
							developerPage.locator("mat-card-title");

						await expect(cardTitle)
							.toContainText(PAGE_TEXT.developer.architectureGuide.cardTitle);
					});

				test("should display architecture description",
					async ({ developerPage }: { developerPage: Page }) =>
					{
						const cardContent =
							developerPage.locator("mat-card-content");

						await expect(cardContent)
							.toContainText(PAGE_TEXT.developer.architectureGuide.description);
					});
			});
	});
