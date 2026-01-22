// <copyright file="wait-for-api.mjs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Waits for the E2E API to be healthy before running tests.
 * Polls the health endpoint until ready or timeout.
 */

const API_HEALTH_URL = "http://localhost:5086/health";
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
				console.log(`✓ API is ready after ${attemptNumber} attempts`);
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

	console.error("✗ API failed to start within timeout");
	return 1;
}

waitForApi().then(
	(code) =>
	{
		process.exitCode = code;
	});
