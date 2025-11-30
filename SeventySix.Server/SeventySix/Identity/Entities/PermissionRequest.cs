// <copyright file="PermissionRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared;

namespace SeventySix.Identity;

/// <summary>Represents a user's request for elevated permissions.</summary>
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

	/// <summary>Gets or sets the requested role name.</summary>
	public string RequestedRole { get; set; } = string.Empty;

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
