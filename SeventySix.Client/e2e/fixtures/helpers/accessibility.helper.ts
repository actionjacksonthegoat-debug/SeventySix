// <copyright file="accessibility.helper.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import type { Result } from "axe-core";

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
	const axeResults =
		await new AxeBuilder(
			{ page })
			.withTags(["wcag2a", "wcag2aa", "wcag21aa"])
			.analyze();

	const criticalViolations: Result[] =
		axeResults.violations.filter(
			(violation: Result) =>
				violation.impact === "critical"
				|| violation.impact === "serious");

	if (criticalViolations.length > 0)
	{
		console.log(
			`Accessibility violations on ${pageName}:`,
			JSON.stringify(
				criticalViolations.map(
					(violation: Result) =>
					(
						{
							id: violation.id,
							impact: violation.impact,
							description: violation.description,
							nodes: violation.nodes.map(
								(node) => node.html).slice(0, 3)
						})),
				null,
				2));
	}

	expect(
		criticalViolations,
		`Found ${criticalViolations.length} critical/serious accessibility violations on ${pageName}`)
		.toHaveLength(0);
}
