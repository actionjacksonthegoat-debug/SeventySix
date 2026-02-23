import {
	expect,
	loginInFreshContext,
	PAGE_TEXT,
	PERM_APPROVE_USER,
	ROUTES,
	SELECTORS,
	test,
	TIMEOUTS
} from "@e2e-fixtures";
import type { Locator, Page, Response } from "@playwright/test";

/**
 * Creates a permission request via the UI as an isolated user so it appears
 * in the admin permission request list for approve/reject workflow testing.
 * Uses PERM_APPROVE_USER to avoid polluting shared e2e_user with granted roles.
 *
 * @param {Page} isolatedPage
 * A page logged in as the isolated permission user.
 *
 * @returns {Promise<void>}
 */
async function createPermissionRequestViaUi(
	isolatedPage: Page): Promise<void>
{
	await isolatedPage.goto(ROUTES.account.permissions);

	// Wait for roles to load
	const roleCheckbox: Locator =
		isolatedPage
			.locator(SELECTORS.requestPermissions.roleCheckbox)
			.first();
	const noRolesMessage: Locator =
		isolatedPage.locator(SELECTORS.requestPermissions.noRolesMessage);

	await expect(roleCheckbox.or(noRolesMessage))
		.toBeVisible(
			{ timeout: TIMEOUTS.api });

	// Only proceed if roles are available
	const hasRoles: boolean =
		await roleCheckbox.isVisible();

	if (!hasRoles)
	{
		throw new Error(
			"PERM_APPROVE_USER has no requestable roles — "
				+ "prior run may have granted them. "
				+ "The E2E seeder should reset this user's roles between runs.");
	}

	// Click the internal input to reliably trigger (change) event
	await roleCheckbox
		.locator("input")
		.check();

	// Fill in a unique message
	const messageTextarea: Locator =
		isolatedPage.locator(SELECTORS.requestPermissions.messageTextarea);
	await messageTextarea.fill(`E2E test ${Date.now()}`);

	// Submit and wait for API response
	const submitButton: Locator =
		isolatedPage.locator(SELECTORS.requestPermissions.submitButton);
	await expect(submitButton)
		.toBeEnabled();

	const responsePromise: Promise<Response> =
		isolatedPage.waitForResponse(
			(response) =>
				response
					.url()
					.includes("/permission-requests")
					&& response
						.request()
						.method() === "POST"
					&& response.status() === 204);

	await submitButton.click();
	await responsePromise;
}

/**
 * E2E Tests for Permission Request List Page
 *
 * Priority: P1 (Admin Feature)
 * Tests the permission request management including:
 * - Page structure and content
 * - Request list display
 * - Data table interactions
 * - Approve/reject workflows
 */
