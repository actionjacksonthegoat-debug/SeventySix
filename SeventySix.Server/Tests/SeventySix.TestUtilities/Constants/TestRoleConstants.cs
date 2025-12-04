// <copyright file="TestRoleConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.TestUtilities.Constants;

/// <summary>
/// Role constants for test data creation.
/// Mirrors RoleConstants but in test utilities for test isolation.
/// </summary>
public static class TestRoleConstants
{
	/// <summary>Developer role name.</summary>
	public const string Developer = "Developer";

	/// <summary>Admin role name.</summary>
	public const string Admin = "Admin";

	/// <summary>User role name (default role).</summary>
	public const string User = "User";

	/// <summary>All available roles.</summary>
	public static readonly string[] AllRoles =
		[Developer, Admin, User];

	/// <summary>Roles that can be requested by users.</summary>
	public static readonly string[] RequestableRoles =
		[Developer, Admin];
}
