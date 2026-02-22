// <copyright file="unauthenticated.fixture.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { test as base, Page, BrowserContext, expect } from "@playwright/test";
import { E2E_CONFIG } from "./index";
import {
	createDiagnosticsCollector,
	instrumentPageForDiagnostics,
	attachDiagnosticsOnFailure,
	DiagnosticsCollector
} from "./diagnostics.fixture";

export { expect };

/**
 * Fixture that provides an unauthenticated page (no storage state).
 * Use this for tests that need to verify unauthenticated behavior
 * even when running in an authenticated project.
 */
interface UnauthenticatedFixtures
{
	/**
	 * Page without any authentication state.
	 */
	unauthenticatedPage: Page;
}

/**
 * Test fixture with unauthenticated page.
 * Use `unauthenticatedTest` from this file for tests that need to
 * verify behavior for anonymous users, even in authenticated projects.
 */
export const unauthenticatedTest =
	base.extend<UnauthenticatedFixtures>({
		unauthenticatedPage:
			async ({ browser }, use, testInfo) =>
			{
				// Create a new context WITHOUT storage state
				const browserContext: BrowserContext =
					await browser.newContext({
						baseURL: E2E_CONFIG.clientBaseUrl,
						storageState: undefined,
						ignoreHTTPSErrors: true
					});

				const page: Page =
					await browserContext.newPage();

				const collector: DiagnosticsCollector =
					createDiagnosticsCollector();
				instrumentPageForDiagnostics(page, collector);

				await use(page);

				await attachDiagnosticsOnFailure(page, collector, testInfo);
				await browserContext.close();
			}
	});
