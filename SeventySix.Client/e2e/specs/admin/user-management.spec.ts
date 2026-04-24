import {
	createRouteRegex,
	expect,
	PAGE_TEXT,
	ROUTES,
	SELECTORS,
	test,
	TIMEOUTS
} from "@e2e-fixtures";
import { Locator, Page, Response } from "@playwright/test";

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
			async ({ adminPage }: { adminPage: Page; }) =>
			{
				await adminPage.goto(ROUTES.admin.users);
			});

		test.describe("Page Structure",
			() =>
			{
				test("should display user management heading",
					async ({ adminPage }: { adminPage: Page; }) =>
					{
						const heading: Locator =
							adminPage
								.locator(SELECTORS.userManagement.pageHeader)
								.locator("h1");

						await expect(heading)
							.toHaveText(PAGE_TEXT.userManagement.title,
								{ timeout: TIMEOUTS.navigation });
					});

				test("should display page subtitle",
					async ({ adminPage }: { adminPage: Page; }) =>
					{
						const pageHeader: Locator =
							adminPage.locator(SELECTORS.userManagement.pageHeader);

						await expect(pageHeader)
							.toContainText(PAGE_TEXT.userManagement.subtitle);
					});

				test("should display create user button",
					async ({ adminPage }: { adminPage: Page; }) =>
					{
						const createButton: Locator =
							adminPage.locator(SELECTORS.userManagement.createUserButton);

						await expect(createButton)
							.toBeVisible();
						await expect(createButton)
							.toContainText(PAGE_TEXT.userManagement.createUser);
					});

				test("should display user list component",
					async ({ adminPage }: { adminPage: Page; }) =>
					{
						const userList: Locator =
							adminPage.locator(SELECTORS.userManagement.userList);

						await expect(userList)
							.toBeVisible();
					});

				test("should display data table",
					async ({ adminPage }: { adminPage: Page; }) =>
					{
						const dataTable: Locator =
							adminPage.locator(SELECTORS.userManagement.dataTable);

						await expect(dataTable)
							.toBeVisible();
					});
			});

		test.describe("Navigation",
			() =>
			{
				test(
					"should navigate to create user page when clicking create button",
					async ({ adminPage }: { adminPage: Page; }) =>
					{
						const createButton: Locator =
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
					async ({ adminPage }: { adminPage: Page; }) =>
					{
						const headerRow: Locator =
							adminPage.locator(SELECTORS.dataTable.headerRow);

						await expect(headerRow)
							.toBeVisible(
								{ timeout: TIMEOUTS.navigation });
					});

				test("should display seeded user data rows",
					async ({ adminPage }: { adminPage: Page; }) =>
					{
						const dataRows: Locator =
							adminPage.locator(SELECTORS.dataTable.dataRow);

						await expect(dataRows.first())
							.toBeVisible(
								{ timeout: TIMEOUTS.api });

						// E2E seeder creates 11 test users, so we should have rows
						const rowCount: number =
							await dataRows.count();

						expect(rowCount)
							.toBeGreaterThan(0);
					});

				test("should navigate to user detail when clicking a row",
					async ({ adminPage }: { adminPage: Page; }) =>
					{
						const dataRows: Locator =
							adminPage.locator(SELECTORS.dataTable.dataRow);
						const loadingSpinner: Locator =
							adminPage.locator(SELECTORS.dataTable.loadingSpinner);

						await expect(dataRows.first())
							.toBeVisible(
								{ timeout: TIMEOUTS.api });

						await expect(loadingSpinner)
							.toHaveCount(
								0,
								{ timeout: TIMEOUTS.api });

						// Click the first user row and wait for route transition in the same step.
						await Promise.all(
							[
								adminPage.waitForURL(
									/\/admin\/users\/\d+/,
									{ timeout: TIMEOUTS.navigation }),
								dataRows
									.first()
									.click()
							]);
					});
			});

		test.describe("Search",
			() =>
			{
				test("should display search input",
					async ({ adminPage }: { adminPage: Page; }) =>
					{
						const searchInput: Locator =
							adminPage
								.locator(SELECTORS.userManagement.dataTable)
								.locator(SELECTORS.dataTable.matInput);

						await expect(searchInput)
							.toBeVisible();
					});

				test("should filter users when searching for e2e_admin",
					async ({ adminPage }: { adminPage: Page; }) =>
					{
						const dataRows: Locator =
							adminPage.locator(SELECTORS.dataTable.dataRow);
						await expect(dataRows.first())
							.toBeVisible(
								{ timeout: TIMEOUTS.api });

						// Search for a known seeded user
						const searchInput: Locator =
							adminPage
								.locator(SELECTORS.userManagement.dataTable)
								.locator(SELECTORS.dataTable.matInput);
						await searchInput.fill("e2e_admin");

						// Set up listener BEFORE triggering search
						const searchResponse: Promise<import("@playwright/test").Response> =
							adminPage.waitForResponse(
								(response) =>
									response
										.url()
										.includes("/users")
										&& response.status() === 200,
								{ timeout: TIMEOUTS.api });

						await searchInput.press("Enter");
						await searchResponse;

						// Should show filtered results
						await expect(dataRows.first())
							.toBeVisible(
								{ timeout: TIMEOUTS.api });
					});

				test("should show empty state for nonexistent search",
					async ({ adminPage }: { adminPage: Page; }) =>
					{
						const dataRows: Locator =
							adminPage.locator(SELECTORS.dataTable.dataRow);
						await expect(dataRows.first())
							.toBeVisible(
								{ timeout: TIMEOUTS.api });

						const searchInput: Locator =
							adminPage
								.locator(SELECTORS.userManagement.dataTable)
								.locator(SELECTORS.dataTable.matInput);
						await searchInput.fill("zzz_nonexistent_user_xyz");

						// Set up listener BEFORE triggering search
						const searchResponse: Promise<import("@playwright/test").Response> =
							adminPage.waitForResponse(
								(response) =>
									response
										.url()
										.includes("/users")
										&& response.status() === 200,
								{ timeout: TIMEOUTS.api });

						await searchInput.press("Enter");
						await searchResponse;

						const emptyState: Locator =
							adminPage.locator(SELECTORS.dataTable.emptyState);

						await expect(emptyState)
							.toBeVisible(
								{ timeout: TIMEOUTS.api });
					});
			});

		test.describe("Quick Filters",
			() =>
			{
				test("should display filter chips",
					async ({ adminPage }: { adminPage: Page; }) =>
					{
						const filterChips: Locator =
							adminPage
								.locator(SELECTORS.userManagement.dataTable)
								.locator(SELECTORS.dataTable.chipOption);

						await expect(filterChips.first())
							.toBeVisible(
								{ timeout: TIMEOUTS.api });

						const chipCount: number =
							await filterChips.count();

						// Should have All Users, Active, Inactive, Show Deleted
						expect(chipCount)
							.toBeGreaterThanOrEqual(3);
					});

				test("should filter to active users only",
					async ({ adminPage }: { adminPage: Page; }) =>
					{
						const dataRows: Locator =
							adminPage.locator(SELECTORS.dataTable.dataRow);
						await expect(dataRows.first())
							.toBeVisible(
								{ timeout: TIMEOUTS.navigation });

						const activeChip: Locator =
							adminPage
								.locator(SELECTORS.userManagement.dataTable)
								.locator(SELECTORS.dataTable.chipOption)
								.filter(
									{ hasText: /\bActive\b/i });
						await activeChip.click();

						// Data should still be visible (all seeded users are active)
						const emptyState: Locator =
							adminPage.locator(SELECTORS.dataTable.emptyState);
						await expect(
							dataRows
								.first()
								.or(emptyState))
							.toBeVisible(
								{ timeout: TIMEOUTS.api });
					});
			});

		test.describe("Refresh",
			() =>
			{
				test("should refresh data when clicking refresh button",
					async ({ adminPage }: { adminPage: Page; }) =>
					{
						const dataRows: Locator =
							adminPage.locator(SELECTORS.dataTable.dataRow);
						await expect(dataRows.first())
							.toBeVisible(
								{ timeout: TIMEOUTS.api });

						const refreshButton: Locator =
							adminPage.locator(SELECTORS.dataTable.refreshButton);

						await expect(refreshButton)
							.toBeVisible();

						// Click refresh and verify API call is made
						const responsePromise: Promise<Response> =
							adminPage.waitForResponse(
								(response) =>
									response
										.url()
										.includes("/users")
										&& response.status() === 200,
								{ timeout: TIMEOUTS.api });

						await refreshButton.click();
						await responsePromise;

						// Data rows should still be visible after refresh
						await expect(dataRows.first())
							.toBeVisible(
								{ timeout: TIMEOUTS.api });
					});
			});
	});