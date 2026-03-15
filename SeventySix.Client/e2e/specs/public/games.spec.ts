import AxeBuilder from "@axe-core/playwright";
import {
	expect,
	PAGE_TEXT,
	ROUTES,
	SELECTORS,
	test
} from "@e2e-fixtures";
import type { Locator } from "@playwright/test";
import type { AxeResults, Result } from "axe-core";

/**
 * E2E Tests for Games Landing Page
 *
 * Priority: P2 (Public Feature)
 * Tests the games listing page including:
 * - Page structure and content
 * - Game card rendering and navigation
 * - WCAG AA accessibility compliance
 */
test.describe("Games Landing Page",
	() =>
	{
		test.beforeEach(
			async ({ page }) =>
			{
				await page.goto(ROUTES.games.root);
			});

		test.describe("Page Structure",
			() =>
			{
				test("should display Games heading",
					async ({ page }) =>
					{
						const heading: Locator =
							page.locator(SELECTORS.games.title);

						await expect(heading)
							.toBeVisible();

						await expect(heading)
							.toHaveText(PAGE_TEXT.games.title);
					});

				test("should display subtitle",
					async ({ page }) =>
					{
						const subtitle: Locator =
							page.locator(SELECTORS.games.subtitle);

						await expect(subtitle)
							.toBeVisible();

						await expect(subtitle)
							.toHaveText(PAGE_TEXT.games.subtitle);
					});
			});

		test.describe("Game Cards",
			() =>
			{
				test("should render Car-a-Lot game card",
					async ({ page }) =>
					{
						const card: Locator =
							page.locator(SELECTORS.games.gameCard);

						await expect(card)
							.toBeVisible();

						const cardTitle: Locator =
							card.locator(SELECTORS.games.gameCardTitle);

						await expect(cardTitle)
							.toHaveText("Car-a-Lot");
					});

				test("should navigate to Car-a-Lot game",
					async ({ page }) =>
					{
						const card: Locator =
							page.locator(SELECTORS.games.gameCard);

						await card.click();

						await expect(page)
							.toHaveURL(new RegExp(ROUTES.games.carALot));
					});
			});

		test.describe("Accessibility",
			() =>
			{
				test("should have no critical accessibility violations",
					async ({ page }) =>
					{
						const axeResults: AxeResults =
							await new AxeBuilder(
								{ page })
								.withTags(
									["wcag2a", "wcag2aa", "wcag21aa"])
								.analyze();

						const criticalViolations: Result[] =
							axeResults.violations.filter(
								(violation: Result) =>
									violation.impact === "critical"
										|| violation.impact === "serious");

						expect(criticalViolations)
							.toHaveLength(0);
					});
			});
	});