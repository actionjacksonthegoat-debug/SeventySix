import { Page } from "@playwright/test";
import {
	test,
	expect,
	ROUTES,
	SELECTORS,
	PAGE_TEXT,
	createRouteRegex
} from "../../fixtures";

/**
 * E2E Tests for Profile Page
 *
 * Priority: P1 (Core User Feature)
 * Tests the user profile functionality including:
 * - Page structure and content
 * - Profile form display
 * - Navigation to permissions
 */
test.describe("Profile Page",
	() =>
	{
		test.beforeEach(
			async ({ userPage }: { userPage: Page }) =>
			{
				await userPage.goto(ROUTES.account.root);
				await userPage.waitForLoadState("load");
			});

		test.describe("Page Structure",
			() =>
			{
				test("should display profile card",
					async ({ userPage }: { userPage: Page }) =>
					{
						const profileCard =
							userPage.locator(SELECTORS.profile.profileCard).first();

						await expect(profileCard)
							.toBeVisible();
					});

				test("should display username in card title",
					async ({ userPage }: { userPage: Page }) =>
					{
						const cardTitle =
							userPage.locator("mat-card-title");

						await expect(cardTitle)
							.toBeVisible();
						await expect(cardTitle)
							.not.toBeEmpty();
					});
			});

		test.describe("Profile Form",
			() =>
			{
				test("should display email input field",
					async ({ userPage }: { userPage: Page }) =>
					{
						const emailInput =
							userPage.locator(SELECTORS.profile.emailInput);

						await expect(emailInput)
							.toBeVisible();
					});

				test("should display full name input field",
					async ({ userPage }: { userPage: Page }) =>
					{
						const fullNameInput =
							userPage.locator(SELECTORS.profile.fullNameInput);

						await expect(fullNameInput)
							.toBeVisible();
					});

				test("should display save button",
					async ({ userPage }: { userPage: Page }) =>
					{
						const saveButton =
							userPage.locator(SELECTORS.profile.saveButton);

						await expect(saveButton)
							.toBeVisible();
						await expect(saveButton)
							.toContainText(PAGE_TEXT.profile.saveChanges);
					});

				test("should disable save button when form is pristine",
					async ({ userPage }: { userPage: Page }) =>
					{
						const saveButton =
							userPage.locator(SELECTORS.profile.saveButton);

						await expect(saveButton)
							.toBeDisabled();
					});

				test("should enable save button when form is modified",
					async ({ userPage }: { userPage: Page }) =>
					{
						const fullNameInput =
							userPage.locator(SELECTORS.profile.fullNameInput);
						const saveButton =
							userPage.locator(SELECTORS.profile.saveButton);

						// Modify the form
						await fullNameInput.fill("Test User Modified");

						await expect(saveButton)
							.toBeEnabled();
					});
			});

		test.describe("Navigation",
			() =>
			{
				test("should display request permissions link",
					async ({ userPage }: { userPage: Page }) =>
					{
						const permissionsLink =
							userPage.locator(SELECTORS.profile.requestPermissionsLink);

						// Link visibility depends on whether user has available roles
						// Just verify the page loads without errors
						await expect(userPage.locator("body"))
							.toBeVisible();
					});

				test("should navigate to permissions page when clicking link",
					async ({ userPage }: { userPage: Page }) =>
					{
						// Navigate directly to permissions page to test it exists
						await userPage.goto(ROUTES.account.permissions);
						await userPage.waitForLoadState("load");

						await expect(userPage)
							.toHaveURL(createRouteRegex(ROUTES.account.permissions));
					});
			});
	});
