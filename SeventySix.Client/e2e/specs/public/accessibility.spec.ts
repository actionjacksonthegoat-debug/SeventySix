import {
	test,
	expect,
	ROUTES,
	ROUTE_GROUPS,
	SELECTORS,
	TIMEOUTS,
	expectAccessible
} from "@e2e-fixtures";
import AxeBuilder from "@axe-core/playwright";
import type { Result } from "axe-core";

/**
 * WCAG Accessibility E2E Tests using axe-core
 *
 * Tests cover WCAG 2.2 AA compliance across key pages.
 * Validates color contrast, semantic structure, and keyboard accessibility.
 *
 * @remarks
 * Uses axe-core/playwright for automated accessibility auditing.
 * Filters for critical and serious violations only to avoid noise.
 */

test.describe("WCAG Accessibility Compliance",
	() =>
	{
		for (const pageInfo of ROUTE_GROUPS.publicPages)
		{
			// eslint-disable-next-line playwright/expect-expect -- assertions inside expectAccessible
			test(`should have no critical accessibility violations on ${pageInfo.name} page`,
				async ({ page }) =>
				{
					await page.goto(pageInfo.path);

					await expectAccessible(page, pageInfo.name);
				});
		}

		test.describe("Color Contrast",
			() =>
			{
				test("should have adequate color contrast on home page",
					async ({ page }) =>
					{
						await page.goto(ROUTES.home);

						const axeResults =
							await new AxeBuilder(
								{ page })
								.withTags(["wcag2aa"])
								.analyze();

						const contrastViolations: Result[] =
							axeResults.violations.filter(
								(violation: Result) => violation.id === "color-contrast");

						expect(
							contrastViolations,
							"Color contrast violations found")
							.toHaveLength(0);
					});

				test("should have adequate color contrast on login form",
					async ({ page }) =>
					{
						await page.goto(ROUTES.auth.login);

						const axeResults =
							await new AxeBuilder(
								{ page })
								.withTags(["wcag2aa"])
								.analyze();

						const contrastViolations: Result[] =
							axeResults.violations.filter(
								(violation: Result) => violation.id === "color-contrast");

						expect(
							contrastViolations,
							"Color contrast violations found on login form")
							.toHaveLength(0);
					});
			});

		test.describe("Keyboard Navigation",
			() =>
			{
				test("should make all interactive elements keyboard accessible",
					async ({ page }) =>
					{
						await page.goto(ROUTES.home);

						const axeResults =
							await new AxeBuilder(
								{ page })
								.withTags(["wcag2a"])
								.analyze();

						const keyboardViolations: Result[] =
							axeResults.violations.filter(
								(violation: Result) =>
									violation.id === "keyboard"
									|| violation.id === "focus-order-semantics"
									|| violation.id === "focusable-content");

						expect(
							keyboardViolations,
							"Keyboard accessibility violations found")
							.toHaveLength(0);
					});

				test("should make skip link functional",
					async ({ page }) =>
					{
						await page.goto(ROUTES.home);

						// Press Tab to focus skip link
						await page.keyboard.press("Tab");

						// Verify skip link is focused
						const skipLink =
							page.locator(SELECTORS.accessibility.skipLink);

						await expect(skipLink)
							.toBeFocused();

						// Activate skip link
						await page.keyboard.press("Enter");

						// Verify main content is focused
						const mainContent =
							page.locator(SELECTORS.accessibility.mainContent);

						await expect(mainContent)
							.toBeFocused();
					});
			});

		test.describe("ARIA and Semantic Structure",
			() =>
			{
				test("should have proper landmark regions on pages",
					async ({ page }) =>
					{
						await page.goto(ROUTES.home);

						// Verify banner landmark (header)
						const banner =
							page.locator(SELECTORS.accessibility.banner);

						await expect(banner)
							.toBeVisible();

						// Verify main content landmark
						const main =
							page.locator(SELECTORS.accessibility.main);

						await expect(main)
							.toBeVisible();

						// Verify navigation landmark
						const nav =
							page.locator(SELECTORS.accessibility.navigation);

						await expect(nav)
							.toHaveCount(2); // Sidebar + skip link target
					});

				test("should have alt text on images",
					async ({ page }) =>
					{
						await page.goto(ROUTES.home);

						const axeResults =
							await new AxeBuilder(
								{ page })
								.withTags(["wcag2a"])
								.analyze();

						const imageViolations: Result[] =
							axeResults.violations.filter(
								(violation: Result) =>
									violation.id === "image-alt"
									|| violation.id === "image-redundant-alt");

						expect(
							imageViolations,
							"Image accessibility violations found")
							.toHaveLength(0);
					});
			});
	});
