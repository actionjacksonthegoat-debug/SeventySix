import { test, expect } from "@playwright/test";

test.describe("Weather Forecast E2E", () =>
{
	test("should display weather forecasts", async ({ page }) =>
	{
		// Navigate to the app
		await page.goto("/");

		// Wait for the weather data to load
		await page.waitForSelector("app-weather-display");

		// Check that forecasts are displayed
		const forecasts = page.locator(".forecast-item");
		await expect(forecasts).toHaveCount(5);

		// Verify forecast structure
		const firstForecast = forecasts.first();
		await expect(firstForecast.locator(".date")).toBeVisible();
		await expect(firstForecast.locator(".temperature")).toBeVisible();
		await expect(firstForecast.locator(".summary")).toBeVisible();
	});

	test("should handle loading state", async ({ page }) =>
	{
		await page.goto("/");

		// Check for loading indicator initially
		const loadingIndicator = page.locator('[data-testid="loading"]');

		// Wait for loading to finish
		await expect(loadingIndicator).not.toBeVisible({ timeout: 5000 });

		// Verify content is loaded
		await expect(page.locator("app-weather-display")).toBeVisible();
	});

	test("should handle error and retry", async ({ page }) =>
	{
		// Intercept API call and force an error
		await page.route("**/WeatherForecast", (route) =>
		{
			route.abort("failed");
		});

		await page.goto("/");

		// Check for error message
		await expect(page.locator('[data-testid="error"]')).toBeVisible();

		// Remove the route block
		await page.unroute("**/WeatherForecast");

		// Click retry button
		await page.locator('[data-testid="retry-button"]').click();

		// Verify forecasts load successfully
		await expect(page.locator(".forecast-item")).toHaveCount(5, {
			timeout: 5000
		});
	});

	test("should navigate between pages", async ({ page }) =>
	{
		await page.goto("/");

		// Navigate to world map
		await page.click('a[href="/world-map"]');

		// Verify world map is displayed
		await expect(page.locator("app-world-map")).toBeVisible();

		// Navigate back
		await page.click('a[href="/"]');

		// Verify weather display is shown again
		await expect(page.locator("app-weather-display")).toBeVisible();
	});

	test("should display temperature in both Celsius and Fahrenheit", async ({
		page
	}) =>
	{
		await page.goto("/");

		await page.waitForSelector(".forecast-item");

		const firstForecast = page.locator(".forecast-item").first();
		const tempText = await firstForecast
			.locator(".temperature")
			.textContent();

		// Verify both C and F are displayed
		expect(tempText).toMatch(/\d+°C/);
		expect(tempText).toMatch(/\d+°F/);
	});
});
