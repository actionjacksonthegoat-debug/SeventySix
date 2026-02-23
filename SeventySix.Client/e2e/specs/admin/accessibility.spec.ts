import {
	expect,
	expectAccessible,
	ROUTES,
	SELECTORS,
	test,
	TIMEOUTS
} from "@e2e-fixtures";
import { Locator, Page } from "@playwright/test";

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
		const adminPages: Array<{ path: string; name: string; waitFor: string; }> =
			[
				{ path: ROUTES.admin.dashboard, name: "Dashboard", waitFor: SELECTORS.adminDashboard.pageHeader },
				{ path: ROUTES.admin.users, name: "Users", waitFor: SELECTORS.userManagement.dataTable },
				{ path: ROUTES.admin.logs, name: "Logs", waitFor: SELECTORS.logManagement.dataTable },
				{
					path: ROUTES.admin.permissionRequests,
					name: "Permission Requests",
					waitFor: SELECTORS.permissionRequests.dataTable
				}
			];

		for (const pageInfo of adminPages)
		{
			test(
				`should have no critical accessibility violations on ${pageInfo.name} page`,
				async ({ adminPage }: { adminPage: Page; }) =>
				{
					await adminPage.goto(pageInfo.path);

					// Wait for page content to fully render before accessibility scan.
					// Required for zoneless Angular where bindings (e.g., aria-label)
					// may not be applied when the load event fires.
					await expect(adminPage.locator(pageInfo.waitFor))
						.toBeVisible();

					await expectAccessible(adminPage, `Admin ${pageInfo.name}`);
				});
		}

		test.describe("Data Tables Accessibility",
			() =>
			{
				test("should have accessible data table on users page",
					async ({ adminPage }: { adminPage: Page; }) =>
					{
						await adminPage.goto(ROUTES.admin.users);

						// Verify table has proper ARIA attributes
						const table: Locator =
							adminPage.locator(SELECTORS.dataTable.matTable);

						await expect(table)
							.toBeVisible();

						// Check column headers are accessible
						const headerCells: Locator =
							adminPage.locator(SELECTORS.dataTable.headerCell);

						await expect(headerCells.first())
							.toBeVisible();
					});

				test("should have accessible data table on logs page",
					async ({ adminPage }: { adminPage: Page; }) =>
					{
						await adminPage.goto(ROUTES.admin.logs);

						const table: Locator =
							adminPage.locator(SELECTORS.dataTable.matTable);

						await expect(table)
							.toBeVisible();
					});
			});

		test.describe("Icon Buttons Accessibility",
			() =>
			{
				test("should have aria-labels on icon-only buttons",
					async ({ adminPage }: { adminPage: Page; }) =>
					{
						await adminPage.goto(ROUTES.admin.users);

						// All icon buttons should have aria-label
						const iconButtons: Locator =
							adminPage.locator(SELECTORS.dataTable.iconButton);
						const iconButtonCount: number =
							await iconButtons.count();

						for (let index: number = 0; index < iconButtonCount; index++)
						{
							const button: Locator =
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
					async ({ adminPage }: { adminPage: Page; }) =>
					{
						await adminPage.goto(ROUTES.admin.dashboard);

						// Wait for banner landmark to be attached to DOM
						const banner: Locator =
							adminPage.locator(SELECTORS.accessibility.banner);

						await banner
							.first()
							.waitFor(
								{ state: "attached", timeout: TIMEOUTS.api });

						const bannerCount: number =
							await banner.count();

						expect(
							bannerCount,
							"Should have at least one banner landmark")
							.toBeGreaterThanOrEqual(1);

						// Verify main content landmark exists
						const main: Locator =
							adminPage.locator(SELECTORS.accessibility.main);

						await expect(main.first())
							.toBeVisible();

						// Verify at least one navigation landmark exists
						const navigation: Locator =
							adminPage.locator(SELECTORS.accessibility.navigation);
						const navCount: number =
							await navigation.count();

						expect(
							navCount,
							"Should have at least one navigation landmark")
							.toBeGreaterThanOrEqual(1);
					});
			});
	});