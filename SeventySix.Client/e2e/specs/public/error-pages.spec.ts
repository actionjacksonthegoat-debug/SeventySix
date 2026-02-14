import {
	test,
	expect,
	ROUTES,
	SELECTORS,
	PAGE_TEXT
} from "../../fixtures";

/**
 * E2E Tests for Error Pages
 *
 * Priority: P1 (UX Resilience)
 * Tests error page handling including:
 * - 404 Not Found page
 * - Navigation recovery
 */
test.describe("Error Pages",
	() =>
	{
		test.describe("404 Not Found",
			() =>
			{
				test("should display 404 page for unknown routes",
					async ({ page }) =>
					{
						await page.goto("/this-route-does-not-exist-at-all");
					await page.waitForLoadState("load");

						const errorContainer =
							page.locator(SELECTORS.errorPage.container);

						await expect(errorContainer)
							.toBeVisible();
					});

				test("should display 404 error title",
					async ({ page }) =>
					{
						await page.goto("/non-existent-page-xyz");
					await page.waitForLoadState("load");

						const errorTitle =
							page.locator(SELECTORS.errorPage.errorTitle);

						await expect(errorTitle)
							.toContainText(PAGE_TEXT.errorPage.notFoundTitle);
					});

				test("should display error description",
					async ({ page }) =>
					{
						await page.goto("/unknown-route-test");
					await page.waitForLoadState("load");

						const pageBody =
						page.locator(SELECTORS.errorPage.container);
						await expect(pageBody)
							.toContainText(PAGE_TEXT.errorPage.notFoundDescription);
					});

				test("should display Go to Home button",
					async ({ page }) =>
					{
						await page.goto("/invalid-path-12345");
					await page.waitForLoadState("load");

						const homeButton =
							page.locator(SELECTORS.errorPage.homeButton);

						await expect(homeButton)
							.toBeVisible();
						await expect(homeButton)
							.toContainText(PAGE_TEXT.errorPage.goToHome);
					});

				test("should navigate to home when clicking home button",
					async ({ page }) =>
					{
						await page.goto("/random-invalid-route");
					await page.waitForLoadState("load");

						const homeButton =
							page.locator(SELECTORS.errorPage.homeButton);
						await homeButton.click();

						await expect(page)
							.toHaveURL(ROUTES.home);
					});
			});
	});
