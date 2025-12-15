// <copyright file="SecurityRole.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Entities;

namespace SeventySix.Identity;

/// <summary>
/// Security role definition for RBAC.
/// Normalized lookup table replacing string-based roles.
/// </summary>
/// <remarks>
/// Design Principles:
/// - KISS: Simple role lookup without complex permission hierarchy
/// - DRY: Single source of truth for role names (replaces RoleConstants duplication)
/// - Referential Integrity: FK constraints prevent invalid role assignments
///
/// Standard roles: User, Developer, Admin
/// </remarks>
public class SecurityRole : ICreatableEntity
{
	/// <summary>Gets or sets the unique identifier.</summary>
	public int Id
	{
		get; set;
	}

	/// <summary>Gets or sets the role name (e.g., "Admin", "Developer", "User").</summary>
	public string Name { get; set; } = string.Empty;

	/// <summary>Gets or sets the role description.</summary>
	public string? Description
	{
		get; set;
	}

	/// <summary>Gets or sets whether this role can be assigned to users.</summary>
	public bool IsActive { get; set; } = true;

	/// <summary>Gets or sets the creation timestamp.</summary>
	public DateTime CreateDate
	{
		get; set;
	}
}