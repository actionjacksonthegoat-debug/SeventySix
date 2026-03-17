import { isNullOrUndefined } from "@shared/utilities/null-check.utility";

/** Regex to detect a GitHub Codespaces forwarded hostname (`{name}-{port}.app.github.dev`). */
const CODESPACE_HOSTNAME_PATTERN: RegExp =
	/^(.+)-(\d+)\.app\.github\.dev$/;

/** Regex to extract the port and optional path from a localhost URL (`http(s)://localhost:{port}{path}`). */
const LOCALHOST_URL_PATTERN: RegExp =
	/^https?:\/\/localhost:(\d+)(\/.*)?$/;

/**
 * Resolves a configured observability URL to its GitHub Codespaces port-forwarded equivalent.
 *
 * When running inside a Codespace, `localhost` URLs are unreachable because the browser runs
 * on the user's machine while the container runs remotely. Codespaces forwards each port to
 * `https://{codespace-name}-{port}.app.github.dev`. This function rewrites localhost URLs
 * to the corresponding forwarded URL at runtime.
 *
 * Returns the configured URL unchanged when:
 * - The hostname is not a Codespaces hostname (local development, production)
 * - The URL is a relative sub-path (production reverse-proxy routes like `/grafana`)
 * - The URL is undefined (optional observability services)
 *
 * @param configuredUrl
 * The observability URL from the environment configuration (e.g., `"https://localhost:3443"`).
 *
 * @param hostname
 * The current browser hostname from `document.location.hostname`.
 *
 * @returns
 * The resolved URL — either the Codespaces-forwarded URL or the original configured URL.
 */
export function resolveCodespaceUrl(configuredUrl: string, hostname: string): string;
/**
 * Overload that accepts `undefined` for optional observability URLs (pgAdmin, RedisInsight, Scalar).
 *
 * @param configuredUrl
 * The observability URL or `undefined` if the service is not configured.
 *
 * @param hostname
 * The current browser hostname from `document.location.hostname`.
 *
 * @returns
 * The resolved URL, or `undefined` if the input was `undefined`.
 */
export function resolveCodespaceUrl(configuredUrl: string | undefined, hostname: string): string | undefined;
export function resolveCodespaceUrl(
	configuredUrl: string | undefined,
	hostname: string): string | undefined
{
	if (isNullOrUndefined(configuredUrl))
	{
		return undefined;
	}

	const codespaceMatch: RegExpMatchArray | null =
		hostname.match(CODESPACE_HOSTNAME_PATTERN);

	if (isNullOrUndefined(codespaceMatch))
	{
		return configuredUrl;
	}

	const localhostMatch: RegExpMatchArray | null =
		configuredUrl.match(LOCALHOST_URL_PATTERN);

	if (isNullOrUndefined(localhostMatch))
	{
		return configuredUrl;
	}

	const codespaceBaseName: string =
		codespaceMatch[1];
	const servicePort: string =
		localhostMatch[1];
	const pathSuffix: string =
		localhostMatch[2] ?? "";

	return `https://${codespaceBaseName}-${servicePort}.app.github.dev${pathSuffix}`;
}