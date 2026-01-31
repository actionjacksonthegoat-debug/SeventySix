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
 * E2E Tests for User Management Page
 *
 * Priority: P0 (Core Admin Feature)
 * Tests the user management functionality including:
 * - Page structure and content
 * - Data table display
 * - Navigation to create user
 */
test.describe("User Management Page",
	() =>
	{
		test.beforeEach(
			async ({ adminPage }: { adminPage: Page }) =>
			{
				await adminPage.goto(ROUTES.admin.users);
				await adminPage.waitForLoadState("load");
			});

		test.describe("Page Structure",
			() =>
			{
				test("should display user management heading",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						const heading =
							adminPage.locator(SELECTORS.userManagement.pageHeader).locator("h1");

						await expect(heading)
							.toHaveText(PAGE_TEXT.userManagement.title);
					});

				test("should display page subtitle",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						const pageHeader =
							adminPage.locator(SELECTORS.userManagement.pageHeader);

						await expect(pageHeader)
							.toContainText(PAGE_TEXT.userManagement.subtitle);
					});

				test("should display create user button",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						const createButton =
							adminPage.locator(SELECTORS.userManagement.createUserButton);

						await expect(createButton)
							.toBeVisible();
						await expect(createButton)
							.toContainText(PAGE_TEXT.userManagement.createUser);
					});

				test("should display user list component",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						const userList =
							adminPage.locator(SELECTORS.userManagement.userList);

						await expect(userList)
							.toBeVisible();
					});

				test("should display data table",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						const dataTable =
							adminPage.locator(SELECTORS.userManagement.dataTable);

						await expect(dataTable)
							.toBeVisible();
					});
			});

		test.describe("Navigation",
			() =>
			{
				test("should navigate to create user page when clicking create button",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						const createButton =
							adminPage.locator(SELECTORS.userManagement.createUserButton);

						await createButton.click();

						await expect(adminPage)
							.toHaveURL(createRouteRegex(ROUTES.admin.userCreate));
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
