#!/usr/bin/env node
/**
 * Unified development startup — starts ALL services concurrently:
 * SeventySix (API + Angular), SeventySixCommerce TanStack, and SeventySixCommerce SvelteKit.
 *
 * Each service runs in its own child process with prefixed output for clarity.
 * Press Ctrl+C to stop all services.
 */
import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");

/**
 * Environment overrides for commerce app processes when running alongside the main platform.
 * Enables log forwarding to the SeventySix API and OTEL telemetry collection.
 * NODE_TLS_REJECT_UNAUTHORIZED=0 allows connecting to the dev self-signed certificate.
 * @type {Record<string, string>}
 */
const commerceEnvOverrides = {
	SEVENTYSIX_API_URL: "https://localhost:7074",
	OTEL_EXPORTER_OTLP_ENDPOINT: "http://localhost:4318",
	NODE_TLS_REJECT_UNAUTHORIZED: "0",
};

/** @type {{ name: string; command: string; args: string[]; color: string; env?: Record<string, string> }[]} */
const services = [
	{
		name: "SeventySix",
		command: "node",
		args: ["scripts/run-pwsh.mjs", "-File", "scripts/start-dev.ps1"],
		color: "\x1b[36m",
	},
	{
		name: "TanStack",
		command: "node",
		args: ["ECommerce/seventysixcommerce-tanstack/scripts/start.mjs"],
		color: "\x1b[33m",
		env: commerceEnvOverrides,
	},
	{
		name: "SvelteKit",
		command: "node",
		args: ["ECommerce/seventysixcommerce-sveltekit/scripts/start.mjs"],
		color: "\x1b[35m",
		env: commerceEnvOverrides,
	},
];

const RESET = "\x1b[0m";

/** @type {import("node:child_process").ChildProcess[]} */
const children = [];

/**
 * Prefixes each line of output with the service name and color.
 * @param {string} name - The service name for the prefix.
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

console.log("\n=== Starting ALL Services ===\n");

for (const service of services) {
	console.log(`${service.color}[${service.name}]${RESET} Starting...`);

	const child = spawn(service.command, service.args, {
		cwd: repoRoot,
		stdio: ["ignore", "pipe", "pipe"],
		env: { ...process.env, ...service.env },
	});

	prefixStream(service.name, service.color, child.stdout, process.stdout);
	prefixStream(service.name, service.color, child.stderr, process.stderr);

	child.on("exit", (code) => {
		console.log(`${service.color}[${service.name}]${RESET} exited with code ${code}`);
	});

	children.push(child);
}

/**
 * Gracefully terminates all child processes on SIGINT/SIGTERM.
 */
function shutdown() {
	console.log("\n\nShutting down all services...");
	for (const child of children) {
		if (!child.killed) {
			child.kill("SIGTERM");
		}
	}
	setTimeout(() => {
		for (const child of children) {
			if (!child.killed) {
				child.kill("SIGKILL");
			}
		}
		process.exit(0);
	}, 5000);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
