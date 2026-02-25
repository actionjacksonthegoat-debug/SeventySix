// <copyright file="generate-openapi.mjs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Generates OpenAPI TypeScript types from the running API.
 * Starts the full solution, fetches swagger.json, saves it, and generates types.
 *
 * Usage: node scripts/generate-openapi.mjs
 */

import { spawn, spawnSync } from "child_process";
import { writeFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { Agent as UndiciAgent } from "undici";

const SCRIPT_DIR =
	dirname(fileURLToPath(import.meta.url));

const ROOT_DIR =
	join(SCRIPT_DIR, "..", "..");

const CLIENT_DIR =
	join(SCRIPT_DIR, "..");

const OPENAPI_JSON_PATH =
	join(ROOT_DIR, "openapi.json");

const API_OPENAPI_URL =
	"https://localhost:7074/openapi/v1.json";

const MAX_POLL_ATTEMPTS =
	60;

const POLL_DELAY_MS =
	2000;

// Development-only HTTPS agent: disables TLS cert validation for self-signed dev certificate.
// Scoped to this script's fetch calls only — does not affect other HTTPS connections process-wide.
// This script only runs at dev time to generate OpenAPI client code, never in production.
const DEV_HTTPS_AGENT = new UndiciAgent({
	connect: {
		rejectUnauthorized: false,
	},
});

/**
 * Runs a command synchronously and returns the exit code.
 * @param {string} commandWithArgs
 * The full command string to run.
 * @param {string} label
 * Display label for the command.
 * @param {string} cwd
 * Working directory for the command.
 * @returns {number}
 * The exit code (0 for success).
 */
function runCommandSync(
	commandWithArgs,
	label,
	cwd = ROOT_DIR)
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
					cwd
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
 * Checks if the API is already running by trying to reach the OpenAPI endpoint.
 * @returns {Promise<boolean>}
 * True if API is already running.
 */
async function isApiRunning()
{
	try
	{
		const response =
			await fetch(API_OPENAPI_URL, { dispatcher: DEV_HTTPS_AGENT });
		return response.ok;
	}
	catch
	{
		return false;
	}
}

/**
 * Waits for the API OpenAPI endpoint to become available.
 * @returns {Promise<boolean>}
 * True if API became available within timeout.
 */
async function waitForOpenApi()
{
	console.log("Waiting for API OpenAPI endpoint...");

	for (let attemptNumber = 1; attemptNumber <= MAX_POLL_ATTEMPTS; attemptNumber++)
	{
		try
		{
			const response =
				await fetch(API_OPENAPI_URL, { dispatcher: DEV_HTTPS_AGENT });

			if (response.ok)
			{
				console.log(`[OK] OpenAPI endpoint ready after ${attemptNumber} attempts`);
				return true;
			}
		}
		catch
		{
			// Connection refused - API not ready yet
		}

		console.log(`  Attempt ${attemptNumber}/${MAX_POLL_ATTEMPTS}...`);
		await new Promise(
			(resolve) => setTimeout(resolve, POLL_DELAY_MS));
	}

	console.error("[FAIL] OpenAPI endpoint failed to respond within timeout");
	return false;
}

/**
 * Fetches the OpenAPI spec and saves it to the root directory.
 * @returns {Promise<boolean>}
 * True if spec was fetched and saved successfully.
 */
async function fetchAndSaveSpec()
{
	console.log(`\nFetching OpenAPI spec from ${API_OPENAPI_URL}...`);

	try
	{
		const response =
			await fetch(API_OPENAPI_URL, { dispatcher: DEV_HTTPS_AGENT });

		if (!response.ok)
		{
			console.error(`[FAIL] API returned status ${response.status}`);
			return false;
		}

		const specText =
			await response.text();

		// Parse and re-stringify with formatting
		const specObject =
			JSON.parse(specText);

		const formattedSpec =
			JSON.stringify(specObject, null, "\t");

		writeFileSync(OPENAPI_JSON_PATH, formattedSpec + "\n");
		console.log(`[OK] Saved OpenAPI spec to ${OPENAPI_JSON_PATH}`);
		return true;
	}
	catch (error)
	{
		console.error(`[FAIL] Failed to fetch/save spec: ${error.message}`);
		return false;
	}
}

/**
 * Generates TypeScript types from the OpenAPI spec.
 * @returns {number}
 * Exit code (0 for success).
 */
function generateTypes()
{
	if (!existsSync(OPENAPI_JSON_PATH))
	{
		console.error(`[FAIL] OpenAPI spec not found at ${OPENAPI_JSON_PATH}`);
		return 1;
	}

	return runCommandSync(
		"npx openapi-typescript ../openapi.json -o src/app/shared/generated-open-api/generated-open-api.ts",
		"Generating TypeScript types",
		CLIENT_DIR);
}

/**
 * Main entry point for the script.
 */
async function main()
{
	console.log("========================================");
	console.log("  OpenAPI Type Generation Script");
	console.log("========================================\n");

	// Check if API is already running
	const apiAlreadyRunning =
		await isApiRunning();

	let solutionProcess = null;

	if (apiAlreadyRunning)
	{
		console.log("[INFO] API is already running, skipping startup");
	}
	else
	{
		console.log("[INFO] Starting the solution via npm run start...");
		console.log("[INFO] This will launch Docker containers and the Angular client\n");

		// Start the solution in background
		solutionProcess =
			spawn(
				"npm",
				["run", "start"],
				{
					cwd: ROOT_DIR,
					stdio: "pipe",
					shell: true,
					detached: false
				});

		// Give a moment for processes to spin up
		await new Promise(
			(resolve) => setTimeout(resolve, 3000));
	}

	try
	{
		// Wait for OpenAPI endpoint
		const openApiReady =
			await waitForOpenApi();

		if (!openApiReady)
		{
			console.error("\n[FAIL] Could not connect to API OpenAPI endpoint");
			console.error("Make sure the API is running and accessible at:");
			console.error(`  ${API_OPENAPI_URL}`);
			process.exitCode = 1;
			return;
		}

		// Fetch and save the spec
		const specSaved =
			await fetchAndSaveSpec();

		if (!specSaved)
		{
			process.exitCode = 1;
			return;
		}

		// Generate TypeScript types
		const generateCode =
			generateTypes();

		if (generateCode !== 0)
		{
			console.error("\n[FAIL] TypeScript generation failed");
			process.exitCode = generateCode;
			return;
		}

		console.log("\n========================================");
		console.log("  OpenAPI Generation Complete!");
		console.log("========================================");
		console.log("Generated files:");
		console.log("  - openapi.json (root)");
		console.log("  - src/app/shared/generated-open-api/generated-open-api.ts");
		console.log("\nNext steps:");
		console.log("  1. Update src/app/shared/models/generated-open-api.model.ts");
		console.log("  2. Run: npm run lint (to fix formatting)");
		console.log("========================================\n");

		process.exitCode = 0;
	}
	finally
	{
		if (solutionProcess)
		{
			console.log("\n[INFO] Note: The solution is still running in the background.");
			console.log("[INFO] To stop it, run: npm run stop");
		}
	}
}

main();
