// <copyright file="SecurityHeaderPolicies.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;

namespace SeventySix.Api.Configuration;

/// <summary>
/// Builds <see cref="HeaderPolicyCollection"/> instances for the security headers middleware.
/// </summary>
/// <remarks>
/// All header policies are expressed here as the single authoritative source.
/// Adding or changing a security header policy is one fluent line in this file.
///
/// <para>CSPs are environment-specific:</para>
/// <list type="bullet">
/// <item>Production — strict, no <c>unsafe-inline</c>/<c>unsafe-eval</c>, Cloudflare allowed.</item>
/// <item>Development — relaxed for hot-reload and local tooling.</item>
/// </list>
///
/// <para>HSTS is applied in all non-Development environments (Test included).</para>
/// </remarks>
internal static class SecurityHeaderPolicies
{
	/// <summary>
	/// HSTS max-age in seconds (one year).
	/// </summary>
	private const int HstsMaxAge = 31536000;

	/// <summary>
	/// Full Permissions-Policy value restricting all unused browser features.
	/// </summary>
	private const string PermissionsPolicyValue =
		"accelerometer=(), "
		+ "ambient-light-sensor=(), "
		+ "autoplay=(), "
		+ "battery=(), "
		+ "camera=(), "
		+ "display-capture=(), "
		+ "document-domain=(), "
		+ "encrypted-media=(), "
		+ "fullscreen=(self), "
		+ "geolocation=(), "
		+ "gyroscope=(), "
		+ "magnetometer=(), "
		+ "microphone=(), "
		+ "midi=(), "
		+ "payment=(), "
		+ "picture-in-picture=(), "
		+ "publickey-credentials-get=(), "
		+ "screen-wake-lock=(), "
		+ "sync-xhr=(), "
		+ "usb=(), "
		+ "xr-spatial-tracking=()";

	/// <summary>
	/// Builds the standard <see cref="HeaderPolicyCollection"/> for the current environment.
	/// </summary>
	/// <param name="environment">
	/// The web host environment used to select the production or development policy.
	/// </param>
	/// <returns>
	/// A fully configured <see cref="HeaderPolicyCollection"/>.
	/// </returns>
	internal static HeaderPolicyCollection Build(IWebHostEnvironment environment) =>
		environment.IsDevelopment()
			? BuildDevelopment()
			: BuildProduction();

	/// <summary>
	/// Builds a <see cref="HeaderPolicyCollection"/> that applies all shared headers
	/// but overrides the <c>Content-Security-Policy</c> with the given raw CSP string.
	/// Used for OAuth callback pages that embed an inline nonce-gated script.
	/// </summary>
	/// <param name="environment">
	/// The web host environment — determines whether HSTS is included.
	/// </param>
	/// <param name="overrideCsp">
	/// The raw CSP header value, e.g. <c>default-src 'none'; script-src 'nonce-abc123'</c>.
	/// </param>
	/// <returns>
	/// A <see cref="HeaderPolicyCollection"/> with the override CSP applied.
	/// </returns>
	internal static HeaderPolicyCollection BuildWithCspOverride(
		IWebHostEnvironment environment,
		string overrideCsp)
	{
		HeaderPolicyCollection policies =
			AddSharedHeaders(new HeaderPolicyCollection())
				.AddCustomHeader(
					"Content-Security-Policy",
					overrideCsp);

		if (!environment.IsDevelopment())
		{
			policies =
				policies.AddCustomHeader(
					"Strict-Transport-Security",
					$"max-age={HstsMaxAge}; includeSubDomains; preload");
		}

		return policies;
	}

	/// <summary>
	/// Builds the production security header policy collection.
	/// Strict CSP without <c>unsafe-inline</c>/<c>unsafe-eval</c>; Cloudflare analytics allowed.
	/// HSTS with one-year max-age, includeSubDomains, and preload.
	/// </summary>
	/// <returns>
	/// Production <see cref="HeaderPolicyCollection"/>.
	/// </returns>
	private static HeaderPolicyCollection BuildProduction() =>
		AddSharedHeaders(new HeaderPolicyCollection())
			.AddCustomHeader(
				"Strict-Transport-Security",
				$"max-age={HstsMaxAge}; includeSubDomains; preload")
			.AddContentSecurityPolicy(
				csp =>
				{
					csp.AddDefaultSrc().Self();
					csp.AddScriptSrc()
						.Self()
						.From("https://static.cloudflareinsights.com");
					csp.AddStyleSrc().Self().UnsafeInline();
					csp.AddFontSrc().Self();
					csp.AddImgSrc().Self().Data();
					csp.AddConnectSrc()
						.Self()
						.From("https://cloudflareinsights.com")
						// GitHub OAuth uses top-level browser redirects (not XHR/fetch)
						// so https://github.com is NOT needed in connect-src
						.From("https://static.cloudflareinsights.com");
					csp.AddFrameSrc().Self();
					csp.AddFrameAncestors().Self();
					csp.AddBaseUri().Self();
					csp.AddFormAction().Self();
					csp.AddUpgradeInsecureRequests();
				});

	/// <summary>
	/// Builds the development security header policy collection.
	/// Relaxed CSP for hot-reload, Angular devtools, and local Grafana embedding.
	/// No HSTS (avoid development certificate issues).
	/// </summary>
	/// <returns>
	/// Development <see cref="HeaderPolicyCollection"/>.
	/// </returns>
	private static HeaderPolicyCollection BuildDevelopment() =>
		AddSharedHeaders(new HeaderPolicyCollection())
			.AddContentSecurityPolicy(
				csp =>
				{
					csp.AddDefaultSrc().Self();
					csp.AddScriptSrc().Self().UnsafeInline().UnsafeEval();
					csp.AddStyleSrc().Self().UnsafeInline();
					csp.AddFontSrc().Self();
					csp.AddImgSrc().Self().Data();
					csp.AddConnectSrc()
						.Self()
						.From("wss:")
						.From("https://localhost:7074")
						.From("https://localhost:4319");
					csp.AddFrameSrc()
						.Self()
						.From("https://localhost:3443");
					csp.AddFrameAncestors().Self();
					csp.AddBaseUri().Self();
					csp.AddFormAction().Self();
					csp.AddUpgradeInsecureRequests();
				});

	/// <summary>
	/// Adds the security headers that are identical across all environments and all policy variants.
	/// </summary>
	/// <param name="policies">
	/// The policy collection to extend.
	/// </param>
	/// <returns>
	/// The same <paramref name="policies"/> instance for fluent chaining.
	/// </returns>
	private static HeaderPolicyCollection AddSharedHeaders(
		HeaderPolicyCollection policies) =>
		policies
			.AddFrameOptionsDeny()
			.AddContentTypeOptionsNoSniff()
			.AddReferrerPolicyStrictOriginWhenCrossOrigin()
			.AddCustomHeader(
				"X-XSS-Protection",
				"0")
			.AddCustomHeader(
				"Permissions-Policy",
				PermissionsPolicyValue)
			.AddCustomHeader(
				"Cache-Control",
				"no-store")
			.AddCustomHeader(
				"Pragma",
				"no-cache");
}