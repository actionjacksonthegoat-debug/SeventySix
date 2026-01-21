// <copyright file="http.constants.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

/**
 * HTTP header and media type constants.
 */

/** Content-Type header name. */
export const HTTP_HEADER_CONTENT_TYPE: string = "Content-Type";

/** Authorization header name. */
export const HTTP_HEADER_AUTHORIZATION: string = "Authorization";

/** XSRF token header name for CSRF protection. */
export const HTTP_HEADER_XSRF_TOKEN: string = "X-XSRF-TOKEN";

/** Bearer token prefix. */
export const HTTP_BEARER_PREFIX: string = "Bearer ";

/** JSON media type. */
export const MEDIA_TYPE_JSON: string = "application/json";

/** Form URL encoded media type. */
export const MEDIA_TYPE_FORM: string = "application/x-www-form-urlencoded";

/**
 * Retry configuration for rate-limited (429) requests.
 * Used by AuthService and interceptors for exponential backoff.
 */
export const RETRY_CONFIG: Readonly<{
	/** Maximum number of retry attempts. */
	MAX_RETRIES: 3;
	/** Base delay in milliseconds for first retry. */
	BASE_DELAY_MS: 1000;
	/** Maximum delay cap in milliseconds. */
	MAX_DELAY_MS: 10000;
}> =
	{
		MAX_RETRIES: 3,
		BASE_DELAY_MS: 1000,
		MAX_DELAY_MS: 10000
	} as const;

/**
 * Default HTTP request timeout values in milliseconds.
 * Used by ApiService for request timeout configuration.
 */
export const HTTP_TIMEOUT: Readonly<{
	/** Default timeout for standard API requests (30 seconds). */
	DEFAULT: 30000;
	/** Extended timeout for file upload operations (2 minutes). */
	UPLOAD: 120000;
	/** Short timeout for health checks (10 seconds). */
	HEALTH_CHECK: 10000;
}> =
	{
		DEFAULT: 30000,
		UPLOAD: 120000,
		HEALTH_CHECK: 10000
	} as const;

/**
 * Calculates exponential backoff delay for retry attempts.
 * @param {number} attemptNumber
 * Current retry attempt (0-indexed).
 * @returns {number}
 * Delay in milliseconds, capped at MAX_DELAY_MS.
 */
export function calculateBackoffDelay(attemptNumber: number): number
{
	const delay: number =
		RETRY_CONFIG.BASE_DELAY_MS * Math.pow(2, attemptNumber);
	return Math.min(delay, RETRY_CONFIG.MAX_DELAY_MS);
}
