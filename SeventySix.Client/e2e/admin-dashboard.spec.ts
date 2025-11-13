import { test, expect } from "@playwright/test";

/**
 * E2E Tests for Admin Dashboard
 * Tests complete user flows through the admin dashboard
 */
test.describe("Admin Dashboard", () =>
{
	test.beforeEach(async ({ page }) =>
	{
		// Navigate to admin dashboard before each test
		await page.goto("/admin/dashboard");
	});

	test("should load and display all dashboard sections", async ({ page }) =>
	{
		// Wait for dashboard to load
		await expect(page.locator("h1")).toContainText("Admin Dashboard");

		// Verify statistics cards section exists
		await expect(page.locator("app-statistics-cards")).toBeVisible();

		// Verify error trend chart section exists
		await expect(page.locator("app-error-trend-chart")).toBeVisible();

		// Verify API statistics table section exists
		await expect(page.locator("app-api-statistics-table")).toBeVisible();

		// Verify health status panel section exists
		await expect(page.locator("app-health-status-panel")).toBeVisible();
	});

	test("should display statistics cards with data", async ({ page }) =>
	{
		// Wait for statistics cards to load
		await page.waitForSelector("app-statistics-cards mat-card", {
			state: "visible"
		});

		// Verify statistics cards are displayed
		const cards = page.locator("app-statistics-cards mat-card");
		await expect(cards).toHaveCount(6);

		// Verify cards have content (not just loading spinners)
		const firstCard = cards.first();
		await expect(firstCard).toBeVisible();
		await expect(firstCard.locator(".stat-label")).toBeVisible();
	});

	test("should display error trend chart", async ({ page }) =>
	{
		// Wait for chart to render
		await page.waitForSelector("app-error-trend-chart canvas", {
			state: "visible",
			timeout: 10000
		});

		// Verify chart canvas exists
		const canvas = page.locator("app-error-trend-chart canvas");
		await expect(canvas).toBeVisible();
	});

	test("should switch chart time periods", async ({ page }) =>
	{
		// Wait for chart to load
		await page.waitForSelector("app-error-trend-chart", {
			state: "visible"
		});

		// Find and click period buttons if they exist
		const periodButtons = page.locator(
			"app-error-trend-chart button[mat-button]"
		);

		const buttonCount = await periodButtons.count();
		if (buttonCount > 0)
		{
			// Click first period button (e.g., "24h")
			await periodButtons.first().click();

			// Wait for chart to update
			await page.waitForTimeout(1000);

			// Verify chart still visible after period change
			const canvas = page.locator("app-error-trend-chart canvas");
			await expect(canvas).toBeVisible();
		}
	});

	test("should display API statistics table", async ({ page }) =>
	{
		// Wait for table to load
		await page.waitForSelector("app-api-statistics-table", {
			state: "visible"
		});

		// Verify table exists
		const table = page.locator("app-api-statistics-table table");
		await expect(table).toBeVisible();

		// Verify table has rows (header + data rows)
		const rows = table.locator("tr");
		const rowCount = await rows.count();
		expect(rowCount).toBeGreaterThan(0);
	});

	test("should display health status panel", async ({ page }) =>
	{
		// Wait for health panel to load
		await page.waitForSelector("app-health-status-panel", {
			state: "visible"
		});

		// Verify health panel exists
		const healthPanel = page.locator("app-health-status-panel");
		await expect(healthPanel).toBeVisible();

		// Verify overall status chip exists
		const statusChip = healthPanel.locator("mat-chip").first();
		await expect(statusChip).toBeVisible();
	});

	test("should refresh statistics when refresh button clicked", async ({
		page
	}) =>
	{
		// Wait for statistics cards to load
		await page.waitForSelector("app-statistics-cards", {
			state: "visible"
		});

		// Find refresh button
		const refreshButton = page.locator(
			"app-statistics-cards button[aria-label*='Refresh']"
		);

		if ((await refreshButton.count()) > 0)
		{
			// Click refresh button
			await refreshButton.click();

			// Wait for loading spinner to appear and disappear
			await page.waitForTimeout(500);

			// Verify data still displayed
			const cards = page.locator("app-statistics-cards mat-card");
			await expect(cards.first()).toBeVisible();
		}
	});

	test("should navigate to admin dashboard from home", async ({ page }) =>
	{
		// Start at home page
		await page.goto("/");

		// Look for admin dashboard link in navigation
		const adminLink = page.locator('a[href*="/admin/dashboard"]').first();

		if ((await adminLink.count()) > 0)
		{
			// Click admin dashboard link
			await adminLink.click();

			// Verify navigated to admin dashboard
			await expect(page).toHaveURL(/.*admin\/dashboard/);
			await expect(page.locator("h1")).toContainText("Admin Dashboard");
		}
		else
		{
			// Direct navigation if link not in nav
			await page.goto("/admin/dashboard");
			await expect(page.locator("h1")).toContainText("Admin Dashboard");
		}
	});

	test("should handle errors gracefully", async ({ page }) =>
	{
		// Navigate to dashboard (services might fail)
		await page.goto("/admin/dashboard");

		// Wait for page to load
		await page.waitForTimeout(2000);

		// Verify dashboard still renders even if some components have errors
		const dashboard = page.locator("app-admin-dashboard");
		await expect(dashboard).toBeVisible();

		// At minimum, the main container should be visible
		const compiled = page.locator(".dashboard-container, .dashboard-grid");
		await expect(compiled.first()).toBeVisible();
	});

	test("should be responsive on mobile viewport", async ({ page }) =>
	{
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });

		// Wait for dashboard to load
		await expect(page.locator("h1")).toContainText("Admin Dashboard");

		// Verify all sections still visible on mobile
		await expect(page.locator("app-statistics-cards")).toBeVisible();
		await expect(page.locator("app-error-trend-chart")).toBeVisible();
		await expect(page.locator("app-api-statistics-table")).toBeVisible();
		await expect(page.locator("app-health-status-panel")).toBeVisible();

		// Verify layout is stacked (not side-by-side)
		const dashboardGrid = page.locator(".dashboard-grid");
		const gridStyles = await dashboardGrid.evaluate(
			(el) => window.getComputedStyle(el).display
		);
		expect(gridStyles).toBe("grid");
	});
});
