import { test, expect, Page, Locator } from "@playwright/test";

/**
 * E2E Tests for Admin Dashboard
 *
 * The dashboard has 3 tabs:
 * 1. System Overview - Grafana dashboard embed for system health
 * 2. API Metrics - Grafana dashboard embed for API endpoint metrics
 * 3. External Systems - Third-party API statistics table + Observability tool buttons
 */
test.describe("Admin Dashboard", () =>
{
	test.beforeEach(async ({ page }: { page: Page }) =>
	{
		await page.goto("/admin/dashboard");
	});

	test.describe("Page Structure", () =>
	{
		test("should display dashboard title and toolbar", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			await expect(
				page.locator(".admin-dashboard mat-toolbar h1")
			).toHaveText("Admin Dashboard");
			await expect(
				page.locator(".admin-dashboard mat-toolbar mat-icon")
			).toContainText("dashboard");
		});

		test("should display three tabs", async ({ page }: { page: Page }) =>
		{
			const tabs: Locator = page.locator(".mat-mdc-tab");
			await expect(tabs).toHaveCount(3);
			await expect(tabs.nth(0)).toContainText("System Overview");
			await expect(tabs.nth(1)).toContainText("API Metrics");
			await expect(tabs.nth(2)).toContainText("External Systems");
		});
	});

	test.describe("Panel 1: System Overview Tab", () =>
	{
		test("should display Grafana dashboard embed for system health", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			// System Overview is the default tab
			const grafanaEmbed: Locator = page
				.locator("app-grafana-dashboard-embed")
				.first();
			await expect(grafanaEmbed).toBeVisible();
		});

		test("should have System Health & Metrics title", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const embedTitle: Locator = page
				.locator("app-grafana-dashboard-embed")
				.first();
			await expect(embedTitle).toHaveAttribute(
				"title",
				"System Health & Metrics"
			);
		});
	});

	test.describe("Panel 2: API Metrics Tab", () =>
	{
		test.beforeEach(async ({ page }: { page: Page }) =>
		{
			// Click API Metrics tab
			await page.locator(".mat-mdc-tab").nth(1).click();
		});

		test("should display Grafana dashboard embed for API metrics", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const grafanaEmbed: Locator = page.getByTitle(
				"API Endpoint Metrics"
			);
			await expect(grafanaEmbed).toBeVisible();
		});

		test("should have API Endpoint Metrics title", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const embedTitle: Locator = page.getByTitle("API Endpoint Metrics");
			await expect(embedTitle).toBeVisible();
		});
	});

	test.describe("Panel 3: External Systems Tab", () =>
	{
		test.beforeEach(async ({ page }: { page: Page }) =>
		{
			// Click External Systems tab
			await page.locator(".mat-mdc-tab").nth(2).click();
		});

		test("should display API statistics table", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const statsTable: Locator = page.locator(
				"app-api-statistics-table"
			);
			await expect(statsTable).toBeVisible();
		});

		test("should display Observability Tools card", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const obsCard: Locator = page.locator(
				"mat-card-title:has-text('Observability Tools')"
			);
			await expect(obsCard).toBeVisible();
		});

		test("should display Jaeger Tracing button", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const jaegerButton: Locator = page.locator(
				"button:has-text('Jaeger Tracing')"
			);
			await expect(jaegerButton).toBeVisible();
		});

		test("should display Prometheus Metrics button", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const prometheusButton: Locator = page.locator(
				"button:has-text('Prometheus Metrics')"
			);
			await expect(prometheusButton).toBeVisible();
		});

		test("should display Grafana Full View button", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const grafanaButton: Locator = page.locator(
				"button:has-text('Grafana Full View')"
			);
			await expect(grafanaButton).toBeVisible();
		});

		test("should have three observability buttons", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			const obsButtons: Locator = page.locator(
				".observability-links button"
			);
			await expect(obsButtons).toHaveCount(3);
		});
	});

	test.describe("Tab Navigation", () =>
	{
		test("should switch between tabs", async ({ page }: { page: Page }) =>
		{
			// Verify System Overview tab is active by default
			const systemOverviewTab: Locator = page
				.locator(".mat-mdc-tab")
				.nth(0);
			await expect(systemOverviewTab).toHaveClass(/mdc-tab--active/);

			// Switch to API Metrics tab
			await page.locator(".mat-mdc-tab").nth(1).click();
			const apiMetricsTab: Locator = page.locator(".mat-mdc-tab").nth(1);
			await expect(apiMetricsTab).toHaveClass(/mdc-tab--active/);

			// Switch to External Systems tab
			await page.locator(".mat-mdc-tab").nth(2).click();
			const externalSystemsTab: Locator = page
				.locator(".mat-mdc-tab")
				.nth(2);
			await expect(externalSystemsTab).toHaveClass(/mdc-tab--active/);
		});
	});
});
