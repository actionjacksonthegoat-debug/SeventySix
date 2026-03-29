import { defineConfig, devices } from "@playwright/test";

/** Playwright configuration for SeventySixCommerce TanStack E2E tests. */
export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: process.env.CI ? 2 : undefined,
	reporter: [
		["html", { open: "never" }],
		["list"]
	],
	timeout: process.env.CI ? 60_000 : 45_000,
	expect: {
		timeout: process.env.CI ? 15_000 : 10_000
	},
	use: {
		baseURL: "http://localhost:3012",
		trace: "on-first-retry",
		screenshot: "only-on-failure"
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] }
		}
	],
	webServer: {
		command: "docker compose -f docker-compose.e2e.yml up --build",
		url: "http://localhost:3012/api/healthz",
		reuseExistingServer: true,
		timeout: 120_000
	}
});
