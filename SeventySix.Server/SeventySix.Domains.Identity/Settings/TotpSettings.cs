// <copyright file="TotpSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// TOTP (Time-based One-Time Password) configuration settings.
/// </summary>
public record TotpSettings
{
	/// <summary>
	/// Configuration section name in appsettings.json.
	/// </summary>
	public const string SectionName = "Totp";

	/// <summary>
	/// Gets the issuer name displayed in authenticator apps.
	/// </summary>
	public string IssuerName { get; init; } = "SeventySix";

	/// <summary>
	/// Gets the number of time steps to allow for clock drift. Default: 1.
	/// </summary>
	/// <remarks>
	/// OWASP recommends allowing 1 step (30 seconds) for clock synchronization issues.
	/// </remarks>
	public int AllowedTimeStepDrift { get; init; } = 1;

	/// <summary>
	/// Gets the time step in seconds. Default: 30 (RFC 6238 standard).
	/// </summary>
	public int TimeStepSeconds { get; init; } = 30;
}