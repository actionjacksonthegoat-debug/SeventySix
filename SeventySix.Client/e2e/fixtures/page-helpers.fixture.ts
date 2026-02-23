// <copyright file="page-helpers.fixture.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { test as base } from "./diagnostics.fixture";
import { AdminDashboardPageHelper } from "./pages/admin-dashboard.page";
import { AuthPageHelper } from "./pages/auth.page";
import { HomePageHelper } from "./pages/home.page";

/**
 * Page helper fixtures for E2E tests.
 * Eliminates redundant page helper instantiation in every test.
 */
interface PageHelperFixtures
{
	/**
	 * Auth page helper for login form interactions.
	 */
	authPage: AuthPageHelper;

	/**
	 * Home page helper for feature card interactions.
	 */
	homePage: HomePageHelper;

	/**
	 * Admin dashboard page helper for tab navigation.
	 */
	adminDashboardPage: AdminDashboardPageHelper;
}

/**
 * Extended test fixture with pre-configured page helpers.
 * Import this instead of base test to get page helpers automatically.
 */
export const test: ReturnType<typeof base.extend<PageHelperFixtures>> =
	base.extend<PageHelperFixtures>(
		{
			authPage: async ({ page }, use) =>
			{
				await use(new AuthPageHelper(page));
			},
			homePage: async ({ page }, use) =>
			{
				await use(new HomePageHelper(page));
			},
			adminDashboardPage: async ({ page }, use) =>
			{
				await use(new AdminDashboardPageHelper(page));
			}
		});

export { expect } from "@playwright/test";
export type { Browser, BrowserContext, Page } from "@playwright/test";