import {
	expect,
	ROUTES,
	test
} from "@e2e-fixtures";
import type { Locator } from "@playwright/test";

/**
 * Subresource Integrity (SRI) E2E Tests
 *
 * Validates that production builds include integrity attributes
 * on all script and stylesheet tags for defense-in-depth against
 * CDN compromise or build artifact tampering.
 */

test.describe("Subresource Integrity",
	() =>
	{
		test.beforeEach(
			async ({ page }) =>
			{
				await page.goto(ROUTES.home);
			});

		test("should have integrity attributes on all script tags",
			async ({ page }) =>
			{
				const scripts: Locator[] =
					await page
						.locator("script[src]")
						.all();

				expect(scripts.length)
					.toBeGreaterThan(0);

				for (const script of scripts)
				{
					await expect(script)
						.toHaveAttribute("integrity", /^sha(256|384|512)-.+/);
					await expect(script)
						.toHaveAttribute("crossorigin", "anonymous");
				}
			});

		test("should have integrity attributes on all stylesheet links",
			async ({ page }) =>
			{
				const stylesheets: Locator[] =
					await page
						.locator("link[rel='stylesheet'][href]")
						.all();

				for (const stylesheet of stylesheets)
				{
					await expect(stylesheet)
						.toHaveAttribute("integrity", /^sha(256|384|512)-.+/);
				}
			});
	});