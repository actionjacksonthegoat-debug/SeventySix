// <copyright file="user-detail.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import {
	test,
	expect,
	SELECTORS,
	ROUTES,
	TIMEOUTS,
	PAGE_TEXT
} from "@e2e-fixtures";

/**
 * E2E Tests for Admin User Detail Page
 *
 * Priority: P0 (Core Admin Management)
 * Tests the user detail view and editing:
 * - Page loads and displays user information
 * - Correct form fields shown
 * - Navigation from user list to detail
 */
test.describe("User Detail",
	() =>
	{
		test.beforeEach(
			async ({ adminPage }) =>
			{
				await adminPage.goto(ROUTES.admin.users);

			// Search for a known user to ensure we click a predictable row
			const searchInput =
				adminPage.locator(SELECTORS.userManagement.dataTable)
					.locator(SELECTORS.dataTable.matInput);

			await expect(searchInput)
				.toBeVisible({ timeout: TIMEOUTS.api });

			const searchResponse =
				adminPage.waitForResponse(
					(response) =>
						response.url().includes("/users")
						&& response.status() === 200);
			await searchInput.fill("e2e_user");
			await searchInput.press("Enter");
			await searchResponse;

			const dataRows =
				adminPage.locator(SELECTORS.dataTable.dataRow);

			await expect(dataRows.first(),
				"Expected at least 1 user row in search results for 'e2e_user'")
				.toBeVisible({ timeout: TIMEOUTS.api });

			await dataRows.first().click();
			await adminPage.waitForURL(
				/\/admin\/users\/\d+/,
				{ timeout: TIMEOUTS.navigation });
			});

		test("should navigate from user list to detail view",
			async ({ adminPage }) =>
			{
				// Navigation already performed in beforeEach — assert detail page loaded
				await expect(adminPage)
					.toHaveURL(/\/admin\/users\/\d+/);
			});

		test("should display user form fields",
			async ({ adminPage }) =>
			{
				await expect(adminPage
					.locator(SELECTORS.userDetail.usernameInput))
					.toBeVisible({ timeout: TIMEOUTS.api });
				await expect(adminPage
					.locator(SELECTORS.userDetail.emailInput))
					.toBeVisible();
			});

		test("should display save button as disabled when no changes made",
			async ({ adminPage }) =>
			{
				await expect(adminPage
					.locator(SELECTORS.userDetail.saveChangesButton))
					.toBeDisabled({ timeout: TIMEOUTS.api });
			});

		test("should enable save button when full name is modified",
			async ({ adminPage }) =>
			{
				const fullNameInput =
					adminPage.locator(SELECTORS.userDetail.fullNameInput);
				const saveButton =
					adminPage.locator(SELECTORS.userDetail.saveChangesButton);

				await expect(fullNameInput)
					.toBeVisible({ timeout: TIMEOUTS.api });

				await fullNameInput.fill(`E2E Admin Edit ${Date.now()}`);

				await expect(saveButton)
					.toBeEnabled();
			});

		test("should save user changes and show success notification",
			async ({ adminPage }) =>
			{
				const fullNameInput =
					adminPage.locator(SELECTORS.userDetail.fullNameInput);
				const saveButton =
					adminPage.locator(SELECTORS.userDetail.saveChangesButton);

				await expect(fullNameInput)
					.toBeVisible({ timeout: TIMEOUTS.api });

				const updatedFullName =
					`E2E Updated ${Date.now()}`;

				await fullNameInput.fill(updatedFullName);
				await saveButton.click();

				// Verify success notification
				const notification =
					adminPage.locator(SELECTORS.notification.snackbar);
				await expect(notification)
					.toContainText(
						PAGE_TEXT.confirmation.userUpdated,
						{ timeout: TIMEOUTS.api });

				// Save button should become disabled again (form pristine)
				await expect(saveButton)
					.toBeDisabled({ timeout: TIMEOUTS.api });
			});
	});
