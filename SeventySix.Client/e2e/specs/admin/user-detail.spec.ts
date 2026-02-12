// <copyright file="user-detail.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import {
	test,
	expect,
	SELECTORS,
	ROUTES,
	TIMEOUTS
} from "../../fixtures";

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
				await adminPage.waitForLoadState("load");

				const dataRows =
					adminPage.locator(SELECTORS.dataTable.dataRow);

				await dataRows
					.first()
					.waitFor({ state: "visible", timeout: TIMEOUTS.api });

				await dataRows
					.first()
					.click();

				await expect(adminPage)
					.toHaveURL(/\/admin\/users\/\d+/);
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
	});
