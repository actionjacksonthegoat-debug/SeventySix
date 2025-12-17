// <copyright file="WhitelistedPermissionSettings.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Configuration for pre-approved permission grants.
/// Emails matching grants will have roles auto-approved without admin review.
/// </summary>
public record WhitelistedPermissionSettings
{
	/// <summary>
	/// Configuration section name in appsettings.json.
	/// </summary>
	public const string SectionName = "WhitelistedPermissions";

	/// <summary>
	/// Gets the list of pre-approved email/role grants.
	/// </summary>
	public List<WhitelistedGrant> Grants { get; init; } = [];

	/// <summary>
	/// Checks if an email/role combination is whitelisted for auto-approval.
	/// </summary>
	/// <param name="email">User email address.</param>
	/// <param name="role">Role being requested.</param>
	/// <returns>True if the combination is whitelisted.</returns>
	public bool IsWhitelisted(string email, string role)
	{
		return Grants.Any(grant =>
			grant.Email.Equals(email, StringComparison.OrdinalIgnoreCase)
			&& grant.Roles.Contains(role, StringComparer.OrdinalIgnoreCase));
	}
}

/// <summary>
/// Single whitelisted permission grant configuration.
/// </summary>
public record WhitelistedGrant
{
	/// <summary>
	/// Gets the email address (exact match, case-insensitive).
	/// </summary>
	public string Email { get; init; } = string.Empty;

	/// <summary>
	/// Gets the roles to auto-approve for this email.
	/// </summary>
	public List<string> Roles { get; init; } = [];
}