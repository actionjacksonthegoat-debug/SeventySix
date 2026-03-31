import { test, expect, ROUTES, SELECTORS } from "../fixtures";

test.describe("Navigation",
	() =>
	{
		test("should navigate to about page",
			async ({ page }) =>
			{
				await page.goto(ROUTES.home);
				await page.click(SELECTORS.navAbout);
				await expect(page).toHaveURL(/about/);
			});

		test("should navigate to shop page",
			async ({ page }) =>
			{
				await page.goto(ROUTES.home);
				await page.click(SELECTORS.navShop);
				await expect(page).toHaveURL(/shop/);
			});
	});
