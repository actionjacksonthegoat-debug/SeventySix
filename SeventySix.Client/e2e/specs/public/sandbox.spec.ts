import {
	test,
	expect,
	ROUTES,
	SELECTORS,
	PAGE_TEXT
} from "../../fixtures";

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
				await page.waitForLoadState("load");
			});

		test.describe("Page Structure",
			() =>
			{
				test("should display sandbox container",
					async ({ page }) =>
					{
						const container =
							page.locator(SELECTORS.sandbox.container);

						await expect(container)
							.toBeVisible();
					});

				test("should display sandbox card",
					async ({ page }) =>
					{
						const sandboxCard =
							page.locator(SELECTORS.sandbox.sandboxCard);

						await expect(sandboxCard)
							.toBeVisible();
					});

				test("should display sandbox heading",
					async ({ page }) =>
					{
						const heading =
							page.locator(SELECTORS.sandbox.sandboxTitle);

						await expect(heading)
							.toHaveText(PAGE_TEXT.sandbox.title);
					});

				test("should display sandbox description",
					async ({ page }) =>
					{
						const cardContent =
							page.locator(SELECTORS.sandbox.cardContent);

						await expect(cardContent)
							.toContainText(PAGE_TEXT.sandbox.description);
					});
			});
	});
