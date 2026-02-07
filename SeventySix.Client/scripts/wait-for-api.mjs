// <copyright file="wait-for-api.mjs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Waits for the E2E API to be healthy before running tests.
 * Polls the health endpoint until ready or timeout.
 *
 * NOTE: This script expects NODE_EXTRA_CA_CERTS to be set to the certificate path
 * for proper SSL validation. This is set by e2e-full.mjs.
 */

// Use HTTPS on port 7174 for E2E API (isolated from dev HTTPS port 7074)
const API_HEALTH_URL = "https://localhost:7174/health";
const MAX_POLL_ATTEMPTS = 30;
const POLL_DELAY_MS = 2000;

async function waitForApi()
{
	console.log("Waiting for API to be ready...");

	for (let attemptNumber = 1; attemptNumber <= MAX_POLL_ATTEMPTS; attemptNumber++)
	{
		try
		{
			const response =
				await fetch(API_HEALTH_URL);

			if (response.ok)
			{
				console.log(`[OK] API is ready after ${attemptNumber} attempts`);
				return 0;
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

	console.error("[FAIL] API failed to start within timeout");
	return 1;
}

waitForApi().then(
	(code) =>
	{
		process.exitCode = code;
	});
