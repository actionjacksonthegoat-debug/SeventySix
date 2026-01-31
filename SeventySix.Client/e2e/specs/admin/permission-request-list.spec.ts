import { Page } from "@playwright/test";
import {
	test,
	expect,
	ROUTES,
	SELECTORS,
	PAGE_TEXT
} from "../../fixtures";

/**
 * E2E Tests for Permission Request List Page
 *
 * Priority: P1 (Admin Feature)
 * Tests the permission request management including:
 * - Page structure and content
 * - Request list display
 */
test.describe("Permission Request List Page",
	() =>
	{
		test.beforeEach(
			async ({ adminPage }: { adminPage: Page }) =>
			{
				await adminPage.goto(ROUTES.admin.permissionRequests);
				await adminPage.waitForLoadState("load");
			});

		test.describe("Page Structure",
			() =>
			{
				test("should display permission requests heading",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						const heading =
							adminPage.locator(SELECTORS.permissionRequests.pageHeader).locator("h1");

						await expect(heading)
							.toHaveText(PAGE_TEXT.permissionRequests.title);
					});

				test("should display page subtitle",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						const pageHeader =
							adminPage.locator(SELECTORS.permissionRequests.pageHeader);

						await expect(pageHeader)
							.toContainText(PAGE_TEXT.permissionRequests.subtitle);
					});

				test("should display data table component",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						const dataTable =
							adminPage.locator(SELECTORS.permissionRequests.dataTable);

						await expect(dataTable)
							.toBeVisible();
					});
			});

		test.describe("Data Table",
			() =>
			{
				test("should display table with header row",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						const headerRow =
							adminPage.locator(SELECTORS.dataTable.headerRow);

						await expect(headerRow)
							.toBeVisible();
					});
			});
	});
