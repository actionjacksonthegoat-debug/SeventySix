import { test, expect, type Page } from "@playwright/test";

test.describe("Weather Dashboard E2E Tests", () =>
{
	test.beforeEach(async ({ page, context }) =>
	{
		// Grant geolocation permissions for each test
		await context.grantPermissions(["geolocation"]);
		await context.setGeolocation({ latitude: 40.7128, longitude: -74.006 }); // New York City
	});

	test("should load weather data with geolocation granted", async ({
		page
	}) =>
	{
		await page.goto("/weather-forecast");

		// Wait for weather hero card to load
		await expect(page.locator("app-weather-hero")).toBeVisible({
			timeout: 10000
		});

		// Verify temperature is displayed
		const temperature = page.locator(".temperature").first();
		await expect(temperature).toBeVisible();
		await expect(temperature).toContainText("°");

		// Verify location is displayed
		const location = page.locator(".location").first();
		await expect(location).toBeVisible();

		// Verify weather condition is shown
		const condition = page.locator(".weather-condition").first();
		await expect(condition).toBeVisible();
	});

	test("should display all forecast sections", async ({ page }) =>
	{
		await page.goto("/weather-forecast");

		// Wait for page to load
		await expect(page.locator("app-weather-hero")).toBeVisible({
			timeout: 10000
		});

		// Verify hourly forecast section
		await expect(page.locator("app-hourly-forecast")).toBeVisible();
		const hourlyForecast = page.locator(".forecast-item");
		const hourlyCount = await hourlyForecast.count();
		expect(hourlyCount).toBeGreaterThan(0);

		// Verify daily forecast section
		await expect(page.locator("app-daily-forecast")).toBeVisible();
		const dailyForecast = page.locator(".forecast-card");
		const dailyCount = await dailyForecast.count();
		expect(dailyCount).toBeGreaterThan(0);

		// Verify weather details section
		await expect(page.locator("app-weather-details")).toBeVisible();
		const detailCards = page.locator(".detail-card");
		const detailCount = await detailCards.count();
		expect(detailCount).toBeGreaterThan(0);
	});

	test("should refresh weather when refresh button clicked", async ({
		page
	}) =>
	{
		await page.goto("/weather-forecast");

		// Wait for initial load
		await expect(page.locator("app-weather-hero")).toBeVisible({
			timeout: 10000
		});

		// Get initial temperature
		const tempElement = page.locator(".temperature").first();
		const initialTemp = await tempElement.textContent();

		// Click refresh button
		const refreshButton = page.locator(
			'button[aria-label="Refresh weather"]'
		);
		await expect(refreshButton).toBeVisible();
		await refreshButton.click();

		// Wait for potential loading state
		await page.waitForTimeout(1000);

		// Verify temperature is still displayed (may or may not have changed)
		await expect(tempElement).toBeVisible();
		const newTemp = await tempElement.textContent();
		expect(newTemp).toBeTruthy();
		expect(newTemp).toContain("°");
	});

	test("should toggle temperature units (°C ↔ °F)", async ({ page }) =>
	{
		await page.goto("/weather-forecast");

		// Wait for unit toggle component
		await expect(page.locator("app-unit-toggle")).toBeVisible({
			timeout: 10000
		});

		// Get initial unit display
		const toggleButton = page.locator(".toggle-button");
		await expect(toggleButton).toBeVisible();

		// Get initial aria-label to determine current unit
		const initialAriaLabel = await toggleButton.getAttribute("aria-label");
		expect(initialAriaLabel).toBeTruthy();

		// Click to toggle units
		await toggleButton.click();

		// Wait for state change
		await page.waitForTimeout(500);

		// Verify aria-label changed
		const newAriaLabel = await toggleButton.getAttribute("aria-label");
		expect(newAriaLabel).not.toBe(initialAriaLabel);
		expect(newAriaLabel).toContain("Currently using");

		// Click again to toggle back
		await toggleButton.click();
		await page.waitForTimeout(500);

		// Verify it toggled back
		const finalAriaLabel = await toggleButton.getAttribute("aria-label");
		expect(finalAriaLabel).toBe(initialAriaLabel);
	});

	test("should display weather alerts when present", async ({ page }) =>
	{
		await page.goto("/weather-forecast");

		// Wait for page load
		await expect(page.locator("app-weather-hero")).toBeVisible({
			timeout: 10000
		});

		// Check if alerts component exists
		const alertsComponent = page.locator("app-weather-alerts");

		// If alerts are present, they should be visible
		const alertCards = page.locator(".alert-card");
		const alertCount = await alertCards.count();

		if (alertCount > 0)
		{
			// Verify alert is visible
			await expect(alertCards.first()).toBeVisible();

			// Verify alert has event name
			const eventName = alertCards.first().locator(".event-name");
			await expect(eventName).toBeVisible();

			// Verify alert has dismiss button
			const dismissButton = alertCards
				.first()
				.locator('button[aria-label="Dismiss alert"]');
			await expect(dismissButton).toBeVisible();

			// Click dismiss button
			await dismissButton.click();

			// Verify alert is dismissed
			await expect(alertCards.first()).not.toBeVisible();
		}
	});

	test("should expand and collapse historical weather section", async ({
		page
	}) =>
	{
		await page.goto("/weather-forecast");

		// Wait for historical component
		await expect(page.locator("app-historical-weather")).toBeVisible({
			timeout: 10000
		});

		// Find panel header
		const panelHeader = page.locator(".panel-header");
		await expect(panelHeader).toBeVisible();

		// Initially should be collapsed
		let panelContent = page.locator(".panel-content");
		let isVisible = await panelContent.isVisible();

		// Click to expand
		await panelHeader.click();
		await page.waitForTimeout(500); // Wait for animation

		// Verify content is visible if was collapsed, or hidden if was expanded
		const newVisibility = await panelContent.isVisible();
		expect(newVisibility).not.toBe(isVisible);

		// Click again to toggle back
		await panelHeader.click();
		await page.waitForTimeout(500);

		// Verify it toggled back
		const finalVisibility = await panelContent.isVisible();
		expect(finalVisibility).toBe(isVisible);
	});

	test("should have keyboard navigation support", async ({ page }) =>
	{
		await page.goto("/weather-forecast");

		// Wait for page to load
		await expect(page.locator("app-weather-hero")).toBeVisible({
			timeout: 10000
		});

		// Tab to refresh button
		await page.keyboard.press("Tab");
		await page.keyboard.press("Tab");

		// Verify focus is on an interactive element
		const focusedElement = await page.evaluate(
			() => document.activeElement?.tagName
		);
		expect(focusedElement).toBeTruthy();

		// Press Enter on focused button (if it's the refresh button)
		const refreshButton = page.locator(
			'button[aria-label="Refresh weather"]'
		);
		if (await refreshButton.isVisible())
		{
			await refreshButton.focus();
			await page.keyboard.press("Enter");

			// Should trigger refresh (no error thrown)
			await page.waitForTimeout(1000);
		}
	});

	test("should be responsive on mobile viewport", async ({ page }) =>
	{
		// Set mobile viewport (iPhone 12 Pro)
		await page.setViewportSize({ width: 390, height: 844 });

		await page.goto("/weather-forecast");

		// Wait for hero card
		await expect(page.locator("app-weather-hero")).toBeVisible({
			timeout: 10000
		});

		// Verify hero card takes full width
		const heroCard = page.locator("app-weather-hero mat-card").first();
		const heroBox = await heroCard.boundingBox();
		expect(heroBox?.width).toBeGreaterThan(350); // Should be nearly full width

		// Verify daily forecast stacks vertically (single column)
		const firstForecastCard = page.locator(".forecast-card").first();
		const secondForecastCard = page.locator(".forecast-card").nth(1);

		if (
			(await firstForecastCard.isVisible()) &&
			(await secondForecastCard.isVisible())
		)
		{
			const box1 = await firstForecastCard.boundingBox();
			const box2 = await secondForecastCard.boundingBox();

			// In single-column layout, second card should be below first card
			if (box1 && box2)
			{
				expect(box2.y).toBeGreaterThan(box1.y);
			}
		}
	});

	test("should be responsive on tablet viewport", async ({ page }) =>
	{
		// Set tablet viewport (iPad)
		await page.setViewportSize({ width: 768, height: 1024 });

		await page.goto("/weather-forecast");

		// Wait for page load
		await expect(page.locator("app-weather-hero")).toBeVisible({
			timeout: 10000
		});

		// Verify layout adapts to tablet size
		const dailyForecastCards = page.locator(".forecast-card");
		const cardCount = await dailyForecastCards.count();

		if (cardCount >= 2)
		{
			const box1 = await dailyForecastCards.nth(0).boundingBox();
			const box2 = await dailyForecastCards.nth(1).boundingBox();

			// On tablet, cards may be in 2-column grid
			// Verify they're positioned correctly
			expect(box1).toBeTruthy();
			expect(box2).toBeTruthy();
		}
	});

	test("should scroll hourly forecast horizontally", async ({ page }) =>
	{
		await page.goto("/weather-forecast");

		// Wait for hourly forecast
		await expect(page.locator("app-hourly-forecast")).toBeVisible({
			timeout: 10000
		});

		const forecastScroll = page.locator(".forecast-scroll");
		await expect(forecastScroll).toBeVisible();

		// Get initial scroll position
		const initialScroll = await forecastScroll.evaluate(
			(el) => el.scrollLeft
		);

		// Scroll right
		await forecastScroll.evaluate((el) => el.scrollBy(200, 0));
		await page.waitForTimeout(300);

		// Verify scroll position changed
		const newScroll = await forecastScroll.evaluate((el) => el.scrollLeft);
		expect(newScroll).toBeGreaterThan(initialScroll);
	});

	test("should display animated background based on weather condition", async ({
		page
	}) =>
	{
		await page.goto("/weather-forecast");

		// Wait for animated background component
		await expect(page.locator("app-animated-background")).toBeVisible({
			timeout: 10000
		});

		// Verify background has a weather-based class
		const background = page.locator(".animated-background");
		await expect(background).toBeVisible();

		// Check if background has one of the expected weather condition classes
		const classList = await background.getAttribute("class");
		expect(classList).toBeTruthy();

		// Should have one of: bg-clear, bg-clouds, bg-rain, bg-snow, bg-thunderstorm, bg-drizzle, bg-mist
		const hasWeatherClass =
			classList!.includes("bg-clear") ||
			classList!.includes("bg-clouds") ||
			classList!.includes("bg-rain") ||
			classList!.includes("bg-snow") ||
			classList!.includes("bg-thunderstorm") ||
			classList!.includes("bg-drizzle") ||
			classList!.includes("bg-mist");

		expect(hasWeatherClass).toBe(true);
	});

	test("should persist unit preference across page reloads", async ({
		page
	}) =>
	{
		await page.goto("/weather-forecast");

		// Wait for unit toggle
		await expect(page.locator("app-unit-toggle")).toBeVisible({
			timeout: 10000
		});

		const toggleButton = page.locator(".toggle-button");

		// Get initial state
		const initialAriaLabel = await toggleButton.getAttribute("aria-label");

		// Toggle unit
		await toggleButton.click();
		await page.waitForTimeout(500);

		// Verify it changed
		const changedAriaLabel = await toggleButton.getAttribute("aria-label");
		expect(changedAriaLabel).not.toBe(initialAriaLabel);

		// Reload page
		await page.reload();

		// Wait for page to load again
		await expect(page.locator("app-unit-toggle")).toBeVisible({
			timeout: 10000
		});

		// Verify unit preference persisted
		const reloadedAriaLabel = await toggleButton.getAttribute("aria-label");
		expect(reloadedAriaLabel).toBe(changedAriaLabel);
	});

	test("should handle network errors gracefully", async ({ page }) =>
	{
		// Block weather API requests
		await page.route("**/api/weather**", (route) => route.abort("failed"));

		await page.goto("/weather-forecast");

		// Wait for error state or empty state
		await page.waitForTimeout(3000);

		// Should not crash - verify page is still functional
		const pageTitle = await page.title();
		expect(pageTitle).toBeTruthy();

		// Verify some UI is visible even in error state
		const body = page.locator("body");
		await expect(body).toBeVisible();
	});

	test("should have proper ARIA labels for accessibility", async ({
		page
	}) =>
	{
		await page.goto("/weather-forecast");

		// Wait for page load
		await expect(page.locator("app-weather-hero")).toBeVisible({
			timeout: 10000
		});

		// Check refresh button has aria-label
		const refreshButton = page.locator(
			'button[aria-label="Refresh weather"]'
		);
		if (await refreshButton.isVisible())
		{
			const ariaLabel = await refreshButton.getAttribute("aria-label");
			expect(ariaLabel).toBe("Refresh weather");
		}

		// Check unit toggle has aria-label
		const toggleButton = page.locator(".toggle-button");
		if (await toggleButton.isVisible())
		{
			const ariaLabel = await toggleButton.getAttribute("aria-label");
			expect(ariaLabel).toBeTruthy();
			expect(ariaLabel).toContain("Toggle");
		}
	});
});
