// <copyright file="IModifiableEntity.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Entities;

/// <summary>Entity with create + modify timestamps.</summary>
public interface IModifiableEntity : IEntity
{
	public DateTime CreateDate { get; set; }

	public DateTime? ModifyDate { get; set; }
}