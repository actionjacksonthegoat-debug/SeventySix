// <copyright file="EntityNotFoundException.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.BusinessLogic.Exceptions;

/// <summary>
/// Exception thrown when a requested entity cannot be found in the repository.
/// Represents failures to locate domain entities by their identifiers or other criteria.
/// </summary>
/// <remarks>
/// This exception is the domain layer's way of communicating that an entity doesn't exist.
/// It provides a semantic meaning that's more specific than returning null.
///
/// When to Use:
/// - Entity lookup by ID fails
/// - Required entity is missing for an operation
/// - Referential integrity check fails (referenced entity doesn't exist)
///
/// When NOT to Use:
/// - Use null returns in repositories (this is thrown in service layer)
/// - Optional entity lookups where absence is valid
/// - Collection queries that return empty results
///
/// HTTP Mapping:
/// - Maps to 404 Not Found in GlobalExceptionMiddleware
/// - Standard HTTP status for "resource not found"
///
/// Usage Example:
/// <code>
/// var forecast = await _repository.GetByIdAsync(id, cancellationToken);
/// if (forecast is null)
/// {
///     throw new EntityNotFoundException(nameof(WeatherForecast), id);
/// }
/// </code>
///
/// Alternative Patterns:
/// - Result/Option types (Railway Oriented Programming)
/// - Specification pattern for complex queries
/// - Null Object pattern for default entities
/// </remarks>
public class EntityNotFoundException : DomainException
{
	/// <summary>
	/// Initializes a new instance of the <see cref="EntityNotFoundException"/> class with a default message.
	/// </summary>
	/// <remarks>
	/// Use this constructor when you want a generic "entity not found" message.
	/// Consider using the overload with entity name and ID for better error messages.
	/// </remarks>
	public EntityNotFoundException()
		: base("The requested entity was not found.")
	{
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="EntityNotFoundException"/> class
	/// with specific entity information.
	/// </summary>
	/// <param name="entityName">The name of the entity type that wasn't found (e.g., "WeatherForecast").</param>
	/// <param name="entityId">The identifier value that was used in the failed lookup.</param>
	/// <remarks>
	/// Preferred constructor for most cases as it provides specific, actionable error information.
	/// Example message: "WeatherForecast with id '123' was not found."
	/// The entityId can be any type (int, string, Guid, etc.)
	/// </remarks>
	public EntityNotFoundException(string entityName, object entityId)
		: base($"{entityName} with id '{entityId}' was not found.")
	{
		EntityName = entityName;
		EntityId = entityId;
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="EntityNotFoundException"/> class with a custom message.
	/// </summary>
	/// <param name="message">A custom error message describing what wasn't found.</param>
	/// <remarks>
	/// Use this constructor when the default message format doesn't fit your scenario.
	/// For example, when looking up by criteria other than ID:
	/// "WeatherForecast for date '2025-11-10' was not found."
	/// </remarks>
	public EntityNotFoundException(string message)
		: base(message)
	{
	}

	/// <summary>
	/// Gets the name of the entity type that was not found.
	/// </summary>
	/// <value>
	/// The entity type name (e.g., "WeatherForecast", "User"), or null if not specified.
	/// </value>
	/// <remarks>
	/// Useful for logging, metrics, and generic error handling.
	/// Allows distinguishing between different types of "not found" errors.
	/// </remarks>
	public string? EntityName
	{
		get;
	}

	/// <summary>
	/// Gets the identifier that was used in the failed entity lookup.
	/// </summary>
	/// <value>
	/// The ID value that was searched for, or null if not specified.
	/// Can be of any type (int, string, Guid, composite key, etc.)
	/// </value>
	/// <remarks>
	/// Preserves the lookup criteria for logging and debugging.
	/// Helps reconstruct what the user was trying to access.
	/// </remarks>
	public object? EntityId
	{
		get;
	}
}