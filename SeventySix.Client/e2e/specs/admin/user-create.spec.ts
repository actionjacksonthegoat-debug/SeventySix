// <copyright file="user-create.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import {
	test,
	expect,
	getTestUserByRole,
	SELECTORS,
	ROUTES,
	PAGE_TEXT,
	TIMEOUTS
} from "../../fixtures";

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
				await adminPage.waitForLoadState("load");

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
				const timestamp: number =
					Date.now();
				const testUsername =
					`e2e_test_${timestamp}`;
				const testEmail =
					`e2e_test_${timestamp}@test.local`;

				// Wait for the form to render
				await expect(adminPage
					.locator(SELECTORS.userCreate.usernameInput))
					.toBeVisible({ timeout: TIMEOUTS.element });

				// Register response listener BEFORE filling to avoid race conditions
				const usernameCheckResponse =
					adminPage.waitForResponse(
						(response) =>
							response.url().includes("/check/username/"));

				// Step 1: Basic Information
				await adminPage
					.locator(SELECTORS.userCreate.usernameInput)
					.fill(testUsername);
				await adminPage
					.locator(SELECTORS.userCreate.emailInput)
					.fill(testEmail);

				// Wait for async username availability validator to complete
				await usernameCheckResponse;

				// Ensure Angular has processed the validator result (PENDING → VALID)
				await expect(adminPage
					.locator(SELECTORS.userCreate.usernameInput))
					.toHaveClass(/ng-valid/, { timeout: TIMEOUTS.api });

				// getByRole excludes hidden step buttons (avoids strict mode violation)
				const nextButton = () =>
					adminPage.getByRole("button", { name: PAGE_TEXT.buttons.next });
				const fullNameInput =
					adminPage.locator(SELECTORS.userCreate.fullNameInput);

				// Click Next and wait for step 2 to render
				await nextButton().click();

				// Step 2: Account Details — wait with extended timeout for stepper transition
				await fullNameInput
					.waitFor({ state: "visible", timeout: TIMEOUTS.api });
				await fullNameInput
					.fill(`E2E Test User ${timestamp}`);
				await nextButton().click();

				// Step 3: Roles (skip — optional)
				// Wait for the Roles panel to render before advancing
				await expect(adminPage
					.getByRole("listbox", { name: PAGE_TEXT.labels.roleSelection }))
					.toBeVisible({ timeout: TIMEOUTS.api });
				await nextButton().click();

				// Step 4: Review & Submit (uses matStepContent lazy rendering
				// to ensure form data is fresh in Zoneless mode)
				await expect(adminPage
					.locator(SELECTORS.userCreate.createUserButton))
					.toBeVisible({ timeout: TIMEOUTS.navigation });

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
				const timestamp: number =
					Date.now();
				const testUsername =
					`e2e_verify_${timestamp}`;
				const testEmail =
					`e2e_verify_${timestamp}@test.local`;
				const testFullName =
					`Verify User ${timestamp}`;

				// Wait for the form to render
				await expect(adminPage
					.locator(SELECTORS.userCreate.usernameInput))
					.toBeVisible({ timeout: TIMEOUTS.element });

				// Register response listener BEFORE filling
				const usernameCheckResponse =
					adminPage.waitForResponse(
						(response) =>
							response.url().includes("/check/username/"));

				// Step 1: Basic Information
				await adminPage
					.locator(SELECTORS.userCreate.usernameInput)
					.fill(testUsername);
				await adminPage
					.locator(SELECTORS.userCreate.emailInput)
					.fill(testEmail);

				await usernameCheckResponse;

				await expect(adminPage
					.locator(SELECTORS.userCreate.usernameInput))
					.toHaveClass(/ng-valid/, { timeout: TIMEOUTS.api });

				const nextButton = () =>
					adminPage.getByRole("button", { name: PAGE_TEXT.buttons.next });
				const fullNameInput =
					adminPage.locator(SELECTORS.userCreate.fullNameInput);

				await nextButton().click();

				// Step 2: Account Details
				await fullNameInput
					.waitFor({ state: "visible", timeout: TIMEOUTS.api });
				await fullNameInput
					.fill(`Verify User ${timestamp}`);
				await nextButton().click();

				// Step 3: Roles (skip)
				await expect(adminPage
					.getByRole("listbox", { name: PAGE_TEXT.labels.roleSelection }))
					.toBeVisible({ timeout: TIMEOUTS.api });
				await nextButton().click();

				// Step 4: Review & Submit
				await expect(adminPage
					.locator(SELECTORS.userCreate.createUserButton))
					.toBeVisible({ timeout: TIMEOUTS.navigation });

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
				await searchInput.press("Enter");

				// Wait for API response with filtered results
				await adminPage.waitForResponse(
					(response) =>
						response.url().includes("/users")
							&& response.status() === 200);

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
				const existingUser =
					getTestUserByRole("User");
				const timestamp: number =
					Date.now();
				const uniqueUsername =
					`e2e_dupemail_${timestamp}`;

				// Wait for the form to render
				await expect(adminPage
					.locator(SELECTORS.userCreate.usernameInput))
					.toBeVisible({ timeout: TIMEOUTS.element });

				// Register response listener BEFORE filling
				const usernameCheckResponse =
					adminPage.waitForResponse(
						(response) =>
							response.url().includes("/check/username/"));

				// Step 1: Use unique username but existing email
				await adminPage
					.locator(SELECTORS.userCreate.usernameInput)
					.fill(uniqueUsername);
				await adminPage
					.locator(SELECTORS.userCreate.emailInput)
					.fill(existingUser.email);

				await usernameCheckResponse;

				await expect(adminPage
					.locator(SELECTORS.userCreate.usernameInput))
					.toHaveClass(/ng-valid/, { timeout: TIMEOUTS.api });

				const nextButton = () =>
					adminPage.getByRole("button", { name: PAGE_TEXT.buttons.next });
				const fullNameInput =
					adminPage.locator(SELECTORS.userCreate.fullNameInput);

				await nextButton().click();

				// Step 2: Account Details
				await fullNameInput
					.waitFor({ state: "visible", timeout: TIMEOUTS.api });
				await fullNameInput
					.fill(`Duplicate Email Test ${timestamp}`);
				await nextButton().click();

				// Step 3: Roles (skip)
				await expect(adminPage
					.getByRole("listbox", { name: PAGE_TEXT.labels.roleSelection }))
					.toBeVisible({ timeout: TIMEOUTS.api });
				await nextButton().click();

				// Step 4: Submit with duplicate email
				await expect(adminPage
					.locator(SELECTORS.userCreate.createUserButton))
					.toBeVisible({ timeout: TIMEOUTS.navigation });

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
