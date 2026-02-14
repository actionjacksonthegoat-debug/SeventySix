import { Page } from "@playwright/test";
import {
	test,
	expect,
	ROUTES,
	SELECTORS,
	expectAccessible
} from "../../fixtures";
import AxeBuilder from "@axe-core/playwright";
import type { Result } from "axe-core";

/**
 * WCAG Accessibility E2E Tests for Authenticated User Pages
 *
 * Tests cover WCAG 2.2 AA compliance across authenticated user routes.
 * Uses authenticated user context for testing protected pages.
 *
 * @wcag 1.1.1 Non-text Content (Level A)
 * @wcag 1.4.3 Contrast (Minimum) (Level AA)
 * @wcag 2.1.1 Keyboard (Level A)
 * @wcag 2.4.7 Focus Visible (Level AA)
 * @wcag 4.1.2 Name, Role, Value (Level A)
 */
test.describe("Authenticated Routes - WCAG Accessibility",
	() =>
	{
		const authenticatedPages =
			[
				{ path: ROUTES.account.root, name: "Profile" },
				{ path: ROUTES.account.permissions, name: "Permissions" }
			];

		for (const pageInfo of authenticatedPages)
		{
			// eslint-disable-next-line playwright/expect-expect -- assertions inside expectAccessible
			test(`should have no critical accessibility violations on ${pageInfo.name} page`,
				async ({ userPage }: { userPage: Page }) =>
				{
					await userPage.goto(pageInfo.path);
					await userPage.waitForLoadState("load");

					await expectAccessible(userPage, pageInfo.name);
				});
		}

		test.describe("User Profile Accessibility",
			() =>
			{
				test("should have accessible form controls on profile page",
					async ({ userPage }: { userPage: Page }) =>
					{
						await userPage.goto(ROUTES.account.root);
						await userPage.waitForLoadState("load");

						// Form inputs should have labels
						const axeResults =
							await new AxeBuilder(
								{ page: userPage })
								.withTags(["wcag2a"])
								.analyze();

						const labelViolations: Result[] =
							axeResults.violations.filter(
								(violation: Result) =>
									violation.id === "label"
									|| violation.id === "form-field-multiple-labels");

						expect(
							labelViolations,
							"Form label violations found")
							.toHaveLength(0);
					});
			});

		test.describe("User Menu Accessibility",
			() =>
			{
				test("should have accessible user menu",
					async ({ userPage }: { userPage: Page }) =>
					{
						await userPage.goto(ROUTES.home);
						await userPage.waitForLoadState("load");

						// User menu button should have aria-label
						const userMenuButton =
							userPage.locator(SELECTORS.layout.userMenuButton);

						await expect(userMenuButton)
							.toBeVisible();

						await expect(userMenuButton)
							.toHaveAttribute("aria-label");
					});
			});

		test.describe("Navigation Accessibility",
			() =>
			{
				test("should have proper landmark regions when authenticated",
					async ({ userPage }: { userPage: Page }) =>
					{
						await userPage.goto(ROUTES.home);
						await userPage.waitForLoadState("load");

						const banner =
							userPage.locator(SELECTORS.accessibility.banner);

						await expect(banner)
							.toBeVisible();

						const main =
							userPage.locator(SELECTORS.accessibility.main);

						await expect(main)
							.toBeVisible();
					});

				test("should make skip link functional when authenticated",
					async ({ userPage }: { userPage: Page }) =>
					{
						await userPage.goto(ROUTES.home);
						await userPage.waitForLoadState("load");

						const skipLink =
							userPage.locator(SELECTORS.accessibility.skipLink);

						// Verify skip link exists and has correct href
						await expect(skipLink)
							.toBeVisible();

						await expect(skipLink)
							.toHaveAttribute("href", "#main-content");

						// Verify main content target exists with correct id
						const mainContent =
							userPage.locator(SELECTORS.accessibility.mainContent);

						await expect(mainContent)
							.toBeVisible();

						// Verify main content has tabindex for focus
						await expect(mainContent)
							.toHaveAttribute("tabindex", "-1");
					});
			});
	});
