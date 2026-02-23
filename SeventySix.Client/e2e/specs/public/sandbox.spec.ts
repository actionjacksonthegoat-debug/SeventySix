import {
	expect,
	PAGE_TEXT,
	ROUTES,
	SELECTORS,
	test
} from "@e2e-fixtures";
import type { Locator } from "@playwright/test";

/**
 * E2E Tests for Sandbox Page
 *
 * Priority: P2 (Public Feature)
 * Tests the sandbox experimentation area including:
 * - Page structure and content
 */
test.describe("Sandbox Page",
	() =>
	{
		test.beforeEach(
			async ({ page }) =>
			{
				await page.goto(ROUTES.sandbox.root);
			});

		test.describe("Page Structure",
			() =>
			{
				test("should display Hello World heading",
					async ({ page }) =>
					{
						const heading: Locator =
							page.locator(SELECTORS.sandbox.title);

						await expect(heading)
							.toBeVisible();

						await expect(heading)
							.toHaveText(PAGE_TEXT.sandbox.title);
					});
			});
	});