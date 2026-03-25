import AxeBuilder from "@axe-core/playwright";
import {
	expect,
	ROUTES,
	SELECTORS,
	test
} from "@e2e-fixtures";
import type { Locator } from "@playwright/test";
import type { AxeResults, Result } from "axe-core";

/**
 * E2E Tests for Spy vs Spy Game Page
 *
 * Priority: P2 (Public Feature)
 * Tests game page navigation, initial render, and accessibility.
 * Game mechanics are tested via unit tests — E2E focuses on
 * user-facing navigation and WCAG AA compliance.
 */
test.describe("Spy vs Spy — Navigation & Initial Render",
	() =>
	{
		test.beforeEach(
			async ({ page }) =>
			{
				await page.goto(ROUTES.games.spyVsSpy);
			});

		test("should render canvas element",
			async ({ page }) =>
			{
				const canvas: Locator =
					page.locator(SELECTORS.spyVsSpy.canvas);

				await expect(canvas)
					.toBeAttached();
			});

		test("should display start overlay",
			async ({ page }) =>
			{
				const overlay: Locator =
					page.locator(SELECTORS.spyVsSpy.startOverlay);

				await expect(overlay)
					.toBeVisible();
			});

		test("should display Start Mission button",
			async ({ page }) =>
			{
				const startButton: Locator =
					page.locator(SELECTORS.spyVsSpy.startGame);

				await expect(startButton)
					.toBeVisible();

				await expect(startButton)
					.toHaveText("Start Mission");
			});

		test("should display Back to Games link",
			async ({ page }) =>
			{
				const backLink: Locator =
					page.locator(SELECTORS.spyVsSpy.backToGames);

				await expect(backLink)
					.toBeVisible();
			});

		test("should navigate to games page via back link",
			async ({ page }) =>
			{
				const backLink: Locator =
					page.locator(SELECTORS.spyVsSpy.backToGames);

				await backLink
					.click();

				await expect(page)
					.toHaveURL(/\/games$/);
			});

		test("should have no critical accessibility violations on start screen",
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