import {
	expect,
	PAGE_TEXT,
	ROUTES,
	SELECTORS,
	test,
	TIMEOUTS
} from "@e2e-fixtures";
import { Locator, Page } from "@playwright/test";

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
			async ({ userPage }: { userPage: Page; }) =>
			{
				await userPage.goto(ROUTES.account.permissions);
			});

		test.describe("Page Structure",
			() =>
			{
				test("should display request permissions title",
					async ({ userPage }: { userPage: Page; }) =>
					{
						const cardTitle: Locator =
							userPage.locator(SELECTORS.card.title);

						await expect(cardTitle)
							.toHaveText(PAGE_TEXT.requestPermissions.title);
					});

				test("should display subtitle",
					async ({ userPage }: { userPage: Page; }) =>
					{
						const cardSubtitle: Locator =
							userPage.locator(SELECTORS.card.subtitle);

						await expect(cardSubtitle)
							.toHaveText(PAGE_TEXT.requestPermissions.subtitle);
					});

				test("should display submit button",
					async ({ userPage }: { userPage: Page; }) =>
					{
						const submitButton: Locator =
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
				test(
					"should disable submit button initially when no roles selected",
					async ({ userPage }: { userPage: Page; }) =>
					{
						const submitButton: Locator =
							userPage.locator(SELECTORS.requestPermissions.submitButton);

						await expect(submitButton)
							.toBeDisabled();
					});

				test("should display message textarea for request reason",
					async ({ userPage }: { userPage: Page; }) =>
					{
						// Wait for roles to load
						const roleCheckbox: Locator =
							userPage
								.locator(SELECTORS.requestPermissions.roleCheckbox)
								.first();

						await expect(roleCheckbox)
							.toBeVisible(
								{ timeout: TIMEOUTS.api });

						const messageTextarea: Locator =
							userPage.locator(SELECTORS.requestPermissions.messageTextarea);

						await expect(messageTextarea)
							.toBeVisible();
					});
			});

		test.describe("Role Selection",
			() =>
			{
				test("should display role checkboxes for available roles",
					async ({ userPage }: { userPage: Page; }) =>
					{
						// e2e_user has only User role, so Developer/Admin should be requestable
						const roleCheckboxes: Locator =
							userPage.locator(SELECTORS.requestPermissions.roleCheckbox);

						await expect(roleCheckboxes.first())
							.toBeVisible(
								{ timeout: TIMEOUTS.api });

						const roleCount: number =
							await roleCheckboxes.count();

						expect(roleCount)
							.toBeGreaterThan(0);
					});

				test("should enable submit button when a role is selected",
					async ({ userPage }: { userPage: Page; }) =>
					{
						// e2e_user has only User role, so Developer/Admin should be available
						const roleCheckbox: Locator =
							userPage
								.locator(SELECTORS.requestPermissions.roleCheckbox)
								.first();

						await expect(roleCheckbox)
							.toBeVisible(
								{ timeout: TIMEOUTS.api });

						const submitButton: Locator =
							userPage.locator(SELECTORS.requestPermissions.submitButton);

						// Initially disabled
						await expect(submitButton)
							.toBeDisabled();

						// Click the internal input to reliably trigger (change) event
						await roleCheckbox
							.locator("input")
							.check();

						// Now enabled
						await expect(submitButton)
							.toBeEnabled();
					});
			});

		test.describe("Submission",
			() =>
			{
				test("should submit request and show success notification",
					async ({ userPage }: { userPage: Page; }) =>
					{
						// e2e_user has only User role, so Developer/Admin should be available
						const roleCheckbox: Locator =
							userPage
								.locator(SELECTORS.requestPermissions.roleCheckbox)
								.first();

						await expect(roleCheckbox)
							.toBeVisible(
								{ timeout: TIMEOUTS.api });

						// Click the internal input to reliably trigger (change) event
						await roleCheckbox
							.locator("input")
							.check();

						// Fill in an optional message
						const messageTextarea: Locator =
							userPage.locator(SELECTORS.requestPermissions.messageTextarea);

						await expect(messageTextarea)
							.toBeVisible();
						await messageTextarea.fill(`E2E request test ${Date.now()}`);

						// Submit
						const submitButton: Locator =
							userPage.locator(SELECTORS.requestPermissions.submitButton);
						await expect(submitButton)
							.toBeEnabled();

						// Set up notification listener before click
						const notification: Locator =
							userPage.locator(SELECTORS.notification.snackbar);
						const notificationPromise: Promise<void> =
							expect(notification)
								.toContainText(
									PAGE_TEXT.confirmation.permissionRequestSubmitted,
									{ timeout: TIMEOUTS.api });

						await submitButton.click();

						// Verify success notification
						await notificationPromise;

						// Should navigate back to account page after submission
						await expect(userPage)
							.toHaveURL(/\/account/,
								{ timeout: TIMEOUTS.navigation });
					});
			});
	});