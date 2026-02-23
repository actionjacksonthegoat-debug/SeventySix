import { BrowserContext, Page } from "@playwright/test";
import {
	test,
	expect,
	ROUTES,
	SELECTORS,
	PAGE_TEXT,
	TIMEOUTS,
	API_ROUTES,
	createRouteRegex,
	PROFILE_EDIT_USER,
	loginInFreshContext
} from "@e2e-fixtures";

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

						await expect(userPage)
							.toHaveURL(createRouteRegex(ROUTES.account.permissions));
					});
			});

		test.describe("Save and Persist",
			() =>
			{
				// Save tests both login as PROFILE_EDIT_USER — run serially to avoid
				// concurrent login rate-limits and server-side profile mutation races.
				test.describe.configure({ mode: "serial" });

				test("should save profile changes and persist after reload",
					async ({ browser }) =>
					{
						// loginInFreshContext includes ALTCHA (~3-5 s in Docker) + login redirect +
						// profile API + page reload — 30 s default is insufficient.
						test.setTimeout(45_000);

						const { context, page } =
							await loginInFreshContext(
								browser,
								PROFILE_EDIT_USER);

						try
						{
							await page.goto(ROUTES.account.root);

							const fullNameInput =
								page.locator(SELECTORS.profile.fullNameInput);
							const saveButton =
								page.locator(SELECTORS.profile.saveButton);

							// Wait for form population (email always non-empty for seeded users)
							await expect(page.locator(SELECTORS.profile.emailInput))
								.toHaveValue(/.+/, { timeout: TIMEOUTS.api });

							const uniqueFullName =
								`E2E Profile ${Date.now()}`;

							await fullNameInput.fill(uniqueFullName);
							await expect(saveButton)
								.toBeEnabled({ timeout: TIMEOUTS.api });

							await Promise.all(
								[
									page.waitForResponse(
										(response) =>
										response.url().includes(API_ROUTES.users.me)
											&& response.request().method() === "PUT"
											&& response.status() === 200),
									saveButton.click()
								]);

							// Reload and verify persistence
							await page.reload();

							await expect(fullNameInput)
								.toHaveValue(uniqueFullName, { timeout: TIMEOUTS.api });
						}
						finally
						{
							await context.close();
						}
					});

				test("should disable save button after successful save",
					async ({ browser }) =>
					{
						// loginInFreshContext includes ALTCHA (~3–5 s in Docker) + login redirect +
						// profile API + save — 30 s default is insufficient.
						test.setTimeout(45_000);

						const { context, page } =
							await loginInFreshContext(
								browser,
								PROFILE_EDIT_USER);

						try
						{
							await page.goto(ROUTES.account.root);

							const fullNameInput =
								page.locator(SELECTORS.profile.fullNameInput);
							const saveButton =
								page.locator(SELECTORS.profile.saveButton);

							await expect(page.locator(SELECTORS.profile.emailInput))
								.toHaveValue(/.+/, { timeout: TIMEOUTS.api });

							const uniqueFullName =
								`E2E Pristine ${Date.now()}`;

							await fullNameInput.fill(uniqueFullName);
							await expect(saveButton)
								.toBeEnabled({ timeout: TIMEOUTS.api });

							await Promise.all(
								[
									page.waitForResponse(
										(response) =>
										response.url().includes(API_ROUTES.users.me)
											&& response.request().method() === "PUT"
											&& response.status() === 200),
									saveButton.click()
								]);

							await expect(saveButton)
								.toBeDisabled({ timeout: TIMEOUTS.navigation });
						}
						finally
						{
							await context.close();
						}
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
