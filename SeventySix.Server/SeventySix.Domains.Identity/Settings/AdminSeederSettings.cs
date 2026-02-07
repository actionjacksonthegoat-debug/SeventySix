// <copyright file="AdminSeederSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity.Settings;

/// <summary>
/// Configuration settings for admin user seeding.
/// All values MUST be configured in appsettings.json.
/// </summary>
/// <remarks>
/// <para>
/// Security: InitialPassword must be provided via environment variable or secrets,
/// and will be validated against weak password patterns.
/// </para>
/// <para>
/// The seeded admin user is marked with RequiresPasswordChange=true, forcing
/// a password change on first login regardless of initial password strength.
/// </para>
/// </remarks>
public record AdminSeederSettings
{
	/// <summary>
	/// Configuration section name in appsettings.json.
	/// </summary>
	public const string SectionName = "AdminSeeder";

	/// <summary>
	/// Gets or sets whether admin seeding is enabled.
	/// </summary>
	public bool Enabled { get; set; }

	/// <summary>
	/// Gets or sets the admin username.
	/// Must be configured in appsettings.json.
	/// </summary>
	public string Username { get; set; } =
		string.Empty;

	/// <summary>
	/// Gets or sets the admin email.
	/// Must be configured in appsettings.json.
	/// </summary>
	public string Email { get; set; } =
		string.Empty;

	/// <summary>
	/// Gets or sets the admin full name.
	/// Must be configured in appsettings.json when Enabled=true.
	/// </summary>
	public string FullName { get; set; } =
		string.Empty;

	/// <summary>
	/// Gets or sets the initial password. Required when Enabled is true.
	/// </summary>
	/// <remarks>
	/// Security: Must be provided via environment variable or secrets in production.
	/// Set via ADMIN_PASSWORD or AdminSeeder__InitialPassword environment variable.
	/// </remarks>
	public string? InitialPassword { get; set; }
}