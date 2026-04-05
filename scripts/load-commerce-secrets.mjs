#!/usr/bin/env node
/**
 * Reads .NET user-secrets JSON and returns commerce-specific environment variables.
 *
 * The SeventySix ecosystem stores all secrets in a single .NET user-secrets store
 * (managed via `dotnet user-secrets`). Commerce secrets are prefixed with
 * `Commerce:Sveltekit:*` and `Commerce:Tanstack:*`.
 *
 * This module reads the secrets JSON file directly — no `dotnet` CLI needed at runtime.
 *
 * @example
 * ```js
 * import { loadCommerceSecrets } from "./scripts/load-commerce-secrets.mjs";
 * const env = loadCommerceSecrets("Sveltekit");
 * // env = { DATABASE_URL: "postgresql://...", MOCK_SERVICES: "true", ... }
 * ```
 *
 * @module load-commerce-secrets
 */
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * UserSecretsId from SeventySix.Server/SeventySix.Api/SeventySix.Api.csproj.
 * This value essentially never changes — hardcoded for simplicity (KISS).
 * @type {string}
 */
const USER_SECRETS_ID = "seventysix-api-dev";

/**
 * Resolves the OS-specific path to the .NET user-secrets JSON file.
 * - Windows: %APPDATA%\Microsoft\UserSecrets\<id>\secrets.json
 * - Linux/macOS: ~/.microsoft/usersecrets/<id>/secrets.json
 * @returns {string} Absolute path to the secrets.json file.
 */
function getSecretsFilePath()
{
	const home = homedir();
	if (process.platform === "win32")
	{
		const appData = process.env.APPDATA ?? join(home, "AppData", "Roaming");
		return join(appData, "Microsoft", "UserSecrets", USER_SECRETS_ID, "secrets.json");
	}
	return join(home, ".microsoft", "usersecrets", USER_SECRETS_ID, "secrets.json");
}

/**
 * Mapping from user-secret key suffix to environment variable name.
 * Keys are the part after `Commerce:{App}:`.
 * @type {ReadonlyArray<{ secretSuffix: string; envVar: string; required: boolean }>}
 */
const SECRET_MAPPINGS = Object.freeze([
	{ secretSuffix: "DatabaseUrl", envVar: "DATABASE_URL", required: true },
	{ secretSuffix: "PostgresPassword", envVar: "POSTGRES_PASSWORD", required: true },
	{ secretSuffix: "MockServices", envVar: "MOCK_SERVICES", required: true },
	{ secretSuffix: "StripeSecretKey", envVar: "STRIPE_SECRET_KEY", required: false },
	{ secretSuffix: "StripeWebhookSecret", envVar: "STRIPE_WEBHOOK_SECRET", required: false },
	{ secretSuffix: "PrintfulApiKey", envVar: "PRINTFUL_API_KEY", required: false },
	{ secretSuffix: "PrintfulWebhookSecret", envVar: "PRINTFUL_WEBHOOK_SECRET", required: false },
	{ secretSuffix: "BrevoApiKey", envVar: "BREVO_API_KEY", required: false },
	{ secretSuffix: "BaseUrl", envVar: "BASE_URL", required: true },
	{ secretSuffix: "SeventySixApiUrl", envVar: "SEVENTYSIX_API_URL", required: false },
	{ secretSuffix: "OtelEndpoint", envVar: "OTEL_EXPORTER_OTLP_ENDPOINT", required: false },
	{ secretSuffix: "PublicOtelEndpoint", envVar: "PUBLIC_OTEL_ENDPOINT", required: false },
	{ secretSuffix: "PublicGa4MeasurementId", envVar: "PUBLIC_GA4_MEASUREMENT_ID", required: false },
	{ secretSuffix: "PublicGoogleSiteVerification", envVar: "PUBLIC_GOOGLE_SITE_VERIFICATION", required: false },
	{ secretSuffix: "PublicBingSiteVerification", envVar: "PUBLIC_BING_SITE_VERIFICATION", required: false },
]);

