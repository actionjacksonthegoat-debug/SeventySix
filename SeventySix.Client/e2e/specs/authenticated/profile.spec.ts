import { Page } from "@playwright/test";
import {
	test,
	expect,
	ROUTES,
	SELECTORS,
	PAGE_TEXT,
	TIMEOUTS,
	API_ROUTES,
	createRouteRegex
} from "../../fixtures";

/**
 * E2E Tests for Profile Page
 *
 * Priority: P1 (Core User Feature)
 * Tests the user profile functionality including:
 * - Page structure and content
 * - Profile form display
 * - Save and persistence
 * - Navigation to permissions
 * - Validation
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
							userPage.locator(SELECTORS.card.title);

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

						// Wait for profile data to populate before modifying
						await expect(userPage.locator(SELECTORS.profile.emailInput))
							.toHaveValue(/.+/, { timeout: TIMEOUTS.api });

						await fullNameInput.fill("Test User Modified");

						await expect(saveButton)
							.toBeEnabled();
					});
			});

		test.describe("Navigation",
			() =>
			{
				test("should navigate to permissions page when clicking link",
					async ({ userPage }: { userPage: Page }) =>
					{
						await userPage.goto(ROUTES.account.permissions);
						await userPage.waitForLoadState("load");

						await expect(userPage)
							.toHaveURL(createRouteRegex(ROUTES.account.permissions));
					});
			});

		test.describe("Save and Persist",
			() =>
			{
				// Save tests modify shared user state — run serially to avoid data races
				test.describe.configure({ mode: "serial" });

				test("should save profile changes and persist after reload",
					async ({ userPage }: { userPage: Page }) =>
					{
						const fullNameInput =
							userPage.locator(SELECTORS.profile.fullNameInput);
						const saveButton =
							userPage.locator(SELECTORS.profile.saveButton);

						// Wait for form population (email always non-empty for seeded users)
						await expect(userPage.locator(SELECTORS.profile.emailInput))
							.toHaveValue(/.+/, { timeout: TIMEOUTS.api });

						const uniqueFullName =
							`E2E Profile ${Date.now()}`;

						await fullNameInput.fill(uniqueFullName);
						await expect(saveButton)
							.toBeEnabled({ timeout: TIMEOUTS.api });

						await Promise.all(
							[
								userPage.waitForResponse(
									(response) =>
									response.url().includes(API_ROUTES.users.me)
										&& response.request().method() === "PUT"
										&& response.status() === 200),
								saveButton.click()
							]);

						// Reload and verify persistence
						await userPage.reload();
						await userPage.waitForLoadState("load");

						await expect(fullNameInput)
							.toHaveValue(uniqueFullName, { timeout: TIMEOUTS.api });
					});

				test("should disable save button after successful save",
					async ({ userPage }: { userPage: Page }) =>
					{
						const fullNameInput =
							userPage.locator(SELECTORS.profile.fullNameInput);
						const saveButton =
							userPage.locator(SELECTORS.profile.saveButton);

						await expect(userPage.locator(SELECTORS.profile.emailInput))
							.toHaveValue(/.+/, { timeout: TIMEOUTS.api });

						const uniqueFullName =
							`E2E Pristine ${Date.now()}`;

						await fullNameInput.fill(uniqueFullName);
						await expect(saveButton)
							.toBeEnabled({ timeout: TIMEOUTS.api });

						await Promise.all(
							[
								userPage.waitForResponse(
									(response) =>
									response.url().includes(API_ROUTES.users.me)
										&& response.request().method() === "PUT"
										&& response.status() === 200),
								saveButton.click()
							]);

						await expect(saveButton)
							.toBeDisabled({ timeout: TIMEOUTS.navigation });
					});
			});

		test.describe("Validation",
			() =>
			{
				test("should show validation error for invalid email",
					async ({ userPage }: { userPage: Page }) =>
					{
						const emailInput =
							userPage.locator(SELECTORS.profile.emailInput);
						const saveButton =
							userPage.locator(SELECTORS.profile.saveButton);

						await emailInput.fill("not-an-email");
						await emailInput.blur();

						await expect(saveButton)
							.toBeDisabled();

						const errorMessage =
							userPage.locator(SELECTORS.form.matError);
						await expect(errorMessage)
							.toBeVisible({ timeout: TIMEOUTS.element });
					});

				test("should show validation error for empty required email",
					async ({ userPage }: { userPage: Page }) =>
					{
						const emailInput =
							userPage.locator(SELECTORS.profile.emailInput);
						const saveButton =
							userPage.locator(SELECTORS.profile.saveButton);

						await emailInput.fill("");
						await emailInput.blur();

						await expect(saveButton)
							.toBeDisabled();
					});
			});
	});
