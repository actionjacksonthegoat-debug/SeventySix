// <copyright file="redirect-validation.utility.spec.ts" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

import {
	isValidRedirectUrl,
	sanitizeRedirectUrl
} from "./redirect-validation.utility";

/**
 * Redirect URL Validation Tests
 *
 * Security Context:
 * Open redirect vulnerabilities allow attackers to redirect users to malicious sites
 * by manipulating the returnUrl parameter. This can be used for phishing attacks
 * where users think they're on a legitimate site.
 *
 * Attack Vectors Tested:
 * - External URLs (http://evil.com)
 * - Protocol-relative URLs (//evil.com)
 * - JavaScript injection (javascript:alert(1))
 * - Data URLs (data:text/html,<script>)
 * - URL-encoded attacks (%6a%61%76%61%73%63%72%69%70%74:)
 */
describe("Redirect URL Validation",
	() =>
	{
		describe("isValidRedirectUrl",
			() =>
			{
				describe("Valid URLs (should return true)",
					() =>
					{
						it("should allow root path",
							() =>
							{
								expect(isValidRedirectUrl("/"))
									.toBe(true);
							});

						it("should allow simple relative path",
							() =>
							{
								expect(isValidRedirectUrl("/dashboard"))
									.toBe(true);
							});

						it("should allow nested relative path",
							() =>
							{
								expect(isValidRedirectUrl("/admin/users/list"))
									.toBe(true);
							});

						it("should allow path with query parameters",
							() =>
							{
								expect(isValidRedirectUrl("/search?q=test&page=1"))
									.toBe(true);
							});

						it("should allow path with fragment",
							() =>
							{
								expect(isValidRedirectUrl("/docs#section-1"))
									.toBe(true);
							});

						it("should allow path with encoded characters",
							() =>
							{
								expect(isValidRedirectUrl("/users/john%20doe"))
									.toBe(true);
							});
					});

				describe("Invalid URLs - External (should return false)",
					() =>
					{
						it("should reject http:// URLs",
							() =>
							{
								expect(isValidRedirectUrl("http://evil.com"))
									.toBe(false);
							});

						it("should reject https:// URLs",
							() =>
							{
								expect(isValidRedirectUrl("https://evil.com/path"))
									.toBe(false);
							});

						it("should reject protocol-relative URLs (//evil.com)",
							() =>
							{
								expect(isValidRedirectUrl("//evil.com"))
									.toBe(false);
							});

						it("should reject protocol-relative URLs with path",
							() =>
							{
								expect(isValidRedirectUrl("//evil.com/callback"))
									.toBe(false);
							});

						it("should reject ftp:// URLs",
							() =>
							{
								expect(isValidRedirectUrl("ftp://files.evil.com"))
									.toBe(false);
							});
					});

				describe("Invalid URLs - XSS Vectors (should return false)",
					() =>
					{
						it("should reject javascript: URLs",
							() =>
							{
								expect(isValidRedirectUrl("javascript:alert(1)"))
									.toBe(false);
							});

						it("should reject javascript: URLs (case-insensitive)",
							() =>
							{
								expect(isValidRedirectUrl("JAVASCRIPT:alert(1)"))
									.toBe(false);
							});

						it("should reject javascript: URLs (mixed case)",
							() =>
							{
								expect(isValidRedirectUrl("JaVaScRiPt:alert(1)"))
									.toBe(false);
							});

						it("should reject data: URLs",
							() =>
							{
								expect(isValidRedirectUrl("data:text/html,<script>alert(1)</script>"))
									.toBe(false);
							});

						it("should reject vbscript: URLs",
							() =>
							{
								expect(isValidRedirectUrl("vbscript:msgbox(1)"))
									.toBe(false);
							});

						it("should reject file: URLs",
							() =>
							{
								expect(isValidRedirectUrl("file:///etc/passwd"))
									.toBe(false);
							});

						it("should reject URL-encoded javascript:",
							() =>
							{
								// javascript: encoded as %6a%61%76%61%73%63%72%69%70%74%3a
								expect(isValidRedirectUrl("/%6a%61%76%61%73%63%72%69%70%74:alert(1)"))
									.toBe(false);
							});
					});

				describe("Invalid URLs - Null/Empty (should return false)",
					() =>
					{
						it("should reject null",
							() =>
							{
								expect(isValidRedirectUrl(null))
									.toBe(false);
							});

						it("should reject undefined",
							() =>
							{
								expect(isValidRedirectUrl(undefined))
									.toBe(false);
							});

						it("should reject empty string",
							() =>
							{
								expect(isValidRedirectUrl(""))
									.toBe(false);
							});

						it("should reject whitespace-only string",
							() =>
							{
								expect(isValidRedirectUrl("   "))
									.toBe(false);
							});
					});

				describe("Edge Cases",
					() =>
					{
						it("should handle path starting without slash",
							() =>
							{
								expect(isValidRedirectUrl("dashboard"))
									.toBe(false);
							});

						it("should handle path with backslash",
							() =>
							{
								// Backslash could be used for URL confusion
								expect(isValidRedirectUrl("\\\\evil.com"))
									.toBe(false);
							});
					});
			});

		describe("sanitizeRedirectUrl",
			() =>
			{
				it("should return valid URL unchanged",
					() =>
					{
						expect(sanitizeRedirectUrl("/dashboard"))
							.toBe("/dashboard");
					});

				it("should return default for invalid URL",
					() =>
					{
						expect(sanitizeRedirectUrl("http://evil.com"))
							.toBe("/");
					});

				it("should return custom default when provided",
					() =>
					{
						expect(sanitizeRedirectUrl(
							"http://evil.com",
							"/home"))
							.toBe("/home");
					});

				it("should return default for null",
					() =>
					{
						expect(sanitizeRedirectUrl(null))
							.toBe("/");
					});

				it("should return default for undefined",
					() =>
					{
						expect(sanitizeRedirectUrl(undefined))
							.toBe("/");
					});

				it("should trim whitespace from valid URL",
					() =>
					{
						expect(sanitizeRedirectUrl("  /dashboard  "))
							.toBe("/dashboard");
					});
			});
	});