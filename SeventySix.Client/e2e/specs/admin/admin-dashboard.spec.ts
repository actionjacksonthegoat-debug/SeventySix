import {
	test,
	expect,
	ROUTES,
	PAGE_TEXT
} from "../../fixtures";

/**
 * E2E Tests for Admin Dashboard
 *
 * The dashboard has 4 tabs:
 * 1. System Overview - Grafana dashboard embed for system health
 * 2. API Metrics - Grafana dashboard embed for API endpoint metrics
 * 3. Cache Metrics - Grafana dashboard embed for Valkey cache metrics
 * 4. External Systems - Third-party API statistics table + Observability tool buttons
 */
test.describe("Admin Dashboard",
	() =>
	{
		test.beforeEach(
			async ({ page }) =>
			{
				await page.goto(ROUTES.admin.dashboard);
			});

		test.describe("Page Structure",
			() =>
			{
				test("should display dashboard title and toolbar",
					async ({ adminDashboardPage }) =>
					{
						await expect(adminDashboardPage.toolbarHeading)
							.toHaveText(PAGE_TEXT.headings.adminDashboard);
						await expect(adminDashboardPage.toolbarIcon)
							.toContainText(PAGE_TEXT.icons.dashboard);
					});

				test("should display four tabs",
					async ({ adminDashboardPage }) =>
					{
						// Wait for tabs to be visible before counting
						await adminDashboardPage.tabs.first().waitFor({ state: "visible" });

						const tabCount: number =
							await adminDashboardPage.getTabCount();

						expect(tabCount)
							.toBe(4);
						await expect(adminDashboardPage.getTab(0))
							.toContainText(PAGE_TEXT.adminDashboard.tabs.systemOverview);
						await expect(adminDashboardPage.getTab(1))
							.toContainText(PAGE_TEXT.adminDashboard.tabs.apiMetrics);
						await expect(adminDashboardPage.getTab(2))
							.toContainText(PAGE_TEXT.adminDashboard.tabs.cacheMetrics);
						await expect(adminDashboardPage.getTab(3))
							.toContainText(PAGE_TEXT.adminDashboard.tabs.externalSystems);
					});
			});

		test.describe("Panel 1: System Overview Tab",
			() =>
			{
				test("should display Grafana dashboard embed for system health",
					async ({ adminDashboardPage }) =>
					{
						// System Overview is the default tab
						await expect(adminDashboardPage.grafanaEmbed.first())
							.toBeVisible();
					});

				test("should have System Health & Metrics title",
					async ({ adminDashboardPage }) =>
					{
						await expect(adminDashboardPage.grafanaEmbed.first())
							.toHaveAttribute("title", PAGE_TEXT.adminDashboard.embedTitles.systemHealth);
					});
			});

		test.describe("Panel 2: API Metrics Tab",
			() =>
			{
				test.beforeEach(
					async ({ adminDashboardPage }) =>
					{
						// Click API Metrics tab
						await adminDashboardPage.selectTab(1);
					});

				test("should display Grafana embed with API Endpoint Metrics title",
					async ({ adminDashboardPage }) =>
					{
						await expect(adminDashboardPage.getGrafanaByTitle(PAGE_TEXT.adminDashboard.embedTitles.apiEndpoint))
							.toBeVisible();
					});
			});

		test.describe("Panel 3: Cache Metrics Tab",
			() =>
			{
				test.beforeEach(
					async ({ adminDashboardPage }) =>
					{
						// Click Cache Metrics tab
						await adminDashboardPage.selectTab(2);
					});

				test("should display Grafana embed with Valkey Cache Metrics title",
					async ({ adminDashboardPage }) =>
					{
						await expect(adminDashboardPage.getGrafanaByTitle(PAGE_TEXT.adminDashboard.embedTitles.valkeyCache))
							.toBeVisible();
					});
			});

		test.describe("Panel 4: External Systems Tab",
			() =>
			{
				test.beforeEach(
					async ({ adminDashboardPage }) =>
					{
						// Click External Systems tab
						await adminDashboardPage.selectTab(3);
					});

				test("should display API statistics table",
					async ({ adminDashboardPage }) =>
					{
						await expect(adminDashboardPage.apiStatsTable)
							.toBeVisible();
					});

				test("should display Observability Tools card",
					async ({ adminDashboardPage }) =>
					{
						await expect(adminDashboardPage.observabilityCard)
							.toBeVisible();
					});

				test("should display Jaeger Tracing button",
					async ({ adminDashboardPage }) =>
					{
						await expect(adminDashboardPage.jaegerButton)
							.toBeVisible();
					});

				test("should display Prometheus Metrics button",
					async ({ adminDashboardPage }) =>
					{
						await expect(adminDashboardPage.prometheusButton)
							.toBeVisible();
					});

				test("should display Grafana Full View button",
					async ({ adminDashboardPage }) =>
					{
						await expect(adminDashboardPage.grafanaButton)
							.toBeVisible();
					});

				test("should have three observability buttons",
					async ({ adminDashboardPage }) =>
					{
						await expect(adminDashboardPage.jaegerButton)
							.toBeVisible();
						await expect(adminDashboardPage.prometheusButton)
							.toBeVisible();
						await expect(adminDashboardPage.grafanaButton)
							.toBeVisible();
					});
			});

		test.describe("Tab Navigation",
			() =>
			{
				test("should switch between tabs",
					async ({ adminDashboardPage }) =>
					{
						// Verify System Overview tab is active by default
						await expect(adminDashboardPage.getTab(0))
							.toHaveClass(/mdc-tab--active/);

						// Switch to API Metrics tab
						await adminDashboardPage.selectTab(1);

						await expect(adminDashboardPage.getTab(1))
							.toHaveClass(/mdc-tab--active/);

						// Switch to Cache Metrics tab
						await adminDashboardPage.selectTab(2);

						await expect(adminDashboardPage.getTab(2))
							.toHaveClass(/mdc-tab--active/);

						// Switch to External Systems tab
						await adminDashboardPage.selectTab(3);

						await expect(adminDashboardPage.getTab(3))
							.toHaveClass(/mdc-tab--active/);
					});
			});
	});
