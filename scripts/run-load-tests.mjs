#!/usr/bin/env node
/**
 * @file Unified k6 load-test orchestrator for Main (Angular+API), SvelteKit, and TanStack apps.
 *
 * Replaces the three duplicate `run-load-tests.ps1` / `run-load-tests.sh` scripts under each
 * app's `load-testing/scripts/` folder. Cross-platform (Windows / Linux / macOS) — Node-only.
 *
 * Usage:
 *   node scripts/run-load-tests.mjs --app <main|sveltekit|tanstack> [options]
 *
 * Options:
 *   --app <id>          Required. One of: main, sveltekit, tanstack.
 *   --profile <name>    k6 profile: quick | smoke | load | stress. Default: smoke.
 *   --scenario <path>   Optional single scenario path (relative to load-testing/, e.g. "auth/login").
 *   --keep-running      Do not stop the docker-compose stack after the run.
 *   --help              Print usage and exit.
 *
 * Emits a machine-readable summary to `.dev-tools-output/loadtest-summary.json` for
 * downstream CI consumption (e.g. PR-comment steps).
 *
 * @module run-load-tests
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

/**
 * Per-app configuration map.
 *
 * @typedef {object} AppConfig
 * @property {string}  loadTestRoot  Absolute path to the app's `load-testing/` directory.
 * @property {string}  compose       docker-compose filename at repo root to use.
 * @property {string}  healthUrl     URL polled until it returns HTTP 200.
 * @property {string}  banner        Banner label printed at start.
 * @property {boolean} needsSslCert  When true, ensure `scripts/generate-dev-ssl-cert.ps1` has run.
 * @property {boolean} insecureTls   When true, skip TLS verification during health checks.
 *
 * @type {Record<string, AppConfig>}
 */
const APPS = {
	main: {
		loadTestRoot: join(repoRoot, "SeventySix.Client", "load-testing"),
		compose: "docker-compose.loadtest.yml",
		healthUrl: "https://localhost:7175/health",
		banner: "SeventySix Load Tests",
		needsSslCert: true,
		insecureTls: true,
	},
	sveltekit: {
		loadTestRoot: join(repoRoot, "ECommerce", "seventysixcommerce-sveltekit", "load-testing"),
		compose: "docker-compose.loadtest-svelte.yml",
		healthUrl: "http://localhost:3021/healthz",
		banner: "SvelteKit Load Tests",
		needsSslCert: false,
		insecureTls: false,
	},
	tanstack: {
		loadTestRoot: join(repoRoot, "ECommerce", "seventysixcommerce-tanstack", "load-testing"),
		compose: "docker-compose.loadtest-tanstack.yml",
		healthUrl: "http://localhost:3022/api/healthz",
		banner: "TanStack Load Tests",
		needsSslCert: false,
		insecureTls: false,
	},
};

/** Valid k6 profiles. @type {readonly string[]} */
const VALID_PROFILES = Object.freeze(["quick", "smoke", "load", "stress"]);

/**
 * Parse process CLI args into a typed option object.
 *
 * @param {string[]} argv - Raw argv slice (without `node` and script path).
 * @returns {{ app: string | null, profile: string, scenario: string | null, keepRunning: boolean, help: boolean }}
 */
export function parseArgs(argv) {
	/** @type {{ app: string | null, profile: string, scenario: string | null, keepRunning: boolean, help: boolean }} */
	const out = { app: null, profile: "smoke", scenario: null, keepRunning: false, help: false };
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		switch (arg) {
			case "--app":
				out.app = argv[++i] ?? null;
				break;
			case "--profile":
				out.profile = argv[++i] ?? "smoke";
				break;
			case "--scenario":
				out.scenario = argv[++i] ?? null;
				break;
			case "--keep-running":
				out.keepRunning = true;
				break;
			case "--help":
			case "-h":
				out.help = true;
				break;
			default:
				throw new Error(`Unknown argument: ${arg}`);
		}
	}
	return out;
}

/**
 * Resolve a parsed options object into a concrete {@link AppConfig}. Throws on invalid input.
 *
 * @param {ReturnType<typeof parseArgs>} opts
 * @returns {AppConfig}
 */
