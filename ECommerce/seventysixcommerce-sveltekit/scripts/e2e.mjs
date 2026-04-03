/**
 * E2E test runner for SeventySixCommerce SvelteKit.
 * Starts isolated Docker environment, runs Playwright tests, and tears down.
 */
import { execSync, spawnSync } from "child_process";

const COMPOSE_FILE = "docker-compose.e2e.yml";
const HEALTH_URL = "http://localhost:3011/healthz";
const HEALTH_RETRIES = 30;
const HEALTH_INTERVAL_MS = 2000;

/**
 * Executes a shell command synchronously with visible output.
 * @param {string} cmd - Command to run.
 */
function run(cmd)
{
	execSync(cmd, { stdio: "inherit" });
}

/**
 * Polls the health endpoint until the app is ready.
 * @returns {Promise<void>} Resolves when healthy, rejects after max retries.
 */
async function waitForHealth()
{
	for (let attempt = 1; attempt <= HEALTH_RETRIES; attempt++)
	{
		try
		{
			const res = await fetch(HEALTH_URL);
			if (res.ok)
			{
				console.log(`App healthy after ${attempt} attempt(s).`);
				return;
			}
		}
		catch
		{
			// App not ready yet
		}
		console.log(`Waiting for app... (${attempt}/${HEALTH_RETRIES})`);
		await new Promise((resolve) => setTimeout(resolve, HEALTH_INTERVAL_MS));
	}
	throw new Error(`App did not become healthy at ${HEALTH_URL}`);
}

const keepalive = process.argv.includes("--keepalive");
const extraArgs = process.argv.slice(2).filter((a) => a !== "--keepalive");

try
{
	console.log("Starting E2E Docker environment...");
	run(`docker compose -f ${COMPOSE_FILE} up -d --build`);

	await waitForHealth();

	console.log("Running Playwright tests...");
	const result = spawnSync(
		"npx",
		["playwright", "test", ...extraArgs],
		{ stdio: "inherit" }
	);

	if (!keepalive)
	{
		console.log("Tearing down E2E Docker environment...");
		run(`docker compose -f ${COMPOSE_FILE} down -v --remove-orphans`);
	}
	else
	{
		console.log("--keepalive: environment left running.");
		console.log(`Tear down manually: docker compose -f ${COMPOSE_FILE} down -v --remove-orphans`);
	}

	process.exit(result.status ?? 0);
}
catch (err)
{
	console.error("E2E run failed:", err.message);
	if (!keepalive)
	{
		run(`docker compose -f ${COMPOSE_FILE} down -v --remove-orphans`);
	}
	process.exit(1);
}
