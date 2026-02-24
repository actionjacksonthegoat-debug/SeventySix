/**
 * OAuth Redirect Initiation Load Test
 *
 * Tests GET /auth/oauth/github under concurrent VUs.
 * The endpoint generates PKCE pairs, stores state in FusionCache,
 * and returns a 302 redirect to GitHub. Validates consistent redirects
 * and rate limiting under load.
 *
 * Note: The code exchange endpoint (POST /auth/oauth/exchange) cannot be
 * meaningfully load tested in isolation because it requires valid PKCE
 * codes stored in server-side FusionCache, which k6 cannot pre-seed.
 */

import { check, sleep } from "k6";
import http from "k6/http";
import { warmup } from "../../lib/auth.js";
import { CONFIG, getOptions } from "../../lib/config.js";
import {
	AUTH_ENDPOINTS,
	buildTags,
	FLOW_TAGS,
	HTTP_HEADER,
	HTTP_STATUS,
	OPERATION_TAGS,
	RATE_LIMIT,
	SLEEP_DURATION,
	THRESHOLDS
} from "../../lib/constants/index.js";
import { isSetupMissing } from "../../lib/guards.js";
import { createSummaryHandler } from "../../lib/summary.js";

export const options =
	getOptions(THRESHOLDS.STANDARD);

/**
 * Warm up the API connection and JIT-compile the OAuth redirect path
 * so cold-start latency is excluded from metrics.
 */
export function setup()
{
	warmup();

	http.get(
		`${CONFIG.apiUrl}${AUTH_ENDPOINTS.OAUTH_GITHUB}`,
		{
			redirects: 0,
			...buildTags(
				FLOW_TAGS.WARMUP,
				OPERATION_TAGS.OAUTH_REDIRECT)
		});

	return { warmedUp: true };
}

export default function(data)
{
	if (isSetupMissing(data))
	{
		return;
	}
	// OAuth redirect — expects 302 to GitHub with PKCE parameters
	const response =
		http.get(
			`${CONFIG.apiUrl}${AUTH_ENDPOINTS.OAUTH_GITHUB}`,
			{
				redirects: 0,
				...buildTags(
					FLOW_TAGS.AUTH,
					OPERATION_TAGS.OAUTH_REDIRECT)
			});

	check(response,
		{
			"returns 302 redirect": (response) =>
				response.status === HTTP_STATUS.FOUND,
			"redirect targets github.com": (response) =>
			{
				const location =
					response.headers[HTTP_HEADER.LOCATION];
				if (location == null || location === "")
				{
					return false;
				}
				// Parse host from absolute URL without using the URL constructor
				// (not globally available in all k6 environments)
				const schemeEnd =
					location.indexOf("//");
				if (schemeEnd === -1)
				{
					return false;
				}
				const hostStart =
					schemeEnd + 2;
				const slashAfterHost =
					location.indexOf("/", hostStart);
				const hostWithPort =
					slashAfterHost === -1
						? location.slice(hostStart)
						: location.slice(hostStart, slashAfterHost);
				const host =
					hostWithPort.split(":")[0];
				return host === "github.com"
					|| host.endsWith(".github.com");
			},
			"includes state parameter": (response) =>
				response.headers[HTTP_HEADER.LOCATION] != null
					&& response.headers[HTTP_HEADER.LOCATION].includes("state="),
			"includes code_challenge": (response) =>
				response.headers[HTTP_HEADER.LOCATION] != null
					&& response.headers[HTTP_HEADER.LOCATION].includes("code_challenge=")
		});

	sleep(SLEEP_DURATION.STANDARD);

	// Rate limiting validation — rapid-fire requests
	rateLimitValidation();
}

/**
 * Sends rapid-fire requests to verify rate limiting fires correctly.
 * Stops on first 429 response and validates headers.
 */
function rateLimitValidation()
{
	const maxAttempts =
		RATE_LIMIT.MAX_ATTEMPTS;

	for (let index = 0; index < maxAttempts; index++)
	{
		const response =
			http.get(
				`${CONFIG.apiUrl}${AUTH_ENDPOINTS.OAUTH_GITHUB}`,
				{
					redirects: 0,
					...buildTags(
						FLOW_TAGS.AUTH,
						OPERATION_TAGS.OAUTH_RATE_LIMIT)
				});

		if (response.status === HTTP_STATUS.TOO_MANY_REQUESTS)
		{
			check(response,
				{
					"rate limit returns 429": (response) =>
						response.status === HTTP_STATUS.TOO_MANY_REQUESTS,
					"includes retry-after header": (response) =>
						response.headers[HTTP_HEADER.RETRY_AFTER] != null
				});
			break;
		}
	}
}

export const handleSummary =
	createSummaryHandler("oauth-redirect-test");
