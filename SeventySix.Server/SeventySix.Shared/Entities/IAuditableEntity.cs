// <copyright file="IAuditableEntity.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Entities;

/// <summary>Entity with full audit tracking (create + modify timestamps and user info).</summary>
public interface IAuditableEntity : IModifiableEntity
{
	public string CreatedBy { get; set; }

	public string ModifiedBy { get; set; }
}