/**
 * TanStack-specific overrides for PUBLIC_* keys that use the VITE_ prefix.
 * @type {Readonly<Record<string, string>>}
 */
const TANSTACK_ENV_OVERRIDES = Object.freeze({
	PUBLIC_OTEL_ENDPOINT: "VITE_OTEL_ENDPOINT",
	PUBLIC_GA4_MEASUREMENT_ID: "VITE_GA4_MEASUREMENT_ID",
	PUBLIC_GOOGLE_SITE_VERIFICATION: "VITE_GOOGLE_SITE_VERIFICATION",
	PUBLIC_BING_SITE_VERIFICATION: "VITE_BING_SITE_VERIFICATION",
});

/**
 * Loads commerce secrets from the .NET user-secrets store for the specified app.
 *
 * Reads the OS-managed secrets.json file and extracts keys matching
 * `Commerce:{app}:*`, mapping them to the environment variable names
 * expected by the commerce Node.js apps.
 *
 * Parent environment variables take precedence — if a value is already
 * set in `process.env`, it is NOT overwritten.
 *
 * @param {"Sveltekit" | "Tanstack"} app - The commerce app identifier.
 * @returns {Record<string, string>} Environment variable key-value pairs.
 * @throws {Error} If the secrets file is missing and required secrets cannot be resolved.
 */
export function loadCommerceSecrets(app)
{
	const secretsPath = getSecretsFilePath();

	if (!existsSync(secretsPath))
	{
		console.warn(
			"Commerce secrets not found. Run 'npm run secrets:init' first.\n" +
			"Falling back to existing environment variables."
		);
		return {};
	}

	/** @type {Record<string, string>} */
	let allSecrets;
	try
	{
		const raw = readFileSync(secretsPath, "utf-8").replace(/^\uFEFF/, "");
		allSecrets = JSON.parse(raw);
	}
	catch
	{
		console.warn(
			"Failed to read commerce secrets. Run 'npm run secrets:init' to reinitialize.\n" +
			"Falling back to existing environment variables."
		);
		return {};
	}

	const prefix = `Commerce:${app}:`;
	/** @type {Record<string, string>} */
	const result = {};
	/** @type {string[]} */
	const missing = [];

	for (const mapping of SECRET_MAPPINGS)
	{
		const secretKey = `${prefix}${mapping.secretSuffix}`;
		const value = allSecrets[secretKey];

		// Determine the correct env var name (TanStack uses VITE_ prefix for public vars)
		let envVarName = mapping.envVar;
		if (app === "Tanstack" && envVarName in TANSTACK_ENV_OVERRIDES)
		{
			envVarName = TANSTACK_ENV_OVERRIDES[envVarName];
		}

		if (value !== undefined && value !== "")
		{
			result[envVarName] = value;
		}
		else if (mapping.required)
		{
			missing.push(envVarName);
		}
		else
		{
			result[envVarName] = "";
		}
	}

	// TanStack also needs VITE_MOCK_SERVICES mirroring MOCK_SERVICES
	if (app === "Tanstack" && result.MOCK_SERVICES !== undefined)
	{
		result.VITE_MOCK_SERVICES = result.MOCK_SERVICES;
	}

	if (missing.length > 0)
	{
		console.warn(
			`Missing required commerce secrets for ${app}: ${missing.join(", ")}\n` +
			"Run 'npm run secrets:init' to set defaults."
		);
	}

	return result;
}

/**
 * Merges commerce secrets into `process.env`, respecting existing values.
 * Values already set in `process.env` take precedence (e.g., from `start-all.mjs` overrides).
 *
 * @param {"Sveltekit" | "Tanstack"} app - The commerce app identifier.
 */
export function applyCommerceSecrets(app)
{
	const secrets = loadCommerceSecrets(app);
	for (const [key, value] of Object.entries(secrets))
	{
		if (process.env[key] === undefined || process.env[key] === "")
		{
			process.env[key] = value;
		}
	}
}
