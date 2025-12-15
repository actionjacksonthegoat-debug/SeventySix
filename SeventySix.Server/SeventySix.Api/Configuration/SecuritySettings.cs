// <copyright file="SecuritySettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Configuration;

/// <summary>
/// Centralized security settings for HTTPS enforcement and security policies.
/// This is the single source of truth for all HTTPS-related configuration.
/// </summary>
/// <remarks>
/// <para><b>Design Philosophy:</b></para>
/// <para>
/// All HTTPS enforcement logic is driven from these settings, eliminating
/// scattered configuration and ensuring consistent security policies across
/// Development, Staging, and Production environments.
/// </para>
///
/// <para><b>Configuration Location:</b></para>
/// <list type="bullet">
/// <item>Base settings in appsettings.json (Production defaults)</item>
/// <item>Environment overrides in appsettings.Development.json, appsettings.Production.json, etc.</item>
/// </list>
///
/// <para><b>Observability Endpoints:</b></para>
/// <para>
/// Special handling for /metrics and /health endpoints allows HTTP access
/// in development for Prometheus scraping while enforcing HTTPS in production.
/// </para>
/// </remarks>
public record SecuritySettings
{
	/// <summary>
	/// Gets or sets a value indicating whether HTTPS redirection is enforced globally.
	/// When true, all HTTP requests are redirected to HTTPS except for explicitly allowed endpoints.
	/// Default: true (Production), false (Development).
	/// </summary>
	public bool EnforceHttps { get; set; } = true;

	/// <summary>
	/// Gets or sets the HTTPS port used for redirections.
	/// This port is used when redirecting HTTP requests to HTTPS.
	/// Default: 7074.
	/// </summary>
	public int HttpsPort { get; set; } = 7074;

	/// <summary>
	/// Gets or sets the HSTS (HTTP Strict Transport Security) max-age in seconds.
	/// Tells browsers to only access the site via HTTPS for this duration.
	/// Default: 31536000 (1 year).
	/// </summary>
	public int HstsMaxAgeSeconds { get; set; } = 31536000;

	/// <summary>
	/// Gets or sets a value indicating whether HSTS should apply to subdomains.
	/// Default: true.
	/// </summary>
	public bool HstsIncludeSubdomains { get; set; } = true;

	/// <summary>
	/// Gets or sets a value indicating whether /health endpoint can be accessed via HTTP.
	/// Useful for container health checks and load balancers.
	/// Default: false (Production), true (Development).
	/// </summary>
	public bool AllowHttpForHealthChecks { get; set; } = false;

	/// <summary>
	/// Gets or sets a value indicating whether /metrics endpoint can be accessed via HTTP.
	/// Prometheus scrapers often don't support HTTPS with custom certificates.
	/// Default: true (allows HTTP for Prometheus scraping).
	/// </summary>
	public bool AllowHttpForMetrics { get; set; } = true;

	/// <summary>
	/// Gets or sets a value indicating whether OpenAPI/Swagger endpoints can be accessed via HTTP.
	/// Useful for development and testing environments.
	/// Default: false (Production), true (Development).
	/// </summary>
	public bool AllowHttpForOpenApi { get; set; } = false;
}
