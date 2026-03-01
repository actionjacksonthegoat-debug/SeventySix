// <copyright file="SiteSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Configuration;

/// <summary>
/// Site-level configuration settings.
/// </summary>
/// <remarks>
/// Provides site-level settings that are safe to expose to the client
/// (e.g., public contact email for privacy/legal pages).
/// Set via user secrets in development, <c>SITE_EMAIL</c> GitHub Secret in production.
/// </remarks>
public sealed record SiteSettings
{
	/// <summary>
	/// Configuration section name in appsettings.json.
	/// </summary>
	public const string SectionName = "Site";

	/// <summary>
	/// Public contact email address shown on legal pages (Privacy Policy, Terms of Service).
	/// </summary>
	/// <remarks>
	/// Must never be hardcoded in client templates. Always sourced from this setting,
	/// injected at runtime so deployments can configure their own contact address.
	/// </remarks>
	public string Email { get; init; } =
		string.Empty;
}