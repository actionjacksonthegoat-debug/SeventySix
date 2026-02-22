import { Page } from "@playwright/test";
import {
	test,
	expect,
	ROUTES,
	SELECTORS,
	PAGE_TEXT,
	TIMEOUTS
} from "@e2e-fixtures";

/**
 * E2E Tests for Request Permissions Page
 *
 * Priority: P1 (Core User Feature)
 * Tests the permission request functionality including:
 * - Page structure and content
 * - Role selection
 * - Form behavior
 * - Submission workflow
 */
test.describe("Request Permissions Page",
	() =>
	{
		test.beforeEach(
			async ({ userPage }: { userPage: Page }) =>
			{
				await userPage.goto(ROUTES.account.permissions);
			});

		test.describe("Page Structure",
			() =>
			{
				test("should display request permissions title",
					async ({ userPage }: { userPage: Page }) =>
					{
						const cardTitle =
							userPage.locator(SELECTORS.card.title);

						await expect(cardTitle)
							.toHaveText(PAGE_TEXT.requestPermissions.title);
					});

				test("should display subtitle",
					async ({ userPage }: { userPage: Page }) =>
					{
						const cardSubtitle =
							userPage.locator(SELECTORS.card.subtitle);

						await expect(cardSubtitle)
							.toHaveText(PAGE_TEXT.requestPermissions.subtitle);
					});

				test("should display submit button",
					async ({ userPage }: { userPage: Page }) =>
					{
						const submitButton =
							userPage.locator(SELECTORS.requestPermissions.submitButton);

						await expect(submitButton)
							.toBeVisible();
						await expect(submitButton)
							.toContainText(PAGE_TEXT.requestPermissions.submitRequest);
					});
			});

		test.describe("Form Behavior",
			() =>
			{
				test("should disable submit button initially when no roles selected",
					async ({ userPage }: { userPage: Page }) =>
					{
						const submitButton =
							userPage.locator(SELECTORS.requestPermissions.submitButton);

						await expect(submitButton)
							.toBeDisabled();
					});

				test("should display message textarea for request reason",
					async ({ userPage }: { userPage: Page }) =>
					{
						// Wait for roles to load
						const roleCheckbox =
							userPage.locator(SELECTORS.requestPermissions.roleCheckbox).first();

						await expect(roleCheckbox)
							.toBeVisible({ timeout: TIMEOUTS.api });

						const messageTextarea =
							userPage.locator(SELECTORS.requestPermissions.messageTextarea);

						await expect(messageTextarea)
							.toBeVisible();
					});
			});

		test.describe("Role Selection",
			() =>
			{
				test("should display role checkboxes for available roles",
					async ({ userPage }: { userPage: Page }) =>
					{
						// e2e_user has only User role, so Developer/Admin should be requestable
						const roleCheckboxes =
							userPage.locator(SELECTORS.requestPermissions.roleCheckbox);

						await expect(roleCheckboxes.first())
							.toBeVisible({ timeout: TIMEOUTS.api });

						const roleCount =
							await roleCheckboxes.count();

						expect(roleCount)
							.toBeGreaterThan(0);
					});

				test("should enable submit button when a role is selected",
					async ({ userPage }: { userPage: Page }) =>
					{
						// e2e_user has only User role, so Developer/Admin should be available
						const roleCheckbox =
							userPage.locator(SELECTORS.requestPermissions.roleCheckbox).first();

						await expect(roleCheckbox)
							.toBeVisible({ timeout: TIMEOUTS.api });

						const submitButton =
							userPage.locator(SELECTORS.requestPermissions.submitButton);

						// Initially disabled
						await expect(submitButton)
							.toBeDisabled();

						// Click the internal input to reliably trigger (change) event
						await roleCheckbox.locator("input").check();

						// Now enabled
						await expect(submitButton)
							.toBeEnabled();
					});
			});

		test.describe("Submission",
			() =>
			{
				test("should submit request and show success notification",
					async ({ userPage }: { userPage: Page }) =>
					{
						// e2e_user has only User role, so Developer/Admin should be available
						const roleCheckbox =
							userPage.locator(SELECTORS.requestPermissions.roleCheckbox).first();

						await expect(roleCheckbox)
							.toBeVisible({ timeout: TIMEOUTS.api });

						// Click the internal input to reliably trigger (change) event
						await roleCheckbox.locator("input").check();

						// Fill in an optional message
						const messageTextarea =
							userPage.locator(SELECTORS.requestPermissions.messageTextarea);

						await expect(messageTextarea)
							.toBeVisible();
						await messageTextarea.fill(`E2E request test ${Date.now()}`);

						// Submit
						const submitButton =
							userPage.locator(SELECTORS.requestPermissions.submitButton);
						await expect(submitButton)
							.toBeEnabled();

						// Set up notification listener before click
						const notification =
							userPage.locator(SELECTORS.notification.snackbar);
						const notificationPromise =
							expect(notification)
								.toContainText(
									PAGE_TEXT.confirmation.permissionRequestSubmitted,
									{ timeout: TIMEOUTS.api });

						await submitButton.click();

						// Verify success notification
						await notificationPromise;

						// Should navigate back to account page after submission
						await expect(userPage)
							.toHaveURL(/\/account/, { timeout: TIMEOUTS.navigation });
					});
			});
	});
