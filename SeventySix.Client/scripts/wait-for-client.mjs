// <copyright file="wait-for-client.mjs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * Waits for the E2E Angular client to be healthy before running tests.
 * Polls the root URL until ready or timeout.
 *
 * NOTE: This script expects NODE_EXTRA_CA_CERTS to be set to the certificate path
 * for proper SSL validation. This is set by e2e-full.mjs.
 */

// Use HTTPS on port 4201 for E2E client (isolated from dev port 4200)
const CLIENT_URL = "https://localhost:4201";
const MAX_POLL_ATTEMPTS = 30;
const POLL_DELAY_MS = 2000;

async function waitForClient()
{
	console.log("Waiting for Angular client to be ready...");

	for (let attemptNumber = 1; attemptNumber <= MAX_POLL_ATTEMPTS; attemptNumber++)
	{
		try
		{
			const response =
				await fetch(CLIENT_URL);

			if (response.ok)
			{
				console.log(`[OK] Angular client is ready after ${attemptNumber} attempts`);
				return 0;
			}
		}
		catch
		{
			// Connection refused - client not ready yet
		}

		console.log(`  Attempt ${attemptNumber}/${MAX_POLL_ATTEMPTS}...`);
		await new Promise(
			(resolve) => setTimeout(resolve, POLL_DELAY_MS));
	}

	console.error("[FAIL] Angular client failed to start within timeout");
	return 1;
}

waitForClient().then(
	(code) =>
	{
		process.exitCode = code;
	});
