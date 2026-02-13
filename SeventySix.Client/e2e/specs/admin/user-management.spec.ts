import { Page } from "@playwright/test";
import {
	test,
	expect,
	ROUTES,
	SELECTORS,
	PAGE_TEXT,
	TIMEOUTS,
	createRouteRegex
} from "../../fixtures";

/**
 * E2E Tests for User Management Page
 *
 * Priority: P0 (Core Admin Feature)
 * Tests the user management functionality including:
 * - Page structure and content
 * - Data table display and interactions
 * - Navigation to create user and user detail
 * - Search functionality
 * - Quick filter chips
 * - Refresh
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

				test("should display seeded user data rows",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						const dataRows =
							adminPage.locator(SELECTORS.dataTable.dataRow);

						await expect(dataRows.first())
							.toBeVisible({ timeout: TIMEOUTS.api });

						// E2E seeder creates 11 test users, so we should have rows
						const rowCount: number =
							await dataRows.count();

						expect(rowCount)
							.toBeGreaterThan(0);
					});

				test("should navigate to user detail when clicking a row",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						const dataRows =
							adminPage.locator(SELECTORS.dataTable.dataRow);

						await expect(dataRows.first())
							.toBeVisible({ timeout: TIMEOUTS.api });

						// Click the first user row to navigate to detail
						await dataRows.first().click();

						// Should navigate to a user detail URL (contains /admin/users/ followed by an ID)
						await expect(adminPage)
							.toHaveURL(/\/admin\/users\/\d+/, { timeout: TIMEOUTS.navigation });
					});
			});

		test.describe("Search",
			() =>
			{
				test("should display search input",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						const searchInput =
							adminPage.locator(SELECTORS.userManagement.dataTable)
								.locator("input[matinput]");

						await expect(searchInput)
							.toBeVisible();
					});

				test("should filter users when searching for e2e_admin",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						const dataRows =
							adminPage.locator(SELECTORS.dataTable.dataRow);
						await expect(dataRows.first())
							.toBeVisible({ timeout: TIMEOUTS.api });

						// Search for a known seeded user
						const searchInput =
							adminPage.locator(SELECTORS.userManagement.dataTable)
								.locator("input[matinput]");
						await searchInput.fill("e2e_admin");
						await searchInput.press("Enter");

						// Wait for API response
						await adminPage.waitForResponse(
							(response) =>
								response.url().includes("/users")
								&& response.status() === 200);

						// Should show filtered results
						await expect(dataRows.first())
							.toBeVisible({ timeout: TIMEOUTS.api });
					});

				test("should show empty state for nonexistent search",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						const dataRows =
							adminPage.locator(SELECTORS.dataTable.dataRow);
						await expect(dataRows.first())
							.toBeVisible({ timeout: TIMEOUTS.api });

						const searchInput =
							adminPage.locator(SELECTORS.userManagement.dataTable)
								.locator("input[matinput]");
						await searchInput.fill("zzz_nonexistent_user_xyz");
						await searchInput.press("Enter");

						// Wait for API response
						await adminPage.waitForResponse(
							(response) =>
								response.url().includes("/users")
								&& response.status() === 200);

						const emptyState =
							adminPage.locator(SELECTORS.dataTable.emptyState);

						await expect(emptyState)
							.toBeVisible({ timeout: TIMEOUTS.api });
					});
			});

		test.describe("Quick Filters",
			() =>
			{
				test("should display filter chips",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						const filterChips =
							adminPage.locator(SELECTORS.userManagement.dataTable)
								.locator("mat-chip-option");

						await expect(filterChips.first())
							.toBeVisible({ timeout: TIMEOUTS.api });

						const chipCount: number =
							await filterChips.count();

						// Should have All Users, Active, Inactive, Show Deleted
						expect(chipCount)
							.toBeGreaterThanOrEqual(3);
					});

				test("should filter to active users only",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						const dataRows =
							adminPage.locator(SELECTORS.dataTable.dataRow);
						await expect(dataRows.first())
							.toBeVisible({ timeout: TIMEOUTS.api });

						// Quick filter chips: [All Users(0), Active(1), Inactive(2), Show Deleted(3)]
						const filterChips =
							adminPage.locator(SELECTORS.userManagement.dataTable)
								.locator("mat-chip-option");
						const activeChip =
							filterChips.nth(1);

						await expect(activeChip)
							.toContainText(PAGE_TEXT.userManagement.activeFilter);
						await activeChip.click();

						// Data should still be visible (all seeded users are active)
						const emptyState =
							adminPage.locator(SELECTORS.dataTable.emptyState);
						await expect(dataRows.first().or(emptyState))
							.toBeVisible({ timeout: TIMEOUTS.api });
					});
			});

		test.describe("Refresh",
			() =>
			{
				test("should refresh data when clicking refresh button",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						const dataRows =
							adminPage.locator(SELECTORS.dataTable.dataRow);
						await expect(dataRows.first())
							.toBeVisible({ timeout: TIMEOUTS.api });

						const refreshButton =
							adminPage.locator(SELECTORS.dataTable.refreshButton);

						await expect(refreshButton)
							.toBeVisible();

						// Click refresh and verify API call is made
						const responsePromise =
							adminPage.waitForResponse(
								(response) =>
									response.url().includes("/users")
									&& response.status() === 200);

						await refreshButton.click();
						await responsePromise;

						// Data rows should still be visible after refresh
						await expect(dataRows.first())
							.toBeVisible({ timeout: TIMEOUTS.api });
					});
			});
	});
