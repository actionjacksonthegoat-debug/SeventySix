// <copyright file="UserRole.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// User role assignment for authorization.
/// </summary>
/// <remarks>
/// Design Principles:
/// - KISS: Simple role assignment without complex permission hierarchy
/// - Roles stored as string values for flexibility
/// - Standard roles: "User", "Admin"
/// </remarks>
public class UserRole
{
	/// <summary>
	/// Gets or sets the unique identifier.
	/// </summary>
	public int Id
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the user ID (FK to identity.users).
	/// </summary>
	public int UserId
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the role name.
	/// </summary>
	public string Role { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets when this role was assigned.
	/// </summary>
	public DateTime AssignedAt
	{
		get; set;
	}
}