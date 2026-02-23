// <copyright file="global-setup.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import {
	E2E_CONFIG,
	ROUTES,
	SELECTORS,
	solveAltchaChallenge,
	TEST_USERS,
	type TestUser,
	TIMEOUTS
} from "@e2e-fixtures";
import { Browser, BrowserContext, chromium, FullConfig, Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

/**
 * Global setup that runs once before all tests.
 * Creates authenticated browser states for each role.
 */
async function globalSetup(config: FullConfig): Promise<void>
{
	// Get baseURL from config
	const baseURL: string =
		config.projects[0]?.use?.baseURL ?? E2E_CONFIG.clientBaseUrl;

	// Ensure .auth directory exists
	const authDir: string =
		path.join(process.cwd(), "e2e", ".auth");

	if (!fs.existsSync(authDir))
	{
		fs.mkdirSync(authDir,
			{ recursive: true });
	}

	const browser: Browser =
		await chromium.launch();

	// Authenticate each test role in parallel — each uses its own context and auth file
	// MFA-enabled users are excluded because they require MFA verification after login
	// and cannot complete the standard login → home redirect flow.
	const nonMfaUsers: Array<TestUser> =
		TEST_USERS.filter(
			(testUser) => !testUser.mfaEnabled);

	await Promise.all(
		nonMfaUsers.map(
			async (testUser) =>
			{
				const browserContext: BrowserContext =
					await browser.newContext(
						{ baseURL, ignoreHTTPSErrors: true });
				const page: Page =
					await browserContext.newPage();

				// Navigate to login page and wait for form to be ready
				await page.goto(ROUTES.auth.login);
				await page
					.locator(SELECTORS.form.usernameInput)
					.waitFor(
						{ state: "visible", timeout: TIMEOUTS.globalSetup });

				// Fill login form
				await page
					.locator(SELECTORS.form.usernameInput)
					.fill(testUser.username);
				await page
					.locator(SELECTORS.form.passwordInput)
					.fill(testUser.password);

				await solveAltchaChallenge(
					page,
					{ initTimeout: TIMEOUTS.globalSetup });

				// Submit and wait for redirect
				await page
					.locator(SELECTORS.form.submitButton)
					.click();
				await page.waitForURL(ROUTES.home);

				// Wait for the app to be fully interactive (user menu visible means auth complete)
				// This ensures we capture the final cookie state after authentication
				await page
					.locator(SELECTORS.layout.userMenuButton)
					.waitFor(
						{ state: "visible", timeout: TIMEOUTS.auth });

				// Save storage state for this role
				const authStatePath: string =
					path.join(authDir, `${testUser.role.toLowerCase()}.json`);
				await browserContext.storageState(
					{ path: authStatePath });

				await browserContext.close();
			}));

	await browser.close();
}

export default globalSetup;