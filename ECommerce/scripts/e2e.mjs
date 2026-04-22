#!/usr/bin/env node
/**
 * @file Unified commerce E2E runner for SvelteKit and TanStack apps.
 *
 * Replaces the two near-identical per-app `scripts/e2e.mjs` files. Called as:
 *   node ECommerce/scripts/e2e.mjs --app <sveltekit|tanstack> [--keepalive] [--] [extra playwright args]
 *
 * Differences between apps are driven entirely by the `APPS` config map: label, app directory,
 * and health URL. Playwright itself is always invoked from the target app directory so that each
 * app's `playwright.config.ts` is honored.
 *
 * @module ECommerce/scripts/e2e
 */
import { execSync, spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const eCommerceDir = resolve(__dirname, "..");

const COMPOSE_FILE = "docker-compose.e2e.yml";
const HEALTH_RETRIES = 30;
const HEALTH_INTERVAL_MS = 2000;

/**
 * Per-app E2E configuration.
 *
 * @typedef {object} CommerceE2EConfig
 * @property {string} label     Human-readable app label for banners.
 * @property {string} directory Absolute path to the app's root folder (playwright cwd).
 * @property {string} healthUrl URL polled until it returns an OK response.
 */

/** @type {Record<string, CommerceE2EConfig>} */
const APPS = {
	sveltekit: {
		label: "SeventySixCommerce (SvelteKit)",
		directory: resolve(eCommerceDir, "seventysixcommerce-sveltekit"),
		healthUrl: "http://localhost:3011/healthz",
	},
	tanstack: {
		label: "SeventySixCommerce (TanStack Start)",
		directory: resolve(eCommerceDir, "seventysixcommerce-tanstack"),
		healthUrl: "http://localhost:3012/api/healthz",
	},
};

/**
 * Parse CLI arguments. Arguments after `--` pass through to Playwright.
 *
 * @param {string[]} argv - argv without `node` and script path.
 * @returns {{ app: string | null, keepalive: boolean, playwrightArgs: string[] }}
 */
export function parseArgs(argv) {
	/** @type {{ app: string | null, keepalive: boolean, playwrightArgs: string[] }} */
	const out = { app: null, keepalive: false, playwrightArgs: [] };
	let passThrough = false;
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (passThrough) {
			out.playwrightArgs.push(arg);
			continue;
		}
		switch (arg) {
			case "--app":
				out.app = argv[++i] ?? null;
				break;
			case "--keepalive":
				out.keepalive = true;
				break;
			case "--":
				passThrough = true;
				break;
			default:
				// Unknown flags pass through to Playwright to keep backwards compatibility
				// with scripts that forwarded extra args without a `--` delimiter.
				out.playwrightArgs.push(arg);
				break;
		}
	}
	return out;
}

/**
 * Look up a {@link CommerceE2EConfig} for the given app id.
 *
 * @param {string | null} app
 * @returns {CommerceE2EConfig}
 */
export function resolveConfig(app) {
	if (!app) {
		throw new Error("Missing required --app <sveltekit|tanstack>");
	}
	const config = APPS[app];
	if (!config) {
		throw new Error(`Invalid --app "${app}". Expected one of: ${Object.keys(APPS).join(", ")}`);
	}
	return config;
}

/**
 * Runs a shell command synchronously, streaming output.
 *
 * @param {string} cmd
 * @returns {void}
 */
function run(cmd) {
	execSync(cmd, { stdio: "inherit" });
}

/**
 * Polls `healthUrl` until it responds OK or retries are exhausted.
 *
 * @param {string} healthUrl
 * @returns {Promise<void>}
 */
async function waitForHealth(healthUrl) {
	for (let attempt = 1; attempt <= HEALTH_RETRIES; attempt++) {
		try {
			const res = await fetch(healthUrl);
			if (res.ok) {
				console.log(`App healthy after ${attempt} attempt(s).`);
				return;
			}
		}
		catch {
			// App not ready yet
		}
		console.log(`Waiting for app... (${attempt}/${HEALTH_RETRIES})`);
		await new Promise((resolvePromise) => setTimeout(resolvePromise, HEALTH_INTERVAL_MS));
	}
	throw new Error(`App did not become healthy at ${healthUrl}`);
}

/**
 * Main entrypoint. Returns a process exit code.
 *
 * @param {string[]} argv
 * @returns {Promise<number>}
 */
export async function main(argv) {
	/** @type {ReturnType<typeof parseArgs>} */
	let opts;
	try {
		opts = parseArgs(argv);
	}
	catch (error) {
		console.error(`ERROR: ${/** @type {Error} */ (error).message}`);
		return 2;
	}
	/** @type {CommerceE2EConfig} */
	let config;
	try {
		config = resolveConfig(opts.app);
	}
	catch (error) {
		console.error(`ERROR: ${/** @type {Error} */ (error).message}`);
		return 2;
	}

	try {
		console.log(`Starting ${config.label} E2E Docker environment...`);
		run(`docker compose -f ${COMPOSE_FILE} up -d --build`);

		await waitForHealth(config.healthUrl);

		console.log("Running Playwright tests...");
		const result = spawnSync(
			"npx",
			["playwright", "test", ...opts.playwrightArgs],
			{ stdio: "inherit", cwd: config.directory, shell: process.platform === "win32" },
		);

		if (!opts.keepalive) {
			console.log("Tearing down E2E Docker environment...");
			run(`docker compose -f ${COMPOSE_FILE} down -v --remove-orphans`);
		}
		else {
			console.log("--keepalive: environment left running.");
			console.log(`Tear down manually: docker compose -f ${COMPOSE_FILE} down -v --remove-orphans`);
		}

		return result.status ?? 0;
	}
	catch (error) {
		console.error("E2E run failed:", /** @type {Error} */ (error).message);
		if (!opts.keepalive) {
			try {
				run(`docker compose -f ${COMPOSE_FILE} down -v --remove-orphans`);
			}
			catch {
				// Best-effort teardown
			}
		}
		return 1;
	}
}

/**
 * Exported for tests — the app id → config map.
 *
 * @returns {Record<string, CommerceE2EConfig>}
 */
export function getAppConfigs() {
	return APPS;
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
	main(process.argv.slice(2)).then((code) => process.exit(code));
}
