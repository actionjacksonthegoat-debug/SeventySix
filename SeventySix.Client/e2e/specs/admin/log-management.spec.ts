import { Page } from "@playwright/test";
import {
	test,
	expect,
	ROUTES,
	SELECTORS,
	PAGE_TEXT,
	createRouteRegex
} from "../../fixtures";

/**
 * E2E Tests for Log Management Page
 *
 * Priority: P1 (Admin Feature)
 * Tests the log management functionality including:
 * - Page structure and content
 * - Log list display
 */
test.describe("Log Management Page",
	() =>
	{
		test.beforeEach(
			async ({ adminPage }: { adminPage: Page }) =>
			{
				await adminPage.goto(ROUTES.admin.logs);
				await adminPage.waitForLoadState("load");
			});

		test.describe("Page Structure",
			() =>
			{
				test("should display log management heading",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						const heading =
							adminPage.locator(SELECTORS.logManagement.pageHeader).locator("h1");

						await expect(heading)
							.toHaveText(PAGE_TEXT.logManagement.title);
					});

				test("should display page subtitle",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						const pageHeader =
							adminPage.locator(SELECTORS.logManagement.pageHeader);

						await expect(pageHeader)
							.toContainText(PAGE_TEXT.logManagement.subtitle);
					});

				test("should display log list component",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						const logList =
							adminPage.locator(SELECTORS.logManagement.logList);

						await expect(logList)
							.toBeVisible();
					});

				test("should display data table",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						const dataTable =
							adminPage.locator(SELECTORS.logManagement.dataTable);

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
