#!/usr/bin/env node
/**
 * Runs all E2E test suites in parallel — Angular, SvelteKit, and TanStack.
 *
 * Each suite uses isolated Docker environments with separate ports, so they
 * can safely run concurrently. Output is prefixed with the suite name for clarity.
 *
 * Usage:
 *   node scripts/run-e2e-all.mjs              Run all suites
 *   node scripts/run-e2e-all.mjs --keepalive   Keep browsers open on failure
 *
 * Exit code is non-zero if ANY suite fails.
 */
import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

const keepalive = process.argv.includes("--keepalive");

/** @type {{ name: string; cwd: string; command: string; args: string[]; color: string }[]} */
const suites = [
	{
		name: "Angular",
		cwd: resolve(repoRoot, "SeventySix.Client"),
		command: "npm",
		args: keepalive ? ["run", "test:e2e:keepalive"] : ["run", "test:e2e"],
		color: "\x1b[36m",
	},
	{
		name: "SvelteKit",
		cwd: resolve(repoRoot, "seventysixcommerce-sveltekit"),
		command: "npm",
		args: ["run", "test:e2e"],
		color: "\x1b[35m",
	},
	{
		name: "TanStack",
		cwd: resolve(repoRoot, "seventysixcommerce-tanstack"),
		command: "npm",
		args: ["run", "test:e2e"],
		color: "\x1b[33m",
	},
];

const RESET = "\x1b[0m";

/**
 * Prefixes each line of output with the suite name and color.
 *
 * @param {string} name - The suite name for the prefix.
 * @param {string} color - ANSI color code.
 * @param {import("node:stream").Readable | null} stream - The readable stream to process.
 * @param {NodeJS.WriteStream} target - The target writable stream (stdout/stderr).
 */
function prefixStream(name, color, stream, target) {
	if (!stream) return;
	const prefix = `${color}[${name}]${RESET} `;
	let buffer = "";
	stream.on("data", (chunk) => {
		buffer += chunk.toString();
		const lines = buffer.split("\n");
		buffer = lines.pop() ?? "";
		for (const line of lines) {
			target.write(`${prefix}${line}\n`);
		}
	});
	stream.on("end", () => {
		if (buffer.length > 0) {
			target.write(`${prefix}${buffer}\n`);
		}
	});
}

console.log("\n=== Running ALL E2E Suites in Parallel ===\n");

/** @type {Promise<{ name: string; code: number | null }>[]} */
const promises = suites.map(
	(suite) =>
		new Promise((resolvePromise) => {
			console.log(`${suite.color}[${suite.name}]${RESET} Starting E2E...`);

			const child = spawn(suite.command, suite.args, {
				cwd: suite.cwd,
				stdio: ["ignore", "pipe", "pipe"],
				env: { ...process.env },
				shell: process.platform === "win32",
			});

			prefixStream(suite.name, suite.color, child.stdout, process.stdout);
			prefixStream(suite.name, suite.color, child.stderr, process.stderr);

			child.on("exit", (code) => {
				const status = code === 0 ? "\x1b[32mPASSED\x1b[0m" : "\x1b[31mFAILED\x1b[0m";
				console.log(`${suite.color}[${suite.name}]${RESET} ${status} (exit code ${code})`);
				resolvePromise({ name: suite.name, code });
			});

			child.on("error", (err) => {
				console.error(`${suite.color}[${suite.name}]${RESET} Error: ${err.message}`);
				resolvePromise({ name: suite.name, code: 1 });
			});
		}),
);

const results = await Promise.all(promises);

console.log("\n=== E2E Results Summary ===\n");
let hasFailure = false;
for (const result of results) {
	const status = result.code === 0 ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m";
	console.log(`  [${status}] ${result.name}`);
	if (result.code !== 0) {
		hasFailure = true;
	}
}

if (hasFailure) {
	console.log("\n\x1b[31m[FAIL] Some E2E suites failed!\x1b[0m\n");
	process.exit(1);
} else {
	console.log("\n\x1b[32m[PASS] All E2E suites passed!\x1b[0m\n");
	process.exit(0);
}
