import { E2E_CONFIG, expect, test } from "@e2e-fixtures";

/**
 * Security header enforcement tests.
 * Verifies that critical security headers are present on responses
 * from both the Angular client (nginx) and the API (middleware).
 *
 * @tags security-headers
 */
test.describe("Security Headers @security-headers",
	() =>
	{
	/**
	 * Expected security headers and their validation rules.
	 * Each entry defines a header name and a matcher for its value.
	 */
		const requiredHeaders: { name: string; matcher: RegExp; }[] =
			[
				{ name: "x-content-type-options", matcher: /^nosniff$/i },
				{ name: "x-frame-options", matcher: /^DENY$/i },
				{ name: "referrer-policy", matcher: /strict-origin-when-cross-origin/i },
				{ name: "strict-transport-security", matcher: /max-age=(?:[3-9]\d{7}|\d{8,})/i },
				{ name: "content-security-policy", matcher: /default-src/i }
			];

		test.describe("Client (nginx)",
			() =>
			{
				test("should include all required security headers on HTML response",
					async ({ request }) =>
					{
						const response: Awaited<ReturnType<typeof request.fetch>> =
							await request.fetch(
								E2E_CONFIG.clientBaseUrl + "/",
								{ ignoreHTTPSErrors: true });

						expect(response.status())
							.toBe(200);

						for (const header of requiredHeaders)
						{
							const value: string | null =
								response.headers()[header.name] ?? null;

							expect(
								value,
								`Missing header: ${header.name}`)
								.not
								.toBeNull();
							expect(
								value,
								`Header ${header.name} has unexpected value: ${value}`)
								.toMatch(header.matcher);
						}
					});
			});

		test.describe("API (middleware)",
			() =>
			{
				test("should include all required security headers on health endpoint",
					async ({ request }) =>
					{
						const response: Awaited<ReturnType<typeof request.fetch>> =
							await request.fetch(
								E2E_CONFIG.apiBaseUrl + "/health",
								{ ignoreHTTPSErrors: true });

						expect(response.ok())
							.toBeTruthy();

						for (const header of requiredHeaders)
						{
							const value: string | null =
								response.headers()[header.name] ?? null;

							expect(
								value,
								`Missing header: ${header.name}`)
								.not
								.toBeNull();
							expect(
								value,
								`Header ${header.name} has unexpected value: ${value}`)
								.toMatch(header.matcher);
						}
					});
			});
	});