test.describe("Permission Request List Page",
	() =>
	{
		test.beforeEach(
			async ({ adminPage }: { adminPage: Page; }) =>
			{
				await adminPage.goto(ROUTES.admin.permissionRequests);
			});

		test.describe("Page Structure",
			() =>
			{
				test("should display permission requests heading",
					async ({ adminPage }: { adminPage: Page; }) =>
					{
						const heading: Locator =
							adminPage
								.locator(SELECTORS.permissionRequests.pageHeader)
								.locator("h1");

						await expect(heading)
							.toHaveText(PAGE_TEXT.permissionRequests.title);
					});

				test("should display page subtitle",
					async ({ adminPage }: { adminPage: Page; }) =>
					{
						const pageHeader: Locator =
							adminPage.locator(SELECTORS.permissionRequests.pageHeader);

						await expect(pageHeader)
							.toContainText(PAGE_TEXT.permissionRequests.subtitle);
					});

				test("should display data table component",
					async ({ adminPage }: { adminPage: Page; }) =>
					{
						const dataTable: Locator =
							adminPage.locator(SELECTORS.permissionRequests.dataTable);

						await expect(dataTable)
							.toBeVisible();
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
							.toBeVisible();
					});

				test("should display either data rows or empty state",
					async ({ adminPage }: { adminPage: Page; }) =>
					{
						const dataRows: Locator =
							adminPage.locator(SELECTORS.dataTable.dataRow);
						const emptyState: Locator =
							adminPage.locator(SELECTORS.dataTable.emptyState);

						// Wait for either data to load or empty state to appear
						await expect(
							dataRows
								.first()
								.or(emptyState))
							.toBeVisible(
								{ timeout: TIMEOUTS.api });

						const rowCount: number =
							await dataRows.count();
						const hasEmptyState: boolean =
							await emptyState.isVisible();

						// Either rows exist or empty state is shown
						expect(rowCount > 0 || hasEmptyState)
							.toBe(true);
					});

				test("should display refresh button",
					async ({ adminPage }: { adminPage: Page; }) =>
					{
						const refreshButton: Locator =
							adminPage.locator(SELECTORS.dataTable.refreshButton);

						await expect(refreshButton)
							.toBeVisible();
					});
			});

		test.describe("Approve Workflow",
			() =>
			{
				test("should approve a permission request and show notification",
					async ({ browser, adminPage }) =>
					{
						// Fresh context + login + UI request creation + admin action
						test.setTimeout(90_000);

						// Step 1: Create an isolated page without inherited storage state
						const { page: isolatedPage, context: isolatedContext } =
							await loginInFreshContext(
								browser,
								PERM_APPROVE_USER);

						try
						{
							// Step 2: Create a permission request as the isolated user
							await createPermissionRequestViaUi(isolatedPage);

							// Step 3: Navigate admin to permission requests and wait for data
							await adminPage.goto(ROUTES.admin.permissionRequests);

							const dataRows: Locator =
								adminPage.locator(SELECTORS.dataTable.dataRow);

							await expect(dataRows.first())
								.toBeVisible(
									{ timeout: TIMEOUTS.api });

							// Step 4: Open the action menu on the first row and click approve
							// With 2 row actions (approve + reject), a menu button is rendered
							const menuButton: Locator =
								dataRows
									.first()
									.locator(SELECTORS.dataTable.rowActionsButton);

							await expect(menuButton)
								.toBeVisible();

							const notification: Locator =
								adminPage.locator(SELECTORS.notification.snackbar);
							const notificationPromise: Promise<void> =
								expect(notification)
									.toBeVisible(
										{ timeout: TIMEOUTS.api });

							await menuButton.click();

							// Click the approve option (non-warn menu item)
							const approveMenuItem: Locator =
								adminPage
									.locator(SELECTORS.menu.menuItem)
									.first();

							await expect(approveMenuItem)
								.toBeVisible();
							await approveMenuItem.click();

							await notificationPromise;
						}
						finally
						{
							await isolatedContext.close();
						}
					});
			});

		test.describe("Reject Workflow",
			() =>
			{
				test("should reject a permission request via row action menu",
					async ({ userPage, adminPage }) =>
					{
						// Fresh context + login + UI request creation + admin rejection
						test.setTimeout(90_000);
						// Step 1: Create a permission request via UI
						await createPermissionRequestViaUi(userPage);
						// Step 2: Navigate admin to permission requests
						await adminPage.goto(ROUTES.admin.permissionRequests);

						const dataRows: Locator =
							adminPage.locator(SELECTORS.dataTable.dataRow);

						await expect(dataRows.first())
							.toBeVisible(
								{ timeout: TIMEOUTS.api });

						// Step 3: Open the action menu on the first row
						// With 2 row actions (approve + reject), a menu button is rendered
						const menuButton: Locator =
							dataRows
								.first()
								.locator(SELECTORS.dataTable.rowActionsButton);

						await expect(menuButton)
							.toBeVisible();
						await menuButton.click();

						// Click the reject option (warn-colored menu item)
						const rejectMenuItem: Locator =
							adminPage.locator(SELECTORS.menu.warnMenuItem);

						await expect(rejectMenuItem)
							.toBeVisible();
						await rejectMenuItem.click();

						// Step 4: Verify notification appears
						const notification: Locator =
							adminPage.locator(SELECTORS.notification.snackbar);
						await expect(notification)
							.toBeVisible(
								{ timeout: TIMEOUTS.api });
					});
			});
	});