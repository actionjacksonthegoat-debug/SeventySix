import {
	expect,
	PAGE_TEXT,
	ROUTES,
	SELECTORS,
	test,
	TIMEOUTS
} from "@e2e-fixtures";
import type { Locator } from "@playwright/test";

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

						const errorContainer: Locator =
							page.locator(SELECTORS.errorPage.container);

						await expect(errorContainer)
							.toBeVisible(
								{ timeout: TIMEOUTS.element });
					});

				test("should display 404 error title",
					async ({ page }) =>
					{
						await page.goto("/non-existent-page-xyz");

						const errorTitle: Locator =
							page.locator(SELECTORS.errorPage.errorTitle);

						await expect(errorTitle)
							.toContainText(PAGE_TEXT.errorPage.notFoundTitle,
								{ timeout: TIMEOUTS.element });
					});

				test("should display error description",
					async ({ page }) =>
					{
						await page.goto("/unknown-route-test");

						const pageBody: Locator =
							page.locator(SELECTORS.errorPage.container);
						await expect(pageBody)
							.toContainText(PAGE_TEXT.errorPage.notFoundDescription,
								{ timeout: TIMEOUTS.element });
					});

				test("should display Go to Home button",
					async ({ page }) =>
					{
						await page.goto("/invalid-path-12345");

						const homeButton: Locator =
							page.locator(SELECTORS.errorPage.homeButton);

						await expect(homeButton)
							.toBeVisible(
								{ timeout: TIMEOUTS.element });
						await expect(homeButton)
							.toContainText(PAGE_TEXT.errorPage.goToHome);
					});

				test("should navigate to home when clicking home button",
					async ({ page }) =>
					{
						await page.goto("/random-invalid-route");

						const homeButton: Locator =
							page.locator(SELECTORS.errorPage.homeButton);

						await expect(homeButton)
							.toBeVisible(
								{ timeout: TIMEOUTS.element });
						await homeButton.click();

						await expect(page)
							.toHaveURL(ROUTES.home);
					});
			});
	});