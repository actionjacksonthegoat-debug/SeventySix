// <copyright file="IModifiableEntity.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared;

/// <summary>
/// Entity with create + modify timestamps (no user tracking).
/// </summary>
public interface IModifiableEntity : IEntity
{
	/// <summary>
	/// Gets or sets the date and time when the entity was created.
	/// </summary>
	public DateTime CreateDate
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the date and time when the entity was last modified.
	/// Nullable because it's only set when entity is modified.
	/// </summary>
	public DateTime? ModifyDate
	{
		get; set;
	}
}
