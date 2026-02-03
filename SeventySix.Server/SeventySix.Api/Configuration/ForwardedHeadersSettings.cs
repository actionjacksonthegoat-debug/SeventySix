// <copyright file="ForwardedHeadersSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Configuration;

/// <summary>
/// Configuration for trusted proxy handling with ForwardedHeadersMiddleware.
/// Numeric values MUST be configured in appsettings.json.
/// </summary>
/// <remarks>
/// <para><b>Security Impact:</b></para>
/// <para>
/// Proper configuration prevents IP spoofing attacks where malicious clients
/// forge X-Forwarded-For headers to bypass IP-based rate limiting.
/// </para>
///
/// <para><b>Environment Configuration:</b></para>
/// <list type="bullet">
/// <item>Development: Leave KnownProxies/KnownNetworks empty (trusts all for local testing)</item>
/// <item>Production: Configure with actual load balancer/reverse proxy IPs</item>
/// </list>
/// </remarks>
public record ForwardedHeadersSettings
{
	/// <summary>
	/// Gets the configuration section name.
	/// </summary>
	public const string SectionName = "ForwardedHeaders";

	/// <summary>
	/// Gets or sets trusted proxy IP addresses.
	/// Leave empty in development. In production, add load balancer IPs.
	/// </summary>
	/// <example>["10.0.0.1", "192.168.1.100"]</example>
	public string[] KnownProxies { get; set; } = [];

	/// <summary>
	/// Gets or sets known proxy network ranges in CIDR notation.
	/// </summary>
	/// <example>["10.0.0.0/8", "172.16.0.0/12"]</example>
	public string[] KnownNetworks { get; set; } = [];

	/// <summary>
	/// Gets or sets the limit on number of proxy hops to process.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int ForwardLimit { get; set; }
}