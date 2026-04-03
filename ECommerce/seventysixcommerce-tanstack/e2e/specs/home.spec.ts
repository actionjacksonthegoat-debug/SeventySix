import { test, expect, ROUTES, SELECTORS, PAGE_TEXT } from "../fixtures";

test.describe("Homepage",
	() =>
	{
		test.beforeEach(
			async ({ page }) =>
			{
				await page.goto(ROUTES.home);
			});

		test("should render header and footer",
			async ({ page }) =>
			{
				await expect(page.locator(SELECTORS.header)).toBeVisible();
				await expect(page.locator(SELECTORS.footer)).toBeVisible();
			});

		test("should have correct title",
			async ({ page }) =>
			{
				await expect(page).toHaveTitle(PAGE_TEXT.titles.home);
			});
	});
