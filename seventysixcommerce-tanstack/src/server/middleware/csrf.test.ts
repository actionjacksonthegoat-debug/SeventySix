import { describe, expect, it } from "vitest";

/**
 * Unit tests for the origin-based CSRF validation logic.
 * Tests the validation logic extracted from the middleware.
 */

const SAFE_METHODS: Set<string> =
	new Set(
		["GET", "HEAD", "OPTIONS"]);

/**
 * Validates origin against allowed base URL.
 * @param method - The HTTP method.
 * @param origin - The Origin header value (or null).
 * @param baseUrl - The configured BASE_URL.
 * @returns True if the request should be allowed.
 */
function isRequestAllowed(
	method: string,
	origin: string | null,
	baseUrl: string): boolean
{
	if (SAFE_METHODS.has(method.toUpperCase()))
	{
		return true;
	}
	if (!origin)
	{
		return false;
	}
	const allowedOrigin: string =
		new URL(baseUrl).origin;
	return origin === allowedOrigin;
}

describe("CSRF origin validation",
	() =>
	{
		const baseUrl: string = "http://localhost:3000";

		it("should allow GET requests without origin",
			() =>
			{
				expect(isRequestAllowed("GET", null, baseUrl))
					.toBe(true);
			});

		it("should allow HEAD requests without origin",
			() =>
			{
				expect(isRequestAllowed("HEAD", null, baseUrl))
					.toBe(true);
			});

		it("should allow OPTIONS requests without origin",
			() =>
			{
				expect(isRequestAllowed("OPTIONS", null, baseUrl))
					.toBe(true);
			});

		it("should allow POST with matching origin",
			() =>
			{
				expect(isRequestAllowed("POST", "http://localhost:3000", baseUrl))
					.toBe(
						true);
			});

		it("should reject POST without origin header",
			() =>
			{
				expect(isRequestAllowed("POST", null, baseUrl))
					.toBe(false);
			});

		it("should reject POST with mismatched origin",
			() =>
			{
				expect(isRequestAllowed("POST", "http://evil.com", baseUrl))
					.toBe(
						false);
			});

		it("should reject PUT with mismatched origin",
			() =>
			{
				expect(isRequestAllowed("PUT", "http://attacker.com", baseUrl))
					.toBe(
						false);
			});

		it("should reject DELETE without origin",
			() =>
			{
				expect(isRequestAllowed("DELETE", null, baseUrl))
					.toBe(false);
			});

		it("should handle BASE_URL with trailing path",
			() =>
			{
				expect(
					isRequestAllowed(
						"POST",
						"http://localhost:3000",
						"http://localhost:3000/app"))
					.toBe(true);
			});

		it("should reject origin on different port",
			() =>
			{
				expect(isRequestAllowed("POST", "http://localhost:4000", baseUrl))
					.toBe(
						false);
			});
	});