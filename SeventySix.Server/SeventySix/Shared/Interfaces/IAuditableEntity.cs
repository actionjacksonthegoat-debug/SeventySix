// <copyright file="IAuditableEntity.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared;

/// <summary>
/// Entity with full audit tracking (create + modify timestamps and user tracking).
/// Currently only used by User entity.
/// </summary>
public interface IAuditableEntity : IModifiableEntity
{
	/// <summary>
	/// Gets or sets the username or identifier of who created this entity.
	/// </summary>
	public string CreatedBy
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the username or identifier of who last modified this entity.
	/// </summary>
	public string ModifiedBy
	{
		get; set;
	}
}
