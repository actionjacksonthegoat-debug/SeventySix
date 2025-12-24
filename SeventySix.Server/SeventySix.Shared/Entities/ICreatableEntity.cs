// <copyright file="ICreatableEntity.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Entities;

/// <summary>Entity with creation timestamp only.</summary>
public interface ICreatableEntity : IEntity
{
	/// <summary>
	/// Gets or sets the creation timestamp for the entity.
	/// </summary>
	/// <remarks>
	/// Stored in UTC.
	/// </remarks>
	public DateTime CreateDate { get; set; }
}