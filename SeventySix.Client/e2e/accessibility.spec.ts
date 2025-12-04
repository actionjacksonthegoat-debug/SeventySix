import { test, expect, Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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

interface AxeViolation
{
	id: string;
	impact: string | null;
	description: string;
	nodes: Array<{ html: string; target: string[] }>;
}

interface AxeResults
{
	violations: AxeViolation[];
}

/**
 * Pages to test for accessibility compliance.
 * Limited to public pages to avoid authentication complexity.
 */
const PUBLIC_PAGES: Array<{ path: string; name: string }> = [
	{ path: "/", name: "Home" },
	{ path: "/auth/login", name: "Login" },
	{ path: "/auth/register", name: "Register" },
	{ path: "/auth/forgot-password", name: "Forgot Password" }
];

test.describe("WCAG Accessibility Compliance", () =>
{
	for (const pageInfo of PUBLIC_PAGES)
	{
		test(`${pageInfo.name} page has no critical accessibility violations`, async ({
			page
		}: {
			page: Page;
		}) =>
		{
			await page.goto(pageInfo.path);

			// Wait for page to be fully loaded
			await page.waitForLoadState("networkidle");

			const axeResults: AxeResults = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
				.analyze();

			// Filter for critical and serious violations only
			const criticalViolations: AxeViolation[] =
				axeResults.violations.filter(
					(violation: AxeViolation) =>
						violation.impact === "critical" ||
						violation.impact === "serious"
				);

			// Log violations for debugging (only if there are failures)
			if (criticalViolations.length > 0)
			{
				console.log(
					`Accessibility violations on ${pageInfo.name}:`,
					JSON.stringify(
						criticalViolations.map((v: AxeViolation) => ({
							id: v.id,
							impact: v.impact,
							description: v.description,
							nodes: v.nodes.map((n) => n.html).slice(0, 3)
						})),
						null,
						2
					)
				);
			}

			expect(
				criticalViolations,
				`Found ${criticalViolations.length} critical/serious accessibility violations on ${pageInfo.name} page`
			).toHaveLength(0);
		});
	}

	test.describe("Color Contrast", () =>
	{
		test("home page has adequate color contrast", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			await page.goto("/");
			await page.waitForLoadState("networkidle");

			const axeResults: AxeResults = await new AxeBuilder({ page })
				.withTags(["wcag2aa"])
				.analyze();

			const contrastViolations: AxeViolation[] =
				axeResults.violations.filter(
					(violation: AxeViolation) =>
						violation.id === "color-contrast"
				);

			expect(
				contrastViolations,
				"Color contrast violations found"
			).toHaveLength(0);
		});

		test("login form has adequate color contrast", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			await page.goto("/auth/login");
			await page.waitForLoadState("networkidle");

			const axeResults: AxeResults = await new AxeBuilder({ page })
				.withTags(["wcag2aa"])
				.analyze();

			const contrastViolations: AxeViolation[] =
				axeResults.violations.filter(
					(violation: AxeViolation) =>
						violation.id === "color-contrast"
				);

			expect(
				contrastViolations,
				"Color contrast violations found on login form"
			).toHaveLength(0);
		});
	});

	test.describe("Keyboard Navigation", () =>
	{
		test("all interactive elements are keyboard accessible", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			await page.goto("/");
			await page.waitForLoadState("networkidle");

			const axeResults: AxeResults = await new AxeBuilder({ page })
				.withTags(["wcag2a"])
				.analyze();

			const keyboardViolations: AxeViolation[] =
				axeResults.violations.filter(
					(violation: AxeViolation) =>
						violation.id === "keyboard" ||
						violation.id === "focus-order-semantics" ||
						violation.id === "focusable-content"
				);

			expect(
				keyboardViolations,
				"Keyboard accessibility violations found"
			).toHaveLength(0);
		});

		test("skip link is functional", async ({ page }: { page: Page }) =>
		{
			await page.goto("/");

			// Press Tab to focus skip link
			await page.keyboard.press("Tab");

			// Verify skip link is focused
			const skipLink = page.locator(".skip-link");
			await expect(skipLink).toBeFocused();

			// Activate skip link
			await page.keyboard.press("Enter");

			// Verify main content is focused
			const mainContent = page.locator("#main-content");
			await expect(mainContent).toBeFocused();
		});
	});

	test.describe("ARIA and Semantic Structure", () =>
	{
		test("pages have proper landmark regions", async ({
			page
		}: {
			page: Page;
		}) =>
		{
			await page.goto("/");
			await page.waitForLoadState("networkidle");

			// Verify banner landmark (header)
			const banner = page.locator("[role='banner']");
			await expect(banner).toBeVisible();

			// Verify main content landmark
			const main = page.locator("main, [role='main']");
			await expect(main).toBeVisible();

			// Verify navigation landmark
			const nav = page.locator("[role='navigation']");
			await expect(nav).toHaveCount(2); // Sidebar + skip link target
		});

		test("images have alt text", async ({ page }: { page: Page }) =>
		{
			await page.goto("/");
			await page.waitForLoadState("networkidle");

			const axeResults: AxeResults = await new AxeBuilder({ page })
				.withTags(["wcag2a"])
				.analyze();

			const imageViolations: AxeViolation[] =
				axeResults.violations.filter(
					(violation: AxeViolation) =>
						violation.id === "image-alt" ||
						violation.id === "image-redundant-alt"
				);

			expect(
				imageViolations,
				"Image accessibility violations found"
			).toHaveLength(0);
		});
	});
});
