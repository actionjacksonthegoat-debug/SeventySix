// <copyright file="AdminSeederSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity.Settings;

/// <summary>
/// Configuration settings for admin user seeding.
/// </summary>
/// <remarks>
/// WARNING: The InitialPassword should be changed immediately after first login.
/// In production, use environment variables or secrets management.
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
	public bool Enabled { get; set; } = true;

	/// <summary>
	/// Gets or sets the admin username.
	/// </summary>
	public string Username { get; set; } = "admin";

	/// <summary>
	/// Gets or sets the admin email.
	/// </summary>
	public string Email { get; set; } = "admin@seventysix.local";

	/// <summary>
	/// Gets or sets the admin full name.
	/// </summary>
	public string? FullName { get; set; } = "System Administrator";

	/// <summary>
	/// Gets or sets the initial password.
	/// Must be changed on first login.
	/// </summary>
	/// <remarks>
	/// Use environment variables or secrets in production:
	/// AdminSeeder__InitialPassword=YourSecurePassword
	/// </remarks>
	public string InitialPassword { get; set; } = "Admin123!";

	/// <summary>
	/// Gets or sets the BCrypt work factor for password hashing.
	/// </summary>
	public int WorkFactor { get; set; } = 12;
}
