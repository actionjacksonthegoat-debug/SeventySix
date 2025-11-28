// <copyright file="IModifiableEntity.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared;

/// <summary>Entity with create + modify timestamps.</summary>
public interface IModifiableEntity : IEntity
{
	DateTime CreateDate
	{
		get; set;
	}

	DateTime? ModifyDate
	{
		get; set;
	}
}