export function resolveAppConfig(opts) {
	if (!opts.app) {
		throw new Error("Missing required --app <main|sveltekit|tanstack>");
	}
	const config = APPS[opts.app];
	if (!config) {
		throw new Error(
			`Invalid --app "${opts.app}". Expected one of: ${Object.keys(APPS).join(", ")}`,
		);
	}
	if (!VALID_PROFILES.includes(opts.profile)) {
		throw new Error(
			`Invalid --profile "${opts.profile}". Expected one of: ${VALID_PROFILES.join(", ")}`,
		);
	}
	return config;
}

/**
 * Return true if `k6` is on PATH.
 *
 * @returns {boolean}
 */
function isK6Installed() {
	const probe = spawnSync("k6", ["version"], { stdio: "ignore", shell: process.platform === "win32" });
	return probe.status === 0;
}

/**
 * Recursively delete all entries in `dir` except `.gitkeep`. Missing dirs are ignored.
 *
 * @param {string} dir
 * @returns {void}
 */
function cleanDirExceptGitkeep(dir) {
	if (!existsSync(dir)) {
		return;
	}
	for (const entry of readdirSync(dir)) {
		if (entry === ".gitkeep") {
			continue;
		}
		rmSync(join(dir, entry), { recursive: true, force: true });
	}
}

/**
 * Run an external command, inheriting stdio. Resolves with the exit code (never rejects).
 *
 * @param {string} command
 * @param {string[]} args
 * @param {{ cwd?: string, env?: Record<string, string | undefined> }} [options]
 * @returns {Promise<number>}
 */
function runCommand(command, args, options = {}) {
	return new Promise((resolvePromise) => {
		const child = spawn(command, args, {
			cwd: options.cwd ?? repoRoot,
			env: { ...process.env, ...(options.env ?? {}) },
			stdio: "inherit",
			shell: process.platform === "win32",
		});
		child.on("exit", (code) => resolvePromise(code ?? 1));
		child.on("error", (error) => {
			console.error(`ERROR: Failed to launch ${command}: ${error.message}`);
			resolvePromise(1);
		});
	});
}

/**
 * Issue an HTTP(S) HEAD/GET and resolve with the numeric status code, or 0 on error.
 *
 * @param {string} url
 * @param {boolean} insecureTls
 * @returns {Promise<number>}
 */
function checkHealthOnce(url, insecureTls) {
	return new Promise((resolvePromise) => {
		const isHttps = url.startsWith("https:");
		const request = isHttps ? httpsRequest : httpRequest;
		/** @type {import("node:http").RequestOptions} */
		const options = { method: "GET", timeout: 5000 };
		if (isHttps && insecureTls) {
			/** @type {any} */ (options).rejectUnauthorized = false;
		}
		const req = request(url, options, (res) => {
			res.resume();
			resolvePromise(res.statusCode ?? 0);
		});
		req.on("error", () => resolvePromise(0));
		req.on("timeout", () => {
			req.destroy();
			resolvePromise(0);
		});
		req.end();
	});
}

/**
 * Poll an endpoint until it returns HTTP 200 or attempts are exhausted.
 *
 * @param {string} url
 * @param {boolean} insecureTls
 * @param {number} [maxAttempts=60]
 * @param {number} [delayMs=5000]
 * @returns {Promise<boolean>}
 */
async function waitForHealth(url, insecureTls, maxAttempts = 60, delayMs = 5000) {
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		const status = await checkHealthOnce(url, insecureTls);
		if (status === 200) {
			console.log(`Service is healthy (HTTP 200).`);
			return true;
		}
		console.log(`  Attempt ${attempt}/${maxAttempts} - not ready (HTTP ${status || "timeout"})...`);
		if (attempt < maxAttempts) {
			await new Promise((r) => setTimeout(r, delayMs));
		}
	}
	return false;
}

/**
 * Collect every `*.test.js` file under the given scenarios directory (recursive).
 *
 * @param {string} scenariosDir
 * @returns {string[]} Absolute paths.
 */
