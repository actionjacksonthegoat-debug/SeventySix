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
 * Number of per-worker auth state files created per role.
 * Must be >= the maximum Playwright worker count (4 in CI, up to 8 locally).
 * Each worker uses its own session to prevent token-rotation conflicts
 * that would occur when multiple workers refresh the same refresh token.
 */
const WORKER_SESSION_COUNT: number = 8;

/**
 * Logs in as a test user and saves the browser storage state to a file.
 * @param browser
 * The Playwright browser instance.
 * @param baseURL
 * The base URL for the application.
 * @param testUser
 * The test user to log in as.
 * @param sessionIndex
 * The index suffix appended to the auth state filename (0-based).
 * @returns
 * A promise that resolves when the login and state save are complete.
 */
async function loginAndSaveSession(
	browser: Browser,
	baseURL: string,
	testUser: TestUser,
	sessionIndex: number): Promise<void>
{
	const browserContext: BrowserContext =
		await browser.newContext(
			{ baseURL, ignoreHTTPSErrors: true });
	const page: Page =
		await browserContext.newPage();

	await page.goto(ROUTES.auth.login);
	await page
		.locator(SELECTORS.form.usernameInput)
		.waitFor(
			{ state: "visible", timeout: TIMEOUTS.globalSetup });

	await page
		.locator(SELECTORS.form.usernameInput)
		.fill(testUser.username);
	await page
		.locator(SELECTORS.form.passwordInput)
		.fill(testUser.password);

	await solveAltchaChallenge(
		page,
		{ initTimeout: TIMEOUTS.globalSetup });

	await page
		.locator(SELECTORS.form.submitButton)
		.click();
	await page.waitForURL(ROUTES.home);

	await page
		.locator(SELECTORS.layout.userMenuButton)
		.waitFor(
			{ state: "visible", timeout: TIMEOUTS.auth });

	const authDir: string =
		path.join(process.cwd(), "e2e", ".auth");
	const authStatePath: string =
		path.join(authDir, `${testUser.role.toLowerCase()}_${sessionIndex}.json`);
	await browserContext.storageState(
		{ path: authStatePath });

	await browserContext.close();
}

/**
 * Global setup that runs once before all tests.
 * Creates authenticated browser states for each role.
 * Creates WORKER_SESSION_COUNT sessions per role so that each parallel
 * Playwright worker has its own unique refresh token, preventing token-rotation
 * conflicts that would occur when workers share the same session.
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

	// Authenticate each test role in parallel — each uses its own context and auth file.
	// MFA-enabled users are excluded because they require MFA verification after login
	// and cannot complete the standard login → home redirect flow.
	// WORKER_SESSION_COUNT separate sessions are created per role so that each
	// Playwright worker gets its own unique refresh token (prevents rotation conflicts).
	const nonMfaUsers: Array<TestUser> =
		TEST_USERS.filter(
			(testUser) => !testUser.mfaEnabled);

	const loginTasks: Array<Promise<void>> = [];

	for (const testUser of nonMfaUsers)
	{
		for (let sessionIndex: number = 0; sessionIndex < WORKER_SESSION_COUNT; sessionIndex++)
		{
			loginTasks.push(
				loginAndSaveSession(
					browser,
					baseURL,
					testUser,
					sessionIndex));
		}
	}

	await Promise.all(loginTasks);

	await browser.close();
}

export default globalSetup;