// <copyright file="PermissionRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Entities;

namespace SeventySix.Identity;

/// <summary>
/// Represents a user's request for elevated permissions.
/// </summary>
/// <remarks>
/// Design Principles:
/// - DRY: RequestedRoleId FK to Roles (single source of truth)
/// - Referential Integrity: FK constraint prevents invalid role requests
/// </remarks>
public class PermissionRequest : ICreatableEntity
{
	/// <summary>
	/// Gets or sets the unique identifier.
	/// </summary>
	public long Id { get; set; }

	/// <summary>
	/// Gets or sets the requesting user's ID.
	/// </summary>
	public long UserId { get; set; }

	/// <summary>
	/// Gets or sets the requesting user.
	/// </summary>
	public ApplicationUser? User { get; set; }

	/// <summary>
	/// Gets or sets the requested role ID (FK to Roles).
	/// </summary>
	public long RequestedRoleId { get; set; }

	/// <summary>
	/// Gets or sets the requested role (navigation property).
	/// </summary>
	public ApplicationRole? RequestedRole { get; set; }

	/// <summary>
	/// Gets or sets the optional request message.
	/// </summary>
	public string? RequestMessage { get; set; }

	/// <summary>
	/// Gets or sets who created this request (username).
	/// </summary>
	public string CreatedBy { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the creation timestamp.
	/// </summary>
	public DateTime CreateDate { get; set; }
}