function findScenarioFiles(scenariosDir) {
	if (!existsSync(scenariosDir)) {
		return [];
	}
	/** @type {string[]} */
	const results = [];
	/** @param {string} d */
	function walk(d) {
		for (const entry of readdirSync(d)) {
			const full = join(d, entry);
			const st = statSync(full);
			if (st.isDirectory()) {
				walk(full);
			}
			else if (st.isFile() && entry.endsWith(".test.js")) {
				results.push(full);
			}
		}
	}
	walk(scenariosDir);
	return results.sort();
}

/**
 * Invoke k6 for a single scenario file. Resolves with the exit code.
 *
 * @param {string} scenarioPath    Path relative to `loadTestRoot`.
 * @param {string} profile
 * @param {string} loadTestRoot
 * @param {Record<string, string | undefined>} env
 * @returns {Promise<number>}
 */
async function runK6Scenario(scenarioPath, profile, loadTestRoot, env) {
	return runCommand("k6", ["run", "-q", "--env", `PROFILE=${profile}`, scenarioPath], {
		cwd: loadTestRoot,
		env,
	});
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
		printUsage();
		return 2;
	}
	if (opts.help) {
		printUsage();
		return 0;
	}
	/** @type {AppConfig} */
	let config;
	try {
		config = resolveAppConfig(opts);
	}
	catch (error) {
		console.error(`ERROR: ${/** @type {Error} */ (error).message}`);
		printUsage();
		return 2;
	}

	console.log("");
	console.log("========================================");
	console.log(`  ${config.banner} (${opts.profile})`);
	console.log("========================================");
	console.log("");

	// 1. k6 check
	if (!isK6Installed()) {
		console.error("ERROR: k6 is not installed. See https://grafana.com/docs/k6/latest/set-up/install-k6/");
		return 1;
	}

	// 2. Clean results/reports
	console.log("Cleaning previous results...");
	cleanDirExceptGitkeep(join(config.loadTestRoot, "results"));
	cleanDirExceptGitkeep(join(config.loadTestRoot, "reports"));

	// 3. SSL cert (main app only)
	if (config.needsSslCert) {
		const certPath = join(config.loadTestRoot, "..", "ssl", "dev-certificate.crt");
		if (!existsSync(certPath)) {
			console.log("SSL certificate not found. Generating...");
			const certScript = join(repoRoot, "scripts", "generate-dev-ssl-cert.ps1");
			if (existsSync(certScript)) {
				const certCode = await runCommand(
					"node",
					["scripts/run-pwsh.mjs", "-File", "scripts/generate-dev-ssl-cert.ps1"],
				);
				if (certCode !== 0) {
					console.error("ERROR: SSL certificate generation failed.");
					return certCode;
				}
			}
			else {
				console.warn("WARNING: Could not find SSL cert generation script.");
			}
		}
	}

	// 4. Start docker-compose stack
	console.log("");
	console.log(`Starting load test environment (${config.compose})...`);
	const upCode = await runCommand("docker", ["compose", "-f", config.compose, "up", "-d", "--build"]);
	if (upCode !== 0) {
		console.error("ERROR: Failed to start Docker environment.");
		return upCode;
	}

	// 5. Health check
	console.log("");
	console.log(`Waiting for service to become healthy at ${config.healthUrl}...`);
	const healthy = await waitForHealth(config.healthUrl, config.insecureTls);
	if (!healthy) {
		console.error("ERROR: Service failed to become healthy.");
		if (!opts.keepRunning) {
			await runCommand("docker", ["compose", "-f", config.compose, "down"]);
		}
		return 1;
	}

	// 6. Run k6
	console.log("");
	console.log(`Running k6 load tests (profile: ${opts.profile})...`);
	/** @type {Record<string, string>} */
	const k6Env = {
		K6_WEB_DASHBOARD: "false",
		K6_WEB_DASHBOARD_EXPORT: join(config.loadTestRoot, "reports", "dashboard.html"),
	};
	/** @type {{ scenario: string, passed: boolean, exitCode: number }[]} */
	const results = [];
	let overallExitCode = 0;
	if (opts.scenario) {
		let scenarioPath = join("scenarios", `${opts.scenario}.test.js`);
		if (!existsSync(join(config.loadTestRoot, scenarioPath))) {
			scenarioPath = join("scenarios", opts.scenario);
		}
		console.log(`  Running: ${scenarioPath}`);
		const code = await runK6Scenario(scenarioPath, opts.profile, config.loadTestRoot, k6Env);
		results.push({ scenario: scenarioPath, passed: code === 0, exitCode: code });
		if (code !== 0) {
			overallExitCode = 1;
		}
	}
	else {
		const files = findScenarioFiles(join(config.loadTestRoot, "scenarios"));
		for (const file of files) {
			const rel = relative(config.loadTestRoot, file).replace(/\\/g, "/");
			console.log(`  Running: ${rel}`);
			const code = await runK6Scenario(rel, opts.profile, config.loadTestRoot, k6Env);
			const passed = code === 0;
			results.push({ scenario: rel, passed, exitCode: code });
			if (passed) {
				console.log(`  PASSED: ${rel}`);
			}
			else {
				console.log(`  FAILED: ${rel}`);
				overallExitCode = 1;
			}
		}
	}

	// 7. Summary report (per-app)
	console.log("");
	console.log("Generating summary report...");
	const summaryScript = join(config.loadTestRoot, "scripts", "generate-summary.js");
	if (existsSync(summaryScript)) {
		await runCommand("node", [summaryScript]);
	}

	// 8. Machine-readable summary at repo root for downstream CI
	writeMachineSummary({
		app: /** @type {string} */ (opts.app),
		profile: opts.profile,
		scenario: opts.scenario,
		results,
		exitCode: overallExitCode,
	});

	// 9. Tear down (unless --keep-running)
	if (!opts.keepRunning) {
		console.log("");
		console.log("Stopping load test environment...");
		await runCommand("docker", ["compose", "-f", config.compose, "down"]);
	}
	else {
		console.log("");
		console.log("Environment left running (--keep-running).");
		console.log(`Stop manually: docker compose -f ${config.compose} down`);
	}

	console.log("");
	console.log(overallExitCode === 0 ? "All load tests PASSED!" : "Some load tests FAILED.");
	return overallExitCode;
}

/**
 * Write a JSON summary to `.dev-tools-output/loadtest-summary.json` for CI consumption.
 *
 * @param {{ app: string, profile: string, scenario: string | null, results: { scenario: string, passed: boolean, exitCode: number }[], exitCode: number }} summary
 * @returns {void}
 */
function writeMachineSummary(summary) {
	const outDir = join(repoRoot, ".dev-tools-output");
	mkdirSync(outDir, { recursive: true });
	const payload = {
		schemaVersion: 1,
		timestamp: new Date().toISOString(),
		app: summary.app,
		profile: summary.profile,
		scenario: summary.scenario,
		exitCode: summary.exitCode,
		totalScenarios: summary.results.length,
		passedScenarios: summary.results.filter((r) => r.passed).length,
		failedScenarios: summary.results.filter((r) => !r.passed).length,
		results: summary.results,
	};
	writeFileSync(join(outDir, "loadtest-summary.json"), JSON.stringify(payload, null, 2), "utf8");
}

/**
 * Print CLI usage.
 * @returns {void}
 */
function printUsage() {
	console.log("");
	console.log("Usage: node scripts/run-load-tests.mjs --app <main|sveltekit|tanstack> [options]");
	console.log("");
	console.log("Options:");
	console.log("  --app <id>         Required. main | sveltekit | tanstack");
	console.log("  --profile <name>   quick | smoke | load | stress (default: smoke)");
	console.log("  --scenario <path>  Optional single scenario (e.g. auth/login).");
	console.log("  --keep-running     Do not stop the docker stack after the run.");
	console.log("  --help             Print this message.");
	console.log("");
}

/**
 * Exported for tests — the app id → config map.
 * @returns {Record<string, AppConfig>}
 */
export function getAppConfigs() {
	return APPS;
}

// Entrypoint guard: only run when invoked directly, not when imported by tests.
const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
	main(process.argv.slice(2)).then((code) => process.exit(code));
}
