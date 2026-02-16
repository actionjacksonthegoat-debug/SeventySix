// <copyright file="ISoftDeletable.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Entities;

/// <summary>
/// Interface for entities supporting soft delete.
/// Entities implementing this will have automatic query filtering applied.
/// </summary>
/// <remarks>
/// Soft delete allows logical deletion without physically removing records.
/// Query filters should be applied in DbContext.OnModelCreating to exclude
/// deleted entities from normal queries.
/// </remarks>
public interface ISoftDeletable
{
	/// <summary>
	/// Gets or sets whether the entity is soft deleted.
	/// </summary>
	public bool IsDeleted { get; set; }

	/// <summary>
	/// Gets or sets when the entity was deleted.
	/// </summary>
	public DateTimeOffset? DeletedAt { get; set; }

	/// <summary>
	/// Gets or sets who deleted the entity.
	/// </summary>
	public string? DeletedBy { get; set; }
}