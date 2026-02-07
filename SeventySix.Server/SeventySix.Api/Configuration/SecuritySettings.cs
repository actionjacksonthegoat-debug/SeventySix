// <copyright file="SecuritySettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Configuration;

/// <summary>
/// Centralized security settings for HTTPS enforcement and security policies.
/// This is the single source of truth for all HTTPS-related configuration.
/// All values MUST be configured in appsettings.json.
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
	/// Must be configured in appsettings.json.
	/// </summary>
	public bool EnforceHttps { get; set; }

	/// <summary>
	/// Gets or sets the HTTPS port used for redirections.
	/// This port is used when redirecting HTTP requests to HTTPS.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int HttpsPort { get; set; }

	/// <summary>
	/// Gets or sets the HSTS (HTTP Strict Transport Security) max-age in seconds.
	/// Tells browsers to only access the site via HTTPS for this duration.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int HstsMaxAgeSeconds { get; set; }

	/// <summary>
	/// Gets or sets a value indicating whether HSTS should apply to subdomains.
	/// </summary>
	public bool HstsIncludeSubdomains { get; set; }

	/// <summary>
	/// Gets or sets a value indicating whether /health endpoint can be accessed via HTTP.
	/// Useful for container health checks and load balancers.
	/// </summary>
	public bool AllowHttpForHealthChecks { get; set; }

	/// <summary>
	/// Gets or sets a value indicating whether /metrics endpoint can be accessed via HTTP.
	/// Prometheus scrapers often don't support HTTPS with custom certificates.
	/// </summary>
	public bool AllowHttpForMetrics { get; set; }

	/// <summary>
	/// Gets or sets a value indicating whether OpenAPI/Swagger endpoints can be accessed via HTTP.
	/// Useful for development and testing environments.
	/// </summary>
	public bool AllowHttpForOpenApi { get; set; }
}