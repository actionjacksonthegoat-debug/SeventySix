// <copyright file="accessibility.helper.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import type { Result, Results } from "axe-core";

/**
 * Runs an axe-core accessibility scan and asserts
 * zero critical/serious WCAG violations.
 *
 * @param page
 * The Playwright page instance to scan.
 *
 * @param pageName
 * Human-readable page name for error logging.
 */
export async function expectAccessible(
	page: Page,
	pageName: string): Promise<void>
{
	// Wait for all network activity to settle so Angular defer blocks
	// and dynamic content are fully rendered before running the axe scan.
	// eslint-disable-next-line playwright/no-networkidle
	await page.waitForLoadState("networkidle");

	const axeResults: Results =
		await new AxeBuilder(
			{ page })
			.withTags(
				["wcag2a", "wcag2aa", "wcag21aa"])
			.analyze();

	const criticalViolations: Result[] =
		axeResults.violations.filter(
			(violation: Result) =>
				violation.impact === "critical"
					|| violation.impact === "serious");

	if (criticalViolations.length > 0)
	{
		process.stdout.write(
			`Accessibility violations on ${pageName}: ${
				JSON.stringify(
					criticalViolations.map(
						(violation: Result) => (
							{
								id: violation.id,
								impact: violation.impact,
								description: violation.description,
								nodes: violation
									.nodes
									.map(
										(node) => node.html)
									.slice(0, 3)
							})),
					null,
					2)
			}\n`);
	}

	expect(
		criticalViolations,
		`Found ${criticalViolations.length} critical/serious accessibility violations on ${pageName}`)
		.toHaveLength(0);
}