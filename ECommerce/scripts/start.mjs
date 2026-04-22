#!/usr/bin/env node
/**
 * @file Unified commerce dev startup for SvelteKit and TanStack apps.
 *
 * Replaces the two near-identical per-app `scripts/start.mjs` files. Called as:
 *   node ECommerce/scripts/start.mjs --app <sveltekit|tanstack> [--skip-seed]
 *
 * Differences between apps (driven entirely by the `APPS` config map):
 *   - Banner text
 *   - Commerce-secrets env prefix (`Sveltekit` vs `Tanstack`)
 *   - Drizzle migrations / seed script path
 *   - Dev-server port
 *
 * @module ECommerce/scripts/start
 */
import { execSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { applyCommerceSecrets } from "../../scripts/load-commerce-secrets.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const eCommerceDir = resolve(__dirname, "..");
const repoRoot = resolve(eCommerceDir, "..");
const sharedCertificatePath = resolve(repoRoot, "SeventySix.Client", "ssl", "dev-certificate.crt");
const sharedPrivateKeyPath = resolve(repoRoot, "SeventySix.Client", "ssl", "dev-certificate.key");

/**
 * Per-app startup configuration.
 *
 * @typedef {object} CommerceAppConfig
 * @property {string} label            Human-readable app label for banners.
 * @property {string} directory        Absolute path to the app's root folder.
 * @property {string} secretsPrefix    Value passed to {@link applyCommerceSecrets}.
 * @property {string} migrationsDir    Absolute path to the drizzle migrations folder.
 * @property {string} seedCommand      `npx tsx …` command invoked for seeding.
 * @property {string} port             Dev-server port used in the startup banner.
 */

/** @type {Record<string, CommerceAppConfig>} */
const APPS = {
	sveltekit: {
		label: "SeventySixCommerce (SvelteKit)",
		directory: resolve(eCommerceDir, "seventysixcommerce-sveltekit"),
		secretsPrefix: "Sveltekit",
		migrationsDir: resolve(eCommerceDir, "seventysixcommerce-sveltekit", "src/lib/server/db/migrations"),
		seedCommand: "npx tsx src/lib/server/db/seed.ts",
		port: "3001",
	},
	tanstack: {
		label: "SeventySixCommerce (TanStack Start)",
		directory: resolve(eCommerceDir, "seventysixcommerce-tanstack"),
		secretsPrefix: "Tanstack",
		migrationsDir: resolve(eCommerceDir, "seventysixcommerce-tanstack", "src/server/db/migrations"),
		seedCommand: "npx tsx src/server/db/seed.ts",
		port: "3002",
	},
};

/**
 * Parse `--app` / `--skip-seed` flags from the given argv slice.
 *
 * @param {string[]} argv - argv without `node` and script path.
 * @returns {{ app: string | null, skipSeed: boolean }}
 */
export function parseArgs(argv) {
	/** @type {{ app: string | null, skipSeed: boolean }} */
	const out = { app: null, skipSeed: false };
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === "--app") {
			out.app = argv[++i] ?? null;
		}
		else if (arg === "--skip-seed") {
			out.skipSeed = true;
		}
		else {
			throw new Error(`Unknown argument: ${arg}`);
		}
	}
	return out;
}

/**
 * Look up a {@link CommerceAppConfig} for the given app id.
 *
 * @param {string | null} app
 * @returns {CommerceAppConfig}
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
 * Runs a shell command synchronously, streaming output, from the given cwd.
 *
 * @param {string} cmd
 * @param {string} cwd
 * @returns {void}
 */
function run(cmd, cwd) {
	console.log(`\n> ${cmd}`);
	execSync(cmd, { cwd, stdio: "inherit" });
}

/**
 * Returns true when `docker info` succeeds.
 *
 * @returns {boolean}
 */
function isDockerRunning() {
	try {
		execSync("docker info", { stdio: "ignore" });
		return true;
	}
	catch {
		return false;
	}
}

/**
 * Waits up to 60s for the Docker daemon. On Windows, attempts to launch Docker Desktop.
 *
 * @returns {Promise<void>}
 */
async function ensureDocker() {
	if (isDockerRunning()) {
		return;
	}
	console.log("Docker is not running.");
	if (process.platform === "win32") {
		const dockerDesktopPath = "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe";
		if (existsSync(dockerDesktopPath)) {
			console.log("Starting Docker Desktop...");
			spawn(dockerDesktopPath, [], { detached: true, stdio: "ignore" }).unref();
		}
	}
	const maxAttempts = 12;
	for (let i = 1; i <= maxAttempts; i++) {
		console.log(`  Waiting for Docker daemon... (attempt ${i}/${maxAttempts})`);
		await new Promise((r) => setTimeout(r, 5000));
		if (isDockerRunning()) {
			console.log("Docker is ready.");
			return;
		}
	}
	throw new Error(
		"Docker daemon did not start within 60 seconds. Please start Docker Desktop manually and try again.",
	);
}

/**
 * Regenerates the shared dev SSL certificate if either file is missing.
 *
 * @returns {void}
 */
function ensureSslCertificate() {
	if (existsSync(sharedCertificatePath) && existsSync(sharedPrivateKeyPath)) {
		return;
	}
	console.log("Shared SSL certificate not found. Generating...");
	execSync("node scripts/run-pwsh.mjs -File scripts/generate-dev-ssl-cert.ps1", {
		cwd: repoRoot,
		stdio: "inherit",
	});
	if (!existsSync(sharedCertificatePath) || !existsSync(sharedPrivateKeyPath)) {
		throw new Error("Failed to generate shared SSL certificate.");
	}
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
	/** @type {CommerceAppConfig} */
	let config;
	try {
		config = resolveConfig(opts.app);
	}
	catch (error) {
		console.error(`ERROR: ${/** @type {Error} */ (error).message}`);
		return 2;
	}

	console.log(`\n=== Starting ${config.label} ===\n`);

	ensureSslCertificate();
	applyCommerceSecrets(config.secretsPrefix);
	await ensureDocker();

	if (!existsSync(resolve(config.directory, "node_modules"))) {
		console.log("Installing dependencies...");
		run("npm ci", config.directory);
	}

	console.log("Starting PostgreSQL...");
	run("docker compose -f docker-compose.dev.yml up -d --wait", config.directory);

	const hasMigrations = existsSync(config.migrationsDir)
		&& (await readdir(config.migrationsDir)).filter((f) => f.endsWith(".sql")).length > 0;
	if (!hasMigrations) {
		console.log("Generating database migrations...");
		run("npx drizzle-kit generate", config.directory);
	}
	console.log("Running database migrations...");
	run("npx drizzle-kit migrate", config.directory);

	if (!opts.skipSeed) {
		console.log("Seeding database...");
		try {
			run(config.seedCommand, config.directory);
		}
		catch {
			console.log("Seed skipped (may already be seeded)");
		}
	}

	console.log(`\nStarting dev server at https://localhost:${config.port} ...\n`);
	const dev = spawn("npm run dev", {
		cwd: config.directory,
		stdio: "inherit",
		shell: true,
	});

	return await new Promise((resolvePromise) => {
		dev.on("exit", (code) => resolvePromise(code ?? 0));
	});
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
	main(process.argv.slice(2)).then((code) => process.exit(code));
}
