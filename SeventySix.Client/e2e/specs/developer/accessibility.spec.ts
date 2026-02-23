import AxeBuilder from "@axe-core/playwright";
import {
	expect,
	expectAccessible,
	ROUTE_GROUPS,
	test
} from "@e2e-fixtures";
import { Page } from "@playwright/test";
import type { AxeResults, Result } from "axe-core";

/**
 * WCAG Accessibility E2E Tests for Developer Pages
 *
 * Tests cover WCAG 2.2 AA compliance across developer routes.
 * Uses authenticated developer context for testing protected pages.
 *
 * @wcag 1.1.1 Non-text Content (Level A)
 * @wcag 1.4.3 Contrast (Minimum) (Level AA)
 * @wcag 2.1.1 Keyboard (Level A)
 * @wcag 2.4.7 Focus Visible (Level AA)
 * @wcag 4.1.2 Name, Role, Value (Level A)
 */
test.describe("Developer Routes - WCAG Accessibility",
	() =>
	{
		for (const pageInfo of ROUTE_GROUPS.developerAccessibilityPages)
		{
		// eslint-disable-next-line playwright/expect-expect -- assertions inside expectAccessible
			test(
				`should have no critical accessibility violations on ${pageInfo.name} page`,
				async ({ developerPage }: { developerPage: Page; }) =>
				{
					await developerPage.goto(pageInfo.path);

					await expectAccessible(developerPage, `Developer ${pageInfo.name}`);
				});
		}

		test.describe("Color Contrast",
			() =>
			{
				test(
					"should have adequate color contrast on style guide page",
					async ({ developerPage }: { developerPage: Page; }) =>
					{
						await developerPage.goto(ROUTE_GROUPS.developerAccessibilityPages[0].path);

						const axeResults: AxeResults =
							await new AxeBuilder(
								{ page: developerPage })
								.withTags(
									["wcag2aa"])
								.analyze();

						const contrastViolations: Result[] =
							axeResults.violations.filter(
								(violation: Result) =>
									violation.id === "color-contrast");

						expect(
							contrastViolations,
							"Color contrast violations found on style guide")
							.toHaveLength(0);
					});
			});
	});