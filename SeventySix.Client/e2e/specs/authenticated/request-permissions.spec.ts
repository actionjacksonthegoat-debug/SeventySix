import { Page } from "@playwright/test";
import {
	test,
	expect,
	ROUTES,
	SELECTORS,
	PAGE_TEXT
} from "../../fixtures";

/**
 * E2E Tests for Request Permissions Page
 *
 * Priority: P1 (Core User Feature)
 * Tests the permission request functionality including:
 * - Page structure and content
 * - Role selection
 * - Form behavior
 */
test.describe("Request Permissions Page",
	() =>
	{
		test.beforeEach(
			async ({ userPage }: { userPage: Page }) =>
			{
				await userPage.goto(ROUTES.account.permissions);
				await userPage.waitForLoadState("load");
			});

		test.describe("Page Structure",
			() =>
			{
				test("should display request permissions title",
					async ({ userPage }: { userPage: Page }) =>
					{
						const cardTitle =
							userPage.locator("mat-card-title");

						await expect(cardTitle)
							.toHaveText(PAGE_TEXT.requestPermissions.title);
					});

				test("should display subtitle",
					async ({ userPage }: { userPage: Page }) =>
					{
						const cardSubtitle =
							userPage.locator("mat-card-subtitle");

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
						// Wait for content to load (either roles list or no-roles message)
						const rolesListOrNoRoles =
							userPage.locator(".roles-list, .no-roles");

						await rolesListOrNoRoles.first()
							.waitFor({ state: "visible", timeout: 10000 });

						const messageTextarea =
							userPage.locator(SELECTORS.requestPermissions.messageTextarea);

						// Textarea should be visible when roles are available
						// or the form should show no-roles message
						const noRolesMessage =
							userPage.locator(SELECTORS.requestPermissions.noRolesMessage);

						const hasTextarea =
							await messageTextarea.isVisible();
						const hasNoRolesMessage =
							await noRolesMessage.isVisible();

						// One of these must be true
						expect(hasTextarea || hasNoRolesMessage)
							.toBe(true);
					});
			});

		test.describe("Role Selection",
			() =>
			{
				test("should display either role checkboxes or no-roles message",
					async ({ userPage }: { userPage: Page }) =>
					{
						// Wait for content to load (either roles list or no-roles message)
						const rolesListOrNoRoles =
							userPage.locator(".roles-list, .no-roles");

						await rolesListOrNoRoles.first()
							.waitFor({ state: "visible", timeout: 10000 });

						const roleCheckboxes =
							userPage.locator(SELECTORS.requestPermissions.roleCheckbox);
						const noRolesMessage =
							userPage.locator(SELECTORS.requestPermissions.noRolesMessage);

						const roleCount =
							await roleCheckboxes.count();
						const hasNoRolesMessage =
							await noRolesMessage.isVisible();

						// Either we have roles to select, or we see the no-roles message
						expect(roleCount > 0 || hasNoRolesMessage)
							.toBe(true);
					});
			});
	});
