// <copyright file="ICreatableEntity.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Entities;

/// <summary>Entity with creation timestamp only.</summary>
public interface ICreatableEntity : IEntity
{
	public DateTime CreateDate { get; set; }
}
