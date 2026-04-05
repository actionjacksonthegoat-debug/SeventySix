#!/usr/bin/env node
/**
 * One-command development startup for SeventySixCommerce SvelteKit.
 * Ensures Docker is running, starts PostgreSQL, runs migrations, seeds the database,
 * and starts the dev server.
 */
import { execSync, spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { applyCommerceSecrets } from "../../../scripts/load-commerce-secrets.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const stackDir = resolve(__dirname, "..");
const repoRoot = resolve(stackDir, "..", "..");
const sharedCertificatePath = resolve(repoRoot, "SeventySix.Client", "ssl", "dev-certificate.crt");
const sharedPrivateKeyPath = resolve(repoRoot, "SeventySix.Client", "ssl", "dev-certificate.key");

/** Runs a command synchronously and prints output. */
function run(cmd, options = {})
{
	console.log(`\n> ${cmd}`);
	execSync(cmd, { cwd: stackDir, stdio: "inherit", ...options });
}

/**
 * Checks if Docker daemon is responsive. Returns true if `docker info` succeeds.
 */
function isDockerRunning()
{
	try
	{
		execSync("docker info", { stdio: "ignore" });
		return true;
	}
	catch
	{
		return false;
	}
}

/**
 * Ensures Docker is running. On Windows, starts Docker Desktop if needed.
 * Waits up to 60 seconds for the daemon to respond.
 */
async function ensureDocker()
{
	if (isDockerRunning()) return;

	console.log("Docker is not running.");

	// On Windows, try to start Docker Desktop
	if (process.platform === "win32")
	{
		const dockerDesktopPath = "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe";
		if (existsSync(dockerDesktopPath))
		{
			console.log("Starting Docker Desktop...");
			spawn(dockerDesktopPath, [], { detached: true, stdio: "ignore" }).unref();
		}
	}

	// Wait for Docker daemon to be ready (up to 60s)
	const maxAttempts = 12;
	for (let i = 1; i <= maxAttempts; i++)
	{
		console.log(`  Waiting for Docker daemon... (attempt ${i}/${maxAttempts})`);
		await new Promise((r) => setTimeout(r, 5000));
		if (isDockerRunning())
		{
			console.log("Docker is ready.");
			return;
		}
	}

	throw new Error(
		"Docker daemon did not start within 60 seconds. Please start Docker Desktop manually and try again."
	);
}

/**
 * Ensures the shared repository development SSL certificate exists.
 * This keeps TanStack and SvelteKit aligned with the main SeventySix dev certificate.
 */
function ensureSslCertificate()
{
	if (existsSync(sharedCertificatePath) && existsSync(sharedPrivateKeyPath))
	{
		return;
	}

	console.log("Shared SSL certificate not found. Generating...");
	execSync("node scripts/run-pwsh.mjs -File scripts/generate-dev-ssl-cert.ps1", {
		cwd: repoRoot,
		stdio: "inherit"
	});

	if (!existsSync(sharedCertificatePath) || !existsSync(sharedPrivateKeyPath))
	{
		throw new Error("Failed to generate shared SSL certificate.");
	}
}

async function main()
{
	console.log("\n=== Starting SeventySixCommerce (SvelteKit) ===\n");

	// 0. Ensure shared development SSL certificate is available
	ensureSslCertificate();

	// 0b. Load commerce secrets from .NET user-secrets into process.env
	applyCommerceSecrets("Sveltekit");

	// 1. Ensure Docker is running
	await ensureDocker();

	// 2. Install dependencies if needed
	if (!existsSync(resolve(stackDir, "node_modules")))
	{
		console.log("Installing dependencies...");
		run("npm ci");
	}

	// 3. Start PostgreSQL
	console.log("Starting PostgreSQL...");
	run("docker compose -f docker-compose.dev.yml up -d --wait");

	// 4. Generate migrations if none exist, then apply
	const migrationsDir = resolve(stackDir, "src/lib/server/db/migrations");
	if (
		!existsSync(migrationsDir) || (await import("node:fs/promises").then((fs) => fs.readdir(migrationsDir)))
				.filter((f) => f.endsWith(".sql"))
				.length === 0
	)
	{
		console.log("Generating database migrations...");
		run("npx drizzle-kit generate");
	}
	console.log("Running database migrations...");
	run("npx drizzle-kit migrate");

	// 5. Seed database
	if (!process.argv.includes("--skip-seed"))
	{
		console.log("Seeding database...");
		try
		{
			run("npx tsx src/lib/server/db/seed.ts");
		}
		catch
		{
			console.log("Seed skipped (may already be seeded)");
		}
	}

	// 6. Start dev server
	console.log("\nStarting dev server at https://localhost:3001 ...\n");
	const dev = spawn("npm run dev", {
		cwd: stackDir,
		stdio: "inherit",
		shell: true
	});

	dev.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((error) =>
{
	console.error("Startup failed:", error);
	process.exit(1);
});
