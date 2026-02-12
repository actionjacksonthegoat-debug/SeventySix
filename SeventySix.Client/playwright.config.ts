import { defineConfig, devices, Project } from "@playwright/test";

/**
 * Shared device configuration for all projects.
 */
const DESKTOP_CHROME =
	devices["Desktop Chrome"];

/**
 * Auth state path pattern - DRY helper.
 * @param role
 * The role name (lowercase).
 * @returns
 * Path to the auth state file.
 */
function getAuthStatePath(role: string): string
{
	return `e2e/.auth/${role}.json`;
}

/**
 * Creates an authenticated project configuration.
 * Reduces duplication across role-based projects.
 * @param role
 * The role name for the project.
 * @returns
 * Project configuration for the role.
 */
function createAuthenticatedProject(role: string): Project
{
	return {
		name: role,
		testDir: `./e2e/specs/${role}`,
		dependencies: ["setup"],
		use: {
			...DESKTOP_CHROME,
			storageState: getAuthStatePath(role)
		}
	};
}

/**
 * Playwright configuration for E2E tests.
 * Supports authenticated and unauthenticated test scenarios.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: 1,
	workers: process.env.CI ? 4 : undefined,
	reporter: [
		["html", { outputFolder: "playwright-report", open: "never" }],
		["./e2e/reporters/concise-reporter.ts"]
	],
	timeout: 30000,
	expect: {
		timeout: 10000
	},

	use: {
		baseURL: "https://localhost:4201",
		ignoreHTTPSErrors: true, // Allow self-signed certs for E2E
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		video: "retain-on-failure"
	},

	// Global setup for authentication
	globalSetup: "./e2e/global-setup.ts",

	projects: [
		// Setup project - creates auth states
		{
			name: "setup",
			testMatch: /global-setup\.ts/
		},

		// Public tests - no authentication
		{
			name: "public",
			testDir: "./e2e/specs/public",
			use: { ...DESKTOP_CHROME }
		},

		// Authenticated tests - uses User role auth state
		{
			name: "authenticated",
			testDir: "./e2e/specs/authenticated",
			dependencies: ["setup"],
			use: {
				...DESKTOP_CHROME,
				storageState: getAuthStatePath("user")
			}
		},

		// Admin tests - uses Admin role auth state
		createAuthenticatedProject("admin"),

		// Developer tests - uses Developer role auth state
		createAuthenticatedProject("developer")
	],

	// Web server to start - reuseExistingServer detects if containers are running
	webServer: {
		command: "npm run start -- --configuration e2e",
		url: "https://localhost:4201",
		ignoreHTTPSErrors: true,
		reuseExistingServer: true,
		timeout: 120000
	}
});
