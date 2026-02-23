// <copyright file="user-create.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import {
	test,
	expect,
	getTestUserByRole,
	fillUserCreateStepper,
	SELECTORS,
	ROUTES,
	PAGE_TEXT,
	TIMEOUTS
} from "@e2e-fixtures";

/**
 * E2E Tests for Admin User Create Page
 *
 * Priority: P0 (Core Admin Write Operation)
 * Tests the user creation stepper flow:
 * - Page structure and form fields
 * - Form validation
 * - Successful user creation
 * - Navigation back to user list
 */
test.describe("User Create",
	() =>
	{
		test.beforeEach(
			async ({ adminPage }) =>
			{
				await adminPage.goto(ROUTES.admin.userCreate);

				// Wait for Angular lazy-loaded component to render (extended for Docker)
				await expect(adminPage.locator(SELECTORS.layout.pageHeading))
					.toHaveText(
						PAGE_TEXT.headings.createNewUser,
						{ timeout: TIMEOUTS.globalSetup });
			});

		test("should display create user heading",
			async ({ adminPage }) =>
			{
				await expect(adminPage.locator(SELECTORS.layout.pageHeading))
					.toHaveText(PAGE_TEXT.headings.createNewUser);
			});

		test("should display stepper with steps",
			async ({ adminPage }) =>
			{
				const steps =
					adminPage.locator(SELECTORS.stepper.stepHeader);

				await expect(steps)
					.toHaveCount(4, { timeout: TIMEOUTS.element });
			});

		test("should show username and email fields on step 1",
			async ({ adminPage }) =>
			{
				await expect(adminPage
					.locator(SELECTORS.userCreate.usernameInput))
					.toBeVisible();
				await expect(adminPage
					.locator(SELECTORS.userCreate.emailInput))
					.toBeVisible();
			});

		test("should validate required fields on step 1",
			async ({ adminPage }) =>
			{
				const usernameField =
					adminPage.locator(SELECTORS.userCreate.usernameInput);

				// Wait for the form to render
				await expect(usernameField)
					.toBeVisible({ timeout: TIMEOUTS.navigation });

				// Touch the username field to trigger validation
				await usernameField.focus();
				await usernameField.blur();

				// Try to advance without filling required fields — getByRole
				// excludes hidden step buttons to avoid strict mode violation
				await adminPage
					.getByRole("button", { name: PAGE_TEXT.buttons.next })
					.click();

				// Stepper should block advancement — step 1 fields still visible
				await expect(usernameField)
					.toBeVisible({ timeout: TIMEOUTS.element });
				await expect(adminPage
					.locator(SELECTORS.userCreate.emailInput))
					.toBeVisible({ timeout: TIMEOUTS.element });
			});

		test("should create user with valid data",
			async ({ adminPage }) =>
			{
				// 4-step stepper + async validation + API response
				test.setTimeout(60_000);

				const timestamp: number =
					Date.now();

				// Wait for the form to render before filling
				await expect(adminPage
					.locator(SELECTORS.userCreate.usernameInput))
					.toBeVisible({ timeout: TIMEOUTS.element });

				await fillUserCreateStepper(adminPage,
					{
						username: `e2e_test_${timestamp}`,
						email: `e2e_test_${timestamp}@test.local`,
						fullName: `E2E Test User ${timestamp}`
					});

				await adminPage
					.locator(SELECTORS.userCreate.createUserButton)
					.click();

				// Should navigate back to user list after creation
				await adminPage.waitForURL(
					`**${ROUTES.admin.users}`,
					{ timeout: TIMEOUTS.navigation });
			});

		test("should create user and verify user appears in user list",
			async ({ adminPage }) =>
			{
				// 4-step stepper + search + verify
				test.setTimeout(60_000);

				const timestamp: number =
					Date.now();
				const testUsername =
					`e2e_verify_${timestamp}`;
				const testFullName =
					`Verify User ${timestamp}`;

				// Wait for the form to render before filling
				await expect(adminPage
					.locator(SELECTORS.userCreate.usernameInput))
					.toBeVisible({ timeout: TIMEOUTS.element });

				await fillUserCreateStepper(adminPage,
					{
						username: testUsername,
						email: `e2e_verify_${timestamp}@test.local`,
						fullName: testFullName
					});

				await adminPage
					.locator(SELECTORS.userCreate.createUserButton)
					.click();

				// Should navigate to user list after creation
				await adminPage.waitForURL(
					`**${ROUTES.admin.users}`,
					{ timeout: TIMEOUTS.navigation });

				// Verify the created user appears in the user list
				// Use the data table search to find by username prefix
				const searchInput =
					adminPage.locator(SELECTORS.userManagement.dataTable)
						.locator(SELECTORS.dataTable.matInput);

				await expect(searchInput)
					.toBeVisible({ timeout: TIMEOUTS.api });
				await searchInput.fill(testUsername);

				// Set up listener BEFORE triggering search
				const searchResponse =
					adminPage.waitForResponse(
						(response) =>
							response.url().includes("/users")
								&& response.status() === 200);

				await searchInput.press("Enter");
				await searchResponse;

				// Verify the username appears in the table data rows
				const dataRows =
					adminPage.locator(SELECTORS.dataTable.dataRow);
				await expect(dataRows.first())
					.toBeVisible({ timeout: TIMEOUTS.api });
				await expect(dataRows.first())
					.toContainText(testFullName);
			});

		test("should show error when creating user with duplicate email",
			async ({ adminPage }) =>
			{
				// 4-step stepper + error assertion
				test.setTimeout(60_000);

				const existingUser =
					getTestUserByRole("User");
				const timestamp: number =
					Date.now();
				const uniqueUsername =
					`e2e_dupemail_${timestamp}`;

				// Wait for the form to render before filling
				await expect(adminPage
					.locator(SELECTORS.userCreate.usernameInput))
					.toBeVisible({ timeout: TIMEOUTS.element });

				await fillUserCreateStepper(adminPage,
					{
						username: uniqueUsername,
						email: existingUser.email,
						fullName: `Duplicate Email Test ${timestamp}`
					});

				await adminPage
					.locator(SELECTORS.userCreate.createUserButton)
					.click();

				// Should NOT navigate to user list — stay on create page due to server error.
				// The component displays an inline error banner (mat-card.alert-card.error).
				const errorBanner =
					adminPage.locator(SELECTORS.userCreate.saveErrorBanner);

				await expect(errorBanner)
					.toBeVisible({ timeout: TIMEOUTS.api });

				await expect(errorBanner)
					.toContainText(PAGE_TEXT.userCreate.failedToCreate);

				// Verify we're still on the create page
				await expect(adminPage)
					.toHaveURL(/user-create|users\/create/);
			});
	});
