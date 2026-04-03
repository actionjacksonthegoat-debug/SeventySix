import AxeBuilder from "@axe-core/playwright";
import { test, expect, ROUTES } from "../fixtures";

test.describe("Accessibility",
	() =>
	{
		test("homepage should have no critical accessibility violations",
			async ({ page }) =>
			{
				await page.goto(ROUTES.home);

				const axeResults =
					await new AxeBuilder({ page })
						.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
						.analyze();

				const criticalViolations =
					axeResults.violations.filter(
						(violation) =>
							violation.impact === "critical"
								|| violation.impact === "serious");

				expect(criticalViolations).toHaveLength(0);
			});
	});
