#!/usr/bin/env node
/**
 * @file Smoke tests for `scripts/run-load-tests.mjs` using Node's built-in test runner.
 *
 * Runs via `node --test scripts/__tests__/run-load-tests.test.mjs`.
 *
 * Covers:
 *   - Arg parsing rejects invalid `--app`.
 *   - Arg parsing rejects invalid `--profile`.
 *   - Each known app resolves to its expected docker-compose file.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { getAppConfigs, parseArgs, resolveAppConfig } from "../run-load-tests.mjs";

test("parseArgs accepts all known flags", () => {
	const result = parseArgs(["--app", "main", "--profile", "quick", "--scenario", "auth/login", "--keep-running"]);
	assert.equal(result.app, "main");
	assert.equal(result.profile, "quick");
	assert.equal(result.scenario, "auth/login");
	assert.equal(result.keepRunning, true);
});

test("resolveAppConfig rejects invalid --app", () => {
	const parsed = parseArgs(["--app", "bogus"]);
	assert.throws(() => resolveAppConfig(parsed), /Invalid --app/);
});

test("resolveAppConfig rejects missing --app", () => {
	const parsed = parseArgs([]);
	assert.throws(() => resolveAppConfig(parsed), /Missing required --app/);
});

test("resolveAppConfig rejects invalid --profile", () => {
	const parsed = parseArgs(["--app", "main", "--profile", "turbo"]);
	assert.throws(() => resolveAppConfig(parsed), /Invalid --profile/);
});

test("main app resolves to docker-compose.loadtest.yml", () => {
	const config = resolveAppConfig(parseArgs(["--app", "main"]));
	assert.equal(config.compose, "docker-compose.loadtest.yml");
	assert.ok(config.healthUrl.startsWith("https://"));
	assert.equal(config.needsSslCert, true);
});

test("sveltekit app resolves to docker-compose.loadtest-svelte.yml", () => {
	const config = resolveAppConfig(parseArgs(["--app", "sveltekit"]));
	assert.equal(config.compose, "docker-compose.loadtest-svelte.yml");
	assert.ok(config.healthUrl.includes("3021"));
	assert.equal(config.needsSslCert, false);
});

test("tanstack app resolves to docker-compose.loadtest-tanstack.yml", () => {
	const config = resolveAppConfig(parseArgs(["--app", "tanstack"]));
	assert.equal(config.compose, "docker-compose.loadtest-tanstack.yml");
	assert.ok(config.healthUrl.includes("3022"));
	assert.equal(config.needsSslCert, false);
});

test("getAppConfigs exposes exactly three apps", () => {
	const apps = Object.keys(getAppConfigs()).sort();
	assert.deepEqual(apps, ["main", "sveltekit", "tanstack"]);
});
