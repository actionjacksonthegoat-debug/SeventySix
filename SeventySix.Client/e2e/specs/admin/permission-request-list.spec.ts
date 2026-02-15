import { Browser, BrowserContext, Page } from "@playwright/test";
import {
	test,
	expect,
	ROUTES,
	SELECTORS,
	PAGE_TEXT,
	TIMEOUTS,
	E2E_CONFIG,
	PERM_APPROVE_USER
} from "../../fixtures";
import { loginAsUser } from "../../fixtures/helpers/login.helper";

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

				test("should display either data rows or empty state",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						const dataRows =
							adminPage.locator(SELECTORS.dataTable.dataRow);
						const emptyState =
							adminPage.locator(SELECTORS.dataTable.emptyState);

						// Wait for either data to load or empty state to appear
						await expect(dataRows.first().or(emptyState))
							.toBeVisible({ timeout: TIMEOUTS.api });

						const rowCount: number =
							await dataRows.count();
						const hasEmptyState: boolean =
							await emptyState.isVisible();

						// Either rows exist or empty state is shown
						expect(rowCount > 0 || hasEmptyState)
							.toBe(true);
					});

				test("should display refresh button",
					async ({ adminPage }: { adminPage: Page }) =>
					{
						const refreshButton =
							adminPage.locator(SELECTORS.dataTable.refreshButton);

						await expect(refreshButton)
							.toBeVisible();
					});
			});

		test.describe("Approve Workflow",
			() =>
			{
				/**
				 * Creates a permission request via the UI as an isolated user so it appears
				 * in the admin permission request list for approval testing.
				 * Uses PERM_APPROVE_USER to avoid polluting shared e2e_user with granted roles.
				 *
				 * @param {Page} isolatedPage
				 * A fresh page logged in as the isolated permission-approve user.
				 *
				 * @returns {Promise<void>}
				 */
				async function createPermissionRequestViaUi(
					isolatedPage: Page): Promise<void>
				{
					await isolatedPage.goto(ROUTES.account.permissions);
					await isolatedPage.waitForLoadState("load");

					// Wait for roles to load
					const roleCheckbox =
						isolatedPage.locator(SELECTORS.requestPermissions.roleCheckbox).first();
					const noRolesMessage =
						isolatedPage.locator(SELECTORS.requestPermissions.noRolesMessage);

					await expect(roleCheckbox.or(noRolesMessage))
						.toBeVisible({ timeout: TIMEOUTS.api });

					// Only proceed if roles are available
					const hasRoles =
						await roleCheckbox.isVisible();

					if (!hasRoles)
					{
						return;
					}

					// Click the internal input to reliably trigger (change) event
					await roleCheckbox.locator("input").check();

					// Fill in a unique message
					const messageTextarea =
						isolatedPage.locator(SELECTORS.requestPermissions.messageTextarea);
					await messageTextarea.fill(`E2E approve test ${Date.now()}`);

					// Submit and wait for API response
					const submitButton =
						isolatedPage.locator(SELECTORS.requestPermissions.submitButton);
					await expect(submitButton)
						.toBeEnabled();

					const responsePromise =
						isolatedPage.waitForResponse(
							(response) =>
								response.url().includes("/permission-requests")
								&& response.request().method() === "POST"
								&& response.status() === 204);

					await submitButton.click();
					await responsePromise;
				}

				test("should approve a permission request and show notification",
					async ({ browser, adminPage }: { browser: Browser; adminPage: Page }) =>
					{
						// Step 1: Create an isolated page without inherited storage state
						const isolatedContext: BrowserContext =
							await browser.newContext({
								baseURL: E2E_CONFIG.clientBaseUrl,
								storageState: undefined,
								ignoreHTTPSErrors: true
							});
						const isolatedPage: Page =
							await isolatedContext.newPage();

						try
						{
							await loginAsUser(isolatedPage, PERM_APPROVE_USER);

							// Step 2: Create a permission request as the isolated user
							await createPermissionRequestViaUi(isolatedPage);

							// Step 3: Navigate admin to permission requests and wait for data
							await adminPage.goto(ROUTES.admin.permissionRequests);
							await adminPage.waitForLoadState("load");

							const dataRows =
								adminPage.locator(SELECTORS.dataTable.dataRow);

							await expect(dataRows.first())
								.toBeVisible({ timeout: TIMEOUTS.api });

							// Step 4: Open the action menu on the first row and click approve
							// With 2 row actions (approve + reject), a menu button is rendered
							const menuButton =
								dataRows.first().locator(SELECTORS.dataTable.rowActionsButton);

							await expect(menuButton)
								.toBeVisible();

							const notification =
								adminPage.locator(SELECTORS.notification.snackbar);
							const notificationPromise =
								expect(notification)
									.toBeVisible({ timeout: TIMEOUTS.api });

							await menuButton.click();

							// Click the approve option (non-warn menu item)
							const approveMenuItem =
								adminPage.locator(SELECTORS.menu.menuItem).first();

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
				/**
				 * Creates a permission request via the UI as e2e_user.
				 * Uses the authenticated userPage to navigate to the permissions page
				 * and submit a request through the form (page.request.post() cannot carry
				 * Bearer tokens since they live in Angular's memory).
				 *
				 * @param {Page} userPage
				 * The page authenticated as the user role.
				 *
				 * @returns {Promise<void>}
				 */
				async function createPermissionRequestViaUi(
					userPage: Page): Promise<void>
				{
					await userPage.goto(ROUTES.account.permissions);
					await userPage.waitForLoadState("load");

					// Wait for roles to load
					const roleCheckbox =
						userPage.locator(SELECTORS.requestPermissions.roleCheckbox).first();
					const noRolesMessage =
						userPage.locator(SELECTORS.requestPermissions.noRolesMessage);

					await expect(roleCheckbox.or(noRolesMessage))
						.toBeVisible({ timeout: TIMEOUTS.api });

					// Only proceed if roles are available
					const hasRoles =
						await roleCheckbox.isVisible();

					if (!hasRoles)
					{
						return;
					}

					// Click the internal input to reliably trigger (change) event
					await roleCheckbox.locator("input").check();

					// Fill in a unique message
					const messageTextarea =
						userPage.locator(SELECTORS.requestPermissions.messageTextarea);
					await messageTextarea.fill(`E2E reject test ${Date.now()}`);

					// Submit and wait for API response
					const submitButton =
						userPage.locator(SELECTORS.requestPermissions.submitButton);
					await expect(submitButton)
						.toBeEnabled();

					const responsePromise =
						userPage.waitForResponse(
							(response) =>
								response.url().includes("/permission-requests")
								&& response.request().method() === "POST"
								&& response.status() === 204);

					await submitButton.click();
					await responsePromise;
				}

				test("should reject a permission request via row action menu",
					async ({ userPage, adminPage }: { userPage: Page; adminPage: Page }) =>
					{
						// Step 1: Create a permission request via UI
						await createPermissionRequestViaUi(userPage);

						// Step 2: Navigate admin to permission requests
						await adminPage.goto(ROUTES.admin.permissionRequests);
						await adminPage.waitForLoadState("load");

						const dataRows =
							adminPage.locator(SELECTORS.dataTable.dataRow);

						await expect(dataRows.first())
							.toBeVisible({ timeout: TIMEOUTS.api });

						// Step 3: Open the action menu on the first row
						// With 2 row actions (approve + reject), a menu button is rendered
						const menuButton =
							dataRows.first().locator(SELECTORS.dataTable.rowActionsButton);

						await expect(menuButton)
							.toBeVisible();
						await menuButton.click();

						// Click the reject option (warn-colored menu item)
						const rejectMenuItem =
							adminPage.locator(SELECTORS.menu.warnMenuItem);

						await expect(rejectMenuItem)
							.toBeVisible();
						await rejectMenuItem.click();

						// Step 4: Verify notification appears
						const notification =
							adminPage.locator(SELECTORS.notification.snackbar);
						await expect(notification)
							.toBeVisible({ timeout: TIMEOUTS.api });
					});
			});
	});
