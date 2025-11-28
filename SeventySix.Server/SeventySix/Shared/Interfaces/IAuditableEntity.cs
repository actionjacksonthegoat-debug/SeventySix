// <copyright file="IAuditableEntity.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared;

/// <summary>Entity with full audit tracking (create + modify timestamps and user info).</summary>
public interface IAuditableEntity : IModifiableEntity
{
	string CreatedBy
	{
		get; set;
	}

	string ModifiedBy
	{
		get; set;
	}
}
