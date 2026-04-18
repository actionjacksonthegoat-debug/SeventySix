#!/usr/bin/env node
/**
 * @file Smoke tests for `ECommerce/scripts/start.mjs` and `ECommerce/scripts/e2e.mjs`.
 * Runs via `node --test scripts/__tests__/commerce-scripts.test.mjs`.
 */
import { strict as assert } from "node:assert";
import { test } from "node:test";
import * as startModule from "../../ECommerce/scripts/start.mjs";
import * as e2eModule from "../../ECommerce/scripts/e2e.mjs";

test("start.mjs parseArgs accepts --app and --skip-seed", () => {
	const parsed = startModule.parseArgs(["--app", "sveltekit", "--skip-seed"]);
	assert.equal(parsed.app, "sveltekit");
	assert.equal(parsed.skipSeed, true);
});

test("start.mjs resolveConfig rejects missing --app", () => {
	assert.throws(() => startModule.resolveConfig(null), /Missing required --app/);
});

test("start.mjs resolveConfig rejects invalid --app", () => {
	assert.throws(() => startModule.resolveConfig("bogus"), /Invalid --app/);
});

test("start.mjs sveltekit config points at SvelteKit directory and port", () => {
	const cfg = startModule.resolveConfig("sveltekit");
	assert.ok(cfg.directory.includes("seventysixcommerce-sveltekit"));
	assert.equal(cfg.port, "3001");
	assert.equal(cfg.secretsPrefix, "Sveltekit");
});

test("start.mjs tanstack config points at TanStack directory and port", () => {
	const cfg = startModule.resolveConfig("tanstack");
	assert.ok(cfg.directory.includes("seventysixcommerce-tanstack"));
	assert.equal(cfg.port, "3002");
	assert.equal(cfg.secretsPrefix, "Tanstack");
});

test("e2e.mjs parseArgs separates --keepalive and playwright args", () => {
	const parsed = e2eModule.parseArgs(["--app", "tanstack", "--keepalive", "--", "--grep", "smoke"]);
	assert.equal(parsed.app, "tanstack");
	assert.equal(parsed.keepalive, true);
	assert.deepEqual(parsed.playwrightArgs, ["--grep", "smoke"]);
});

test("e2e.mjs resolveConfig rejects invalid --app", () => {
	assert.throws(() => e2eModule.resolveConfig("bogus"), /Invalid --app/);
});

test("e2e.mjs sveltekit and tanstack expose distinct health URLs", () => {
	const svelte = e2eModule.resolveConfig("sveltekit");
	const tanstack = e2eModule.resolveConfig("tanstack");
	assert.ok(svelte.healthUrl.includes("3011"));
	assert.ok(tanstack.healthUrl.includes("3012"));
	assert.notEqual(svelte.healthUrl, tanstack.healthUrl);
});

test("e2e.mjs getAppConfigs exposes exactly two apps", () => {
	const apps = Object.keys(e2eModule.getAppConfigs()).sort();
	assert.deepEqual(apps, ["sveltekit", "tanstack"]);
});
