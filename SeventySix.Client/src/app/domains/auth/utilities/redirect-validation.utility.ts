// <copyright file="redirect-validation.utility.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import { isNullOrUndefined } from "@shared/utilities/null-check.utility";

/**
 * Dangerous URL protocols that could be used for XSS attacks.
 * These should never be allowed in redirect URLs.
 */
const DANGEROUS_PROTOCOLS: readonly string[] =
	[
		"javascript:",
		"data:",
		"vbscript:",
		"file:"
	];

/**
 * Validates a redirect URL to prevent open redirect vulnerabilities.
 * Open redirects can be exploited by attackers to redirect users to malicious sites.
 *
 * Security Rules:
 * - Only relative URLs (starting with /) are allowed
 * - Protocol-relative URLs (//evil.com) are blocked
 * - Absolute URLs (http://evil.com) are blocked
 * - JavaScript URLs (javascript:) are blocked
 * - Data URLs (data:) are blocked
 *
 * @param {string | null | undefined} url
 * The URL to validate
 * @returns {boolean}
 * True if the URL is safe for redirect, false otherwise
 *
 * @example
 * isValidRedirectUrl("/dashboard")     // true
 * isValidRedirectUrl("/admin/users")   // true
 * isValidRedirectUrl("http://evil.com") // false
 * isValidRedirectUrl("//evil.com")     // false
 * isValidRedirectUrl("javascript:alert(1)") // false
 */
export function isValidRedirectUrl(url: string | null | undefined): boolean
{
	// Null/undefined/empty is invalid
	if (isNullOrUndefined(url) || url.trim() === "")
	{
		return false;
	}

	const trimmedUrl: string =
		url.trim();

	// Must start with single forward slash (relative path)
	// Reject if starts with // (protocol-relative URL)
	if (!trimmedUrl.startsWith("/") || trimmedUrl.startsWith("//"))
	{
		return false;
	}

	// Check for dangerous protocols (case-insensitive)
	const lowerUrl: string =
		trimmedUrl.toLowerCase();

	for (const protocol of DANGEROUS_PROTOCOLS)
	{
		if (lowerUrl.includes(protocol))
		{
			return false;
		}
	}

	// Check for URL-encoded dangerous patterns
	// Decode and check again to catch encoded attacks
	try
	{
		const decodedUrl: string =
			decodeURIComponent(trimmedUrl)
				.toLowerCase();

		for (const protocol of DANGEROUS_PROTOCOLS)
		{
			if (decodedUrl.includes(protocol))
			{
				return false;
			}
		}
	}
	catch
	{
		// If decoding fails, reject the URL as potentially malicious
		return false;
	}

	return true;
}

/**
 * Sanitizes a redirect URL, returning a safe default if invalid.
 * Use this when you need a guaranteed safe URL.
 *
 * @param {string | null | undefined} url
 * The URL to sanitize
 * @param {string} defaultUrl
 * The fallback URL if validation fails (default: "/")
 * @returns {string}
 * The original URL if valid, otherwise the default URL
 *
 * @example
 * sanitizeRedirectUrl("/dashboard")      // "/dashboard"
 * sanitizeRedirectUrl("http://evil.com") // "/"
 * sanitizeRedirectUrl(null)              // "/"
 * sanitizeRedirectUrl(null, "/home")     // "/home"
 */
export function sanitizeRedirectUrl(
	url: string | null | undefined,
	defaultUrl: string = "/"): string
{
	if (isValidRedirectUrl(url))
	{
		return url!.trim();
	}

	return defaultUrl;
}
