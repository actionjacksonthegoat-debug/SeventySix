// <copyright file="e2e-full.mjs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Cross-platform E2E test runner with guaranteed teardown.
 * Handles setup, test execution, and teardown regardless of test results.
 */

import { spawnSync } from "child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DOCKER_COMPOSE_FILE =
	"../docker-compose.e2e.yml";

/**
 * When true, skips teardown so the E2E environment stays running for
 * Playwright MCP debugging against https://localhost:4201.
 *
 * Usage:
 *   npm run test:e2e -- --keepalive
 *   npm run test:e2e -- --keepalive specs/auth/login.spec.ts
 */
const KEEP_ALIVE =
	process.argv.includes("--keepalive");

/**
 * Collects extra CLI arguments passed after `--` and forwards them to Playwright.
 * Supports --grep, --project, and spec file paths.
 * Filters out the --keepalive flag so Playwright does not receive it.
 *
 * Usage examples:
 *   npm run test:e2e -- --grep "Login Page"
 *   npm run test:e2e -- --grep "should display login heading"
 *   npm run test:e2e -- specs/public/login.spec.ts
 *   npm run test:e2e -- --project=admin
 *   npm run test:e2e -- --grep "RBAC" --project=admin
 */
const EXTRA_PLAYWRIGHT_ARGS =
	process.argv
		.slice(2)
		.filter(arg => arg !== "--keepalive")
		.join(" ");

// Certificate path for proper SSL validation (matches dev environment)
const scriptDirectory =
	path.dirname(fileURLToPath(import.meta.url));
const SSL_CERTIFICATE_PATH =
	path.resolve(scriptDirectory, "..", "ssl", "dev-certificate.crt");

/**
 * Runs a shell command synchronously and returns the exit code.
 * @param commandWithArgs
 * The full command string to run.
 * @param label
 * Display label for the command.
 * @returns
 * The exit code (0 for success).
 */
function runCommand(
	commandWithArgs,
	label)
{
	console.log(`\n${"=".repeat(60)}`);
	console.log(`Running: ${label}`);
	console.log(`${"=".repeat(60)}\n`);

	try
	{
		const result =
			spawnSync(
				commandWithArgs,
				{
					stdio: "inherit",
					shell: true,
					env: {
						...process.env,
						NODE_EXTRA_CA_CERTS: SSL_CERTIFICATE_PATH
					}
				});

		if (result.error)
		{
			console.error(`Failed to run ${label}:`, result.error.message);
			return 1;
		}

		return result.status ?? 0;
	}
	catch (error)
	{
		console.error(`Exception running ${label}:`, error.message);
		return 1;
	}
}

/**
 * Runs the E2E environment setup.
 * @returns
 * Exit code (0 for success).
 */
function setup()
{
	// Kill any local processes on ports that E2E needs (Windows-specific)
	// This prevents conflicts between local dev servers and E2E Docker containers
	if (process.platform === "win32")
	{
		const cleanupPortsCode =
			runCommand(
				"powershell -ExecutionPolicy Bypass -File ../scripts/internal/cleanup-ports.ps1 -Quiet",
				"Killing orphaned local processes on E2E ports");

		if (cleanupPortsCode !== 0)
		{
			console.warn("Warning: Port cleanup encountered issues, continuing anyway...");
		}
	}

	// Clean up any existing containers and volumes
	const cleanupCode =
		runCommand(
			`docker compose -f ${DOCKER_COMPOSE_FILE} down -v --remove-orphans`,
			"Cleaning up existing containers and volumes");

	if (cleanupCode !== 0)
	{
		return cleanupCode;
	}

	// Build containers (Docker layer caching speeds up unchanged layers)
	const buildCode =
		runCommand(
			`docker compose -f ${DOCKER_COMPOSE_FILE} build api-e2e client-e2e`,
			"Building E2E containers (API + Client)");

	if (buildCode !== 0)
	{
		return buildCode;
	}

	// Start containers
	const startCode =
		runCommand(
			`docker compose -f ${DOCKER_COMPOSE_FILE} up -d`,
			"Starting E2E containers");

	if (startCode !== 0)
	{
		return startCode;
	}

	// Wait for API
	const waitApiCode =
		runCommand(
			"node scripts/wait-for-api.mjs",
			"Waiting for API");

	if (waitApiCode !== 0)
	{
		return waitApiCode;
	}

	// Wait for client
	const waitClientCode =
		runCommand(
			"node scripts/wait-for-client.mjs",
			"Waiting for client");

	return waitClientCode;
}

/**
 * Runs the Playwright E2E tests.
 * Forwards any extra CLI arguments (--grep, file paths, --project) to Playwright.
 * @returns
 * Exit code (0 for success).
 */
