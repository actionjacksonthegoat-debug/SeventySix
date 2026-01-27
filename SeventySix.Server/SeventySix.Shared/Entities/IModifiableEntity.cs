// <copyright file="IModifiableEntity.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Entities;

/// <summary>
/// Entity with create and modify timestamps.
/// </summary>
/// <remarks>
/// Extends <see cref="ICreatableEntity"/> with modification tracking.
/// </remarks>
public interface IModifiableEntity : ICreatableEntity
{
	/// <summary>
	/// Gets or sets the modification timestamp for the entity.
	/// </summary>
	/// <remarks>
	/// Null when entity has never been modified. Stored in UTC.
	/// </remarks>
	public DateTime? ModifyDate { get; set; }
}