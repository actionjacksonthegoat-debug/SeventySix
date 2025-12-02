// <copyright file="UserRole.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared;

namespace SeventySix.Identity;

/// <summary>
/// User role assignment for authorization.
/// </summary>
/// <remarks>
/// Design Principles:
/// - KISS: Simple role assignment without complex permission hierarchy
/// - Roles stored as string values for flexibility
/// - Standard roles: "User", "Admin", "Developer"
/// - Implements IAuditableEntity for audit tracking
/// - CreatedBy/CreateDate are nullable for whitelisted auto-approvals.
/// </remarks>
public class UserRole : IAuditableEntity
{
	/// <summary>Gets or sets the unique identifier.</summary>
	public int Id
	{
		get; set;
	}

	/// <summary>Gets or sets the user ID (FK to identity.users).</summary>
	public int UserId
	{
		get; set;
	}

	/// <summary>Gets or sets the role name.</summary>
	public string Role { get; set; } = string.Empty;

	/// <summary>Gets or sets when this role was created (null for whitelisted).</summary>
	public DateTime CreateDate
	{
		get; set;
	}

	/// <summary>Gets or sets when this role was last modified.</summary>
	public DateTime? ModifyDate
	{
		get; set;
	}

	/// <summary>Gets or sets who created this role (empty for whitelisted auto-approval).</summary>
	public string CreatedBy { get; set; } = string.Empty;

	/// <summary>Gets or sets who last modified this role.</summary>
	public string ModifiedBy { get; set; } = string.Empty;
}