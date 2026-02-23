// <copyright file="scroll.helper.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import type { Locator, Page } from "@playwright/test";

/**
 * Scrolls the landing page container using mouse wheel until a target element
 * is in the viewport. Used to trigger @defer (on viewport) blocks.
 *
 * @param page
 * The Playwright page instance.
 *
 * @param options
 * Configuration for scrolling behavior.
 */
export async function scrollUntilVisible(
	page: Page,
	options:
		{
			targetLocator: Locator;
			containerSelector?: string;
			scrollIncrement?: number;
			maxAttempts?: number;
		}): Promise<void>
{
	const containerSelector: string =
		options.containerSelector ?? ".landing-page";
	const scrollIncrement: number =
		options.scrollIncrement ?? 400;
	const maxAttempts: number =
		options.maxAttempts ?? 30;

	await page.locator(containerSelector)
		.click({ position: { x: 100, y: 100 } });

	for (let attempt: number = 0; attempt < maxAttempts; attempt++)
	{
		await page.mouse.wheel(0, scrollIncrement);

		const isVisible: boolean =
			await options.targetLocator.count()
				.then((count) => count > 0);

		if (isVisible)
		{
			return;
		}
	}
}

/**
 * Triggers all @defer (on viewport) blocks by scrolling through the entire
 * landing page, then scrolls back to top.
 *
 * @param page
 * The Playwright page instance.
 */
export async function triggerAllDeferBlocks(page: Page): Promise<void>
{
	await scrollUntilVisible(page,
		{
			targetLocator: page.locator("section.cta-footer")
		});

	// Scroll back to top
	await page.evaluate(
		() =>
		{
			const container: Element | null =
				document.querySelector(".landing-page");

			if (container)
			{
				container.scrollTo({ top: 0, behavior: "instant" });
			}

			window.scrollTo({ top: 0, behavior: "instant" });
		});
}
