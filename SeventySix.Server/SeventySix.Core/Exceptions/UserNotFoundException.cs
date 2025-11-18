// <copyright file="UserNotFoundException.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Core.Exceptions;

/// <summary>
/// Exception thrown when a requested User entity cannot be found in the repository.
/// Represents failures to locate users by their identifiers or other criteria.
/// </summary>
/// <remarks>
/// This exception is a domain-specific variant of EntityNotFoundException for User entities.
/// It provides semantic meaning specific to user management operations.
///
/// When to Use:
/// - User lookup by ID fails
/// - User lookup by username fails
/// - User lookup by email fails
/// - Required user is missing for an operation
///
/// When NOT to Use:
/// - Use null returns in repositories (this is thrown in service layer)
/// - Optional user lookups where absence is valid
/// - User list queries that return empty results
///
/// HTTP Mapping:
/// - Maps to 404 Not Found in GlobalExceptionMiddleware
/// - Standard HTTP status for "user not found"
///
/// Usage Example:
/// <code>
/// var user = await _repository.GetByIdAsync(id, cancellationToken);
/// if (user is null)
/// {
///     throw new UserNotFoundException(id);
/// }
/// </code>
/// </remarks>
public class UserNotFoundException : EntityNotFoundException
{
	/// <summary>
	/// Initializes a new instance of the <see cref="UserNotFoundException"/> class with a default message.
	/// </summary>
	/// <remarks>
	/// Use this constructor when you want a generic "user not found" message.
	/// Consider using the overload with user ID for better error messages.
	/// </remarks>
	public UserNotFoundException()
		: base("User", "unknown")
	{
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="UserNotFoundException"/> class
	/// with specific user identifier.
	/// </summary>
	/// <param name="userId">The user identifier that was used in the failed lookup.</param>
	/// <remarks>
	/// Preferred constructor for most cases as it provides specific, actionable error information.
	/// Example message: "User with id '123' was not found."
	/// </remarks>
	public UserNotFoundException(int userId)
		: base("User", userId)
	{
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="UserNotFoundException"/> class with a custom message.
	/// </summary>
	/// <param name="message">A custom error message describing what wasn't found.</param>
	/// <remarks>
	/// Use this constructor when the default message format doesn't fit your scenario.
	/// For example, when looking up by username or email:
	/// "User with username 'johndoe' was not found."
	/// </remarks>
	public UserNotFoundException(string message)
		: base(message)
	{
	}
}
