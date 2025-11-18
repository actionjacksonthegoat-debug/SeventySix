// <copyright file="DuplicateUserException.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Application.Exceptions;

/// <summary>
/// Exception thrown when attempting to create or update a user with duplicate unique values.
/// Represents violations of username or email uniqueness constraints.
/// </summary>
/// <remarks>
/// This exception is thrown when a user operation would violate uniqueness business rules.
/// It typically occurs during user creation or update when username/email already exists.
///
/// When to Use:
/// - Creating a user with an existing username
/// - Creating a user with an existing email
/// - Updating a user to use an existing username
/// - Updating a user to use an existing email
///
/// When NOT to Use:
/// - Database-level constraint violations (catch DbUpdateException instead)
/// - Other validation failures (use FluentValidation)
/// - Business rule violations unrelated to uniqueness
///
/// HTTP Mapping:
/// - Maps to 409 Conflict in GlobalExceptionMiddleware
/// - Standard HTTP status for "resource already exists"
///
/// Usage Example:
/// <code>
/// if (await _repository.UsernameExistsAsync(request.Username, excludeId, cancellationToken))
/// {
///     throw new DuplicateUserException($"Username '{request.Username}' already exists");
/// }
/// </code>
/// </remarks>
public class DuplicateUserException : DomainException
{
	/// <summary>
	/// Initializes a new instance of the <see cref="DuplicateUserException"/> class with a default message.
	/// </summary>
	/// <remarks>
	/// Use this constructor when you want a generic "duplicate user" message.
	/// Consider using the overload with specific message for better error information.
	/// </remarks>
	public DuplicateUserException()
		: base("A user with the specified username or email already exists.")
	{
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="DuplicateUserException"/> class
	/// with a specific error message.
	/// </summary>
	/// <param name="message">A custom error message describing the duplicate constraint.</param>
	/// <remarks>
	/// Preferred constructor for most cases as it provides specific, actionable error information.
	/// Example messages:
	/// - "Username 'johndoe' already exists."
	/// - "Email 'john@example.com' already exists."
	/// - "A user with username 'johndoe' or email 'john@example.com' already exists."
	/// </remarks>
	public DuplicateUserException(string message)
		: base(message)
	{
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="DuplicateUserException"/> class
	/// with a specific error message and inner exception.
	/// </summary>
	/// <param name="message">A custom error message describing the duplicate constraint.</param>
	/// <param name="innerException">The exception that caused this duplicate user exception.</param>
	/// <remarks>
	/// Use this constructor when wrapping database constraint violations or other lower-level exceptions.
	/// Preserves the full exception stack for logging and debugging.
	/// Example: Wrapping DbUpdateException for unique constraint violations.
	/// </remarks>
	public DuplicateUserException(string message, Exception innerException)
		: base(message, innerException)
	{
	}
}
