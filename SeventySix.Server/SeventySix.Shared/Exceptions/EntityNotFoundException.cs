// <copyright file="EntityNotFoundException.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Exceptions;

/// <summary>
/// Exception thrown when a requested entity cannot be found in the repository.
/// Represents failures to locate domain entities by their identifiers or other criteria.
/// </summary>
/// <remarks>
/// This exception is the domain layer's way of communicating that an entity doesn't exist.
/// It provides a semantic meaning that's more specific than returning null.
///
/// HTTP Mapping:
/// - Maps to 404 Not Found in GlobalExceptionHandler
/// </remarks>
public class EntityNotFoundException : DomainException
{
	/// <summary>
	/// Initializes a new instance of the <see cref="EntityNotFoundException"/> class with a default message.
	/// </summary>
	public EntityNotFoundException()
		: base("The requested entity was not found.") { }

	/// <summary>
	/// Initializes a new instance of the <see cref="EntityNotFoundException"/> class
	/// with specific entity information.
	/// </summary>
	/// <param name="entityName">
	/// The name of the entity type that wasn't found.
	/// </param>
	/// <param name="entityId">
	/// The identifier value that was used in the failed lookup.
	/// </param>
	public EntityNotFoundException(string entityName, object entityId)
		: base($"{entityName} with id '{entityId}' was not found.")
	{
		EntityName = entityName;
		EntityId = entityId;
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="EntityNotFoundException"/> class with a custom message.
	/// </summary>
	/// <param name="message">
	/// A custom error message describing what wasn't found.
	/// </param>
	public EntityNotFoundException(string message)
		: base(message) { }

	/// <summary>
	/// Gets the name of the entity type that was not found.
	/// </summary>
	public string? EntityName { get; }

	/// <summary>
	/// Gets the identifier that was used in the failed entity lookup.
	/// </summary>
	public object? EntityId { get; }
}