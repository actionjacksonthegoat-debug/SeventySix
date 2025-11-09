// <copyright file="EntityNotFoundException.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Domain.Exceptions;

/// <summary>
/// Exception thrown when an entity is not found.
/// </summary>
public class EntityNotFoundException : DomainException
{
	/// <summary>
	/// Initializes a new instance of the <see cref="EntityNotFoundException"/> class.
	/// </summary>
	public EntityNotFoundException()
		: base("The requested entity was not found.")
	{
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="EntityNotFoundException"/> class.
	/// </summary>
	/// <param name="entityName">Name of the entity.</param>
	/// <param name="entityId">Identifier of the entity.</param>
	public EntityNotFoundException(string entityName, object entityId)
		: base($"{entityName} with id '{entityId}' was not found.")
	{
		EntityName = entityName;
		EntityId = entityId;
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="EntityNotFoundException"/> class.
	/// </summary>
	/// <param name="message">Custom error message.</param>
	public EntityNotFoundException(string message)
		: base(message)
	{
	}

	/// <summary>
	/// Gets the name of the entity.
	/// </summary>
	public string? EntityName
	{
		get;
	}

	/// <summary>
	/// Gets the entity identifier.
	/// </summary>
	public object? EntityId
	{
		get;
	}
}