function runTests()
{
	const playwrightCommand =
		EXTRA_PLAYWRIGHT_ARGS
			? `npx playwright test ${EXTRA_PLAYWRIGHT_ARGS}`
			: "npx playwright test";

	const label =
		EXTRA_PLAYWRIGHT_ARGS
			? `Playwright E2E Tests (filtered: ${EXTRA_PLAYWRIGHT_ARGS})`
			: "Playwright E2E Tests";

	return runCommand(
		playwrightCommand,
		label);
}

/**
 * Tears down the E2E environment.
 * @returns
 * Exit code (0 for success).
 */
function teardown()
{
	return runCommand(
		`docker compose -f ${DOCKER_COMPOSE_FILE} down -v --remove-orphans`,
		"Tearing down E2E containers and volumes");
}

/**
 * Dumps diagnostic information from all E2E containers.
 * Called on setup or test failure BEFORE teardown so containers are still available.
 * @param phase
 * The phase that failed ("Setup" or "Tests").
 */
function dumpDiagnostics(phase)
{
	console.log(`\n${"!".repeat(60)}`);
	console.log(`  DIAGNOSTIC DUMP — ${phase} failed`);
	console.log(`${"!".repeat(60)}\n`);

	// Container status
	runCommand(
		`docker compose -f ${DOCKER_COMPOSE_FILE} ps -a`,
		"Container Status");

	// Individual container logs (most useful → least useful order)
	const containers =
		["seventysix-api-e2e", "seventysix-client-e2e", "seventysix-postgres-e2e", "seventysix-valkey-e2e", "seventysix-maildev-e2e"];

	for (const container of containers)
	{
		runCommand(
			`docker logs ${container} --tail 25 2>&1 || true`,
			`Logs: ${container}`);
	}

	// Docker events (recent container lifecycle events)
	runCommand(
		`docker events --since 5m --until 0s --filter type=container --format "{{.Time}} {{.Action}} {{.Actor.Attributes.name}}" 2>&1 || true`,
		"Recent Docker Events");

	console.log(`\n${"!".repeat(60)}`);
	console.log("  END DIAGNOSTIC DUMP");
	console.log(`${"!".repeat(60)}\n`);
}

/**
 * Main execution flow for E2E tests.
 * Always runs teardown regardless of setup or test failures.
 */
function main()
{
	console.log("\nStarting E2E Test Suite\n");

	if (EXTRA_PLAYWRIGHT_ARGS)
	{
		console.log(`Filter: ${EXTRA_PLAYWRIGHT_ARGS}\n`);
	}

	let testExitCode =
		0;

	// Setup phase
	const setupExitCode =
		setup();

	if (setupExitCode !== 0)
	{
		console.error("\n[FAIL] Setup failed - skipping tests\n");
		testExitCode =
			setupExitCode;

		dumpDiagnostics("Setup");
	}
	else
	{
		// Test phase (only if setup succeeded)
		testExitCode =
			runTests();

		if (testExitCode === 0)
		{
			console.log("\n[PASS] All E2E tests passed!\n");
		}
		else
		{
			console.error(`\n[FAIL] E2E tests failed with exit code: ${testExitCode}\n`);
			console.log("Run 'npx playwright show-report' for detailed failure info.\n");
		}
	}

	// Teardown phase (skipped in keepalive mode)
	let teardownExitCode =
		0;

	if (KEEP_ALIVE)
	{
		console.log("\n" + "=".repeat(60));
		console.log("  KEEPALIVE MODE — Skipping teardown");
		console.log("  E2E environment remains running at https://localhost:4201");
		console.log("  Manual cleanup: docker compose -f docker-compose.e2e.yml down -v --remove-orphans");
		console.log("=" .repeat(60) + "\n");
	}
	else
	{
		console.log("\nRunning teardown (always executed)...\n");

		teardownExitCode =
			teardown();

		if (teardownExitCode !== 0)
		{
			console.error("\n[WARN] Teardown encountered issues\n");
		}
	}

	// Report final results
	console.log("\n" + "=".repeat(60));
	console.log("E2E Test Suite Complete");
	console.log("=".repeat(60));
	console.log(`  Setup:    ${setupExitCode === 0 ? "[PASS]" : "[FAIL]"}`);
	console.log(`  Tests:    ${testExitCode === 0 ? "[PASS]" : "[FAIL]"}`);
	console.log(`  Teardown: ${KEEP_ALIVE ? "[SKIP] KeepAlive" : teardownExitCode === 0 ? "[PASS]" : "[WARN] Issues"}`);
	console.log("=".repeat(60) + "\n");

	// Set exit code and let Node.js exit naturally after the event loop drains.
	// Using process.exitCode instead of process.exit() ensures all stdio pipes
	// (especially Docker's stderr output) are fully flushed before termination,
	// preventing npm from misinterpreting a broken pipe as a script failure.
	process.exitCode =
		testExitCode;
}

main();
