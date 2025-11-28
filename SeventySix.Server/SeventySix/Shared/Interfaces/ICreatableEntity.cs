// <copyright file="ICreatableEntity.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared;

/// <summary>Entity with creation timestamp only.</summary>
public interface ICreatableEntity : IEntity
{
	DateTime CreateDate
	{
		get; set;
	}
}
