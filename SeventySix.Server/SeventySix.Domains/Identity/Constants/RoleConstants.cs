// <copyright file="RoleConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity.Constants;

/// <summary>
/// Role constants for the application.
/// Single source of truth for valid role names (DRY).
/// </summary>
public static class RoleConstants
{
	/// <summary>Developer role name.</summary>
	public const string Developer = "Developer";

	/// <summary>Admin role name.</summary>
	public const string Admin = "Admin";

	/// <summary>User role name (default role).</summary>
	public const string User = "User";

	/// <summary>All requestable roles in the system with descriptions.</summary>
	/// <remarks>
	/// KISS: Hardcoded list is simpler than database/config management.
	/// Easy to extend when new roles are added to the system.
	/// </remarks>
	public static readonly IReadOnlyList<AvailableRoleDto> AllRequestableRoles =
	[
		new AvailableRoleDto(
			Developer,
			"Access to developer tools and APIs"),
		new AvailableRoleDto(
			Admin,
			"Full administrative access")
	];

	/// <summary>Valid role names for admin assignment and validation.</summary>
	public static readonly HashSet<string> ValidRoleNames =
		AllRequestableRoles
			.Select(role => role.Name)
			.ToHashSet(StringComparer.OrdinalIgnoreCase);
}