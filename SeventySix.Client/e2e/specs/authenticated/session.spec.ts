// <copyright file="session.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { Page, BrowserContext } from "@playwright/test";
import {
	test,
	expect,
	unauthenticatedTest,
	loginInFreshContext,
	CONCURRENT_USER,
	SELECTORS,
	ROUTES,
	TIMEOUTS,
	E2E_CONFIG
} from "../../fixtures";

/**
 * E2E Tests for Session Management
 *
 * Priority: P1 (Security Hardening) + P2 (Complete Coverage)
 * Tests session continuity, token refresh, and concurrent sessions:
 * - Authenticated user can navigate to protected pages
 * - Session persists across page navigation
 * - Concurrent sessions from multiple browser contexts
 */
test.describe("Session Continuity",
	() =>
	{
		test("should load protected page content when authenticated",
			async ({ userPage }: { userPage: Page }) =>
			{
				await userPage.goto(ROUTES.account.root);

				// Verify profile page loads with authenticated content
				await expect(userPage.locator(SELECTORS.layout.userMenuButton))
					.toBeVisible({ timeout: TIMEOUTS.auth });

				// Verify we stayed on the protected route
				await expect(userPage)
					.toHaveURL(/\/account/);
			});

		test("should maintain session across page navigation",
			async ({ userPage }: { userPage: Page }) =>
			{
				// Navigate to home
				await userPage.goto(ROUTES.home);

				await expect(userPage.locator(SELECTORS.layout.userMenuButton))
					.toBeVisible({ timeout: TIMEOUTS.auth });

				// Navigate to protected route
				await userPage.goto(ROUTES.account.root);

				// Should still be authenticated
				await expect(userPage.locator(SELECTORS.layout.userMenuButton))
					.toBeVisible({ timeout: TIMEOUTS.auth });

				// Navigate back to home
				await userPage.goto(ROUTES.home);

				// Still authenticated
				await expect(userPage.locator(SELECTORS.layout.userMenuButton))
					.toBeVisible({ timeout: TIMEOUTS.auth });
			});
	});

/**
 * Concurrent Sessions — Isolated Test
 *
 * Uses a dedicated `e2e_concurrent` user via `unauthenticatedTest` to verify
 * that the same user can be authenticated in two separate browser contexts
 * simultaneously (server allows up to 5 concurrent sessions).
 */
unauthenticatedTest.describe("Concurrent Sessions",
	() =>
	{
		unauthenticatedTest("should allow same user to be authenticated in two browser contexts",
			async ({ browser }) =>
			{
				// Login in two separate browser contexts
				const session1 =
					await loginInFreshContext(browser, CONCURRENT_USER);
				const session2 =
					await loginInFreshContext(browser, CONCURRENT_USER);

				try
				{
					// Both sessions should be authenticated
					await session1.page.goto(ROUTES.account.root);
					await expect(session1.page.locator(SELECTORS.layout.userMenuButton))
						.toBeVisible({ timeout: TIMEOUTS.auth });

					await session2.page.goto(ROUTES.account.root);
					await expect(session2.page.locator(SELECTORS.layout.userMenuButton))
						.toBeVisible({ timeout: TIMEOUTS.auth });
				}
				finally
				{
					await session1.context.close();
					await session2.context.close();
				}
			});
	});
