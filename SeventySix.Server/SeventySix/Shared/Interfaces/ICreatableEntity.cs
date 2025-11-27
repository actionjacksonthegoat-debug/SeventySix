// <copyright file="ICreatableEntity.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared;

/// <summary>
/// Entity with creation timestamp only (no modify tracking, no user tracking).
/// CreateDate is auto-set to NOW() if not provided.
/// </summary>
public interface ICreatableEntity : IEntity
{
	/// <summary>
	/// Gets or sets the date and time when the entity was created.
	/// </summary>
	public DateTime CreateDate
	{
		get; set;
	}
}
