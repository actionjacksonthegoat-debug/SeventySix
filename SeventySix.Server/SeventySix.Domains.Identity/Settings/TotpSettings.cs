// <copyright file="TotpSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// TOTP (Time-based One-Time Password) configuration settings.
/// All values MUST be configured in appsettings.json.
/// </summary>
public record TotpSettings
{
	/// <summary>
	/// Configuration section name in appsettings.json.
	/// </summary>
	public const string SectionName = "Totp";

	/// <summary>
	/// Gets the issuer name displayed in authenticator apps.
	/// Must be configured in appsettings.json.
	/// </summary>
	public string IssuerName { get; init; } =
		string.Empty;

	/// <summary>
	/// Gets the number of time steps to allow for clock drift.
	/// OWASP recommends 1 step (30 seconds) for clock synchronization issues.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int AllowedTimeStepDrift { get; init; }

	/// <summary>
	/// Gets the time step in seconds (RFC 6238 standard: 30).
	/// Must be configured in appsettings.json.
	/// </summary>
	public int TimeStepSeconds { get; init; }
}