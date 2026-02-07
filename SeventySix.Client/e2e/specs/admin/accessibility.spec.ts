import { Page } from "@playwright/test";
import {
	test,
	expect,
	ROUTES,
	ROUTE_GROUPS,
	SELECTORS
} from "../../fixtures";
import AxeBuilder from "@axe-core/playwright";
import type { Result } from "axe-core";

/**
 * WCAG Accessibility E2E Tests for Admin Pages
 *
 * Tests cover WCAG 2.2 AA compliance across admin routes.
 * Uses authenticated admin context for testing protected pages.
 *
 * @wcag 1.1.1 Non-text Content (Level A)
 * @wcag 1.4.3 Contrast (Minimum) (Level AA)
 * @wcag 2.1.1 Keyboard (Level A)
 * @wcag 2.4.7 Focus Visible (Level AA)
 * @wcag 4.1.2 Name, Role, Value (Level A)
 */
test.describe("Admin Routes - WCAG Accessibility",
	() =>
	{
		const adminPages =
			[
				{ path: ROUTES.admin.dashboard, name: "Dashboard", waitFor: SELECTORS.adminDashboard.pageHeader },
				{ path: ROUTES.admin.users, name: "Users", waitFor: SELECTORS.userManagement.dataTable },
				{ path: ROUTES.admin.logs, name: "Logs", waitFor: SELECTORS.logManagement.dataTable },
				{ path: ROUTES.admin.permissionRequests, name: "Permission Requests", waitFor: SELECTORS.permissionRequests.dataTable }
			];

		for (const pageInfo of adminPages)
		{
			test(`should have no critical accessibility violations on ${pageInfo.name} page`,
				async ({ adminPage }: { adminPage: Page }) =>
				{
					await adminPage.goto(pageInfo.path);
					await adminPage.waitForLoadState("load");

					// Wait for page content to fully render before accessibility scan.
					// Required for zoneless Angular where bindings (e.g., aria-label)
					// may not be applied when the load event fires.
					await expect(adminPage.locator(pageInfo.waitFor))
						.toBeVisible();

					const axeResults =
						await new AxeBuilder(
							{ page: adminPage })
							.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
							.analyze();

					const criticalViolations: Result[] =
						axeResults.violations.filter(
							(violation: Result) =>
								violation.impact === "critical"
								|| violation.impact === "serious");

					// eslint-disable-next-line playwright/no-conditional-in-test
					if (criticalViolations.length > 0)
					{
						console.log(
							`Accessibility violations on Admin ${pageInfo.name}:`,
							JSON.stringify(
								criticalViolations.map(
									(violation: Result) =>
									(
										{
											id: violation.id,
											impact: violation.impact,
											description: violation.description,
											nodes: violation.nodes.map(
												(node) => node.html).slice(0, 3)
										})),
								null,
								2));
					}

					expect(
						criticalViolations,
						`Found ${criticalViolations.length} critical/serious violations on Admin ${pageInfo.name}`)
						.toHaveLength(0);
				});
		}

		test.describe("Data Tables Accessibility",
			() =>
			{
				test("should have accessible data table on users page",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						await adminPage.goto(ROUTES.admin.users);
						await adminPage.waitForLoadState("load");

						// Verify table has proper ARIA attributes
						const table =
							adminPage.locator("table[mat-table]");

						await expect(table)
							.toBeVisible();

						// Check column headers are accessible
						const headerCells =
							adminPage.locator("th[mat-header-cell]");

						await expect(headerCells.first())
							.toBeVisible();
					});

				test("should have accessible data table on logs page",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						await adminPage.goto(ROUTES.admin.logs);
						await adminPage.waitForLoadState("load");

						const table =
							adminPage.locator("table[mat-table]");

						await expect(table)
							.toBeVisible();
					});
			});

		test.describe("Icon Buttons Accessibility",
			() =>
			{
				test("should have aria-labels on icon-only buttons",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						await adminPage.goto(ROUTES.admin.users);
						await adminPage.waitForLoadState("load");

						// All icon buttons should have aria-label
						const iconButtons =
							adminPage.locator("button[mat-icon-button]");
						const iconButtonCount =
							await iconButtons.count();

						for (let index = 0; index < iconButtonCount; index++)
						{
							const button =
								iconButtons.nth(index);

							await expect(
								button,
								`Icon button ${index} should have aria-label`)
								.toHaveAttribute("aria-label");
						}
					});
			});

		test.describe("Navigation Accessibility",
			() =>
			{
				test("should have proper landmark regions",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						await adminPage.goto(ROUTES.admin.dashboard);
						await adminPage.waitForLoadState("load");

						// Wait for banner landmark to be attached to DOM
						const banner =
							adminPage.locator(SELECTORS.accessibility.banner);

						await banner.first()
							.waitFor({ state: "attached", timeout: 10000 });

						const bannerCount =
							await banner.count();

						expect(
							bannerCount,
							"Should have at least one banner landmark")
							.toBeGreaterThanOrEqual(1);

						// Verify main content landmark exists
						const main =
							adminPage.locator(SELECTORS.accessibility.main);

						await expect(main.first())
							.toBeVisible();

						// Verify at least one navigation landmark exists
						const navigation =
							adminPage.locator(SELECTORS.accessibility.navigation);
						const navCount =
							await navigation.count();

						expect(
							navCount,
							"Should have at least one navigation landmark")
							.toBeGreaterThanOrEqual(1);
					});
			});
	});
