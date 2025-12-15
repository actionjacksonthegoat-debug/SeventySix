// <copyright file="PermissionRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Entities;

namespace SeventySix.Identity;

/// <summary>Represents a user's request for elevated permissions.</summary>
/// <remarks>
/// Design Principles:
/// - DRY: RequestedRoleId FK to SecurityRoles (single source of truth)
/// - Referential Integrity: FK constraint prevents invalid role requests
/// </remarks>
public class PermissionRequest : ICreatableEntity
{
	/// <summary>Gets or sets the unique identifier.</summary>
	public int Id
	{
		get; set;
	}

	/// <summary>Gets or sets the requesting user's ID.</summary>
	public int UserId
	{
		get; set;
	}

	/// <summary>Gets or sets the requesting user.</summary>
	public User? User
	{
		get; set;
	}

	/// <summary>Gets or sets the requested role ID (FK to SecurityRoles).</summary>
	public int RequestedRoleId
	{
		get; set;
	}

	/// <summary>Gets or sets the requested role (navigation property).</summary>
	public SecurityRole? RequestedRole
	{
		get; set;
	}

	/// <summary>Gets or sets the optional request message.</summary>
	public string? RequestMessage
	{
		get; set;
	}

	/// <summary>Gets or sets who created this request (username).</summary>
	public string CreatedBy { get; set; } = string.Empty;

	/// <summary>Gets or sets the creation timestamp.</summary>
	public DateTime CreateDate
	{
		get; set;
	}
}