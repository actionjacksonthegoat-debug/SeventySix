// <copyright file="ConcurrencyException.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared;

/// <summary>
/// Exception thrown when a concurrency conflict is detected during an update operation.
/// Represents optimistic concurrency control violations (lost update scenario).
/// </summary>
/// <remarks>
/// This exception is thrown when an entity update fails because another user/process
/// modified the entity after it was retrieved for update. Uses RowVersion for detection.
///
/// Optimistic Concurrency Control:
/// - Client retrieves entity with RowVersion
/// - Client modifies entity locally
/// - Client attempts to save with original RowVersion
/// - If RowVersion changed in database, this exception is thrown
/// - Client must refresh entity and retry update
///
/// When to Use:
/// - User update fails due to concurrent modification
/// - RowVersion mismatch detected
/// - DbUpdateConcurrencyException caught and wrapped
///
/// When NOT to Use:
/// - Validation failures (use FluentValidation)
/// - Business rule violations (use BusinessRuleViolationException)
/// - Entity not found (use UserNotFoundException)
///
/// HTTP Mapping:
/// - Maps to 409 Conflict in GlobalExceptionMiddleware
/// - Standard HTTP status for "update conflict"
///
/// Usage Example:
/// <code>
/// try
/// {
///     await _repository.UpdateAsync(user, cancellationToken);
/// }
/// catch (DbUpdateConcurrencyException ex)
/// {
///     throw new ConcurrencyException(
///         "User was modified by another user. Please refresh and try again.", ex);
/// }
/// </code>
///
/// Client Handling:
/// - Display error message to user
/// - Refresh entity from server (get latest version)
/// - Show user both versions (theirs vs. current)
/// - Allow user to reapply changes or discard
/// </remarks>
public class ConcurrencyException : DomainException
{
	/// <summary>
	/// Initializes a new instance of the <see cref="ConcurrencyException"/> class with a default message.
	/// </summary>
	/// <remarks>
	/// Use this constructor when you want a generic "concurrency conflict" message.
	/// Consider using the overload with specific message for better error information.
	/// </remarks>
	public ConcurrencyException()
		: base("The entity was modified by another user. Please refresh and try again.")
	{
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="ConcurrencyException"/> class
	/// with a specific error message.
	/// </summary>
	/// <param name="message">A custom error message describing the concurrency conflict.</param>
	/// <remarks>
	/// Preferred constructor for most cases as it provides specific, actionable error information.
	/// Example messages:
	/// - "User was modified by another user. Please refresh and try again."
	/// - "The user you are trying to update has been changed. Please reload the page."
	/// - "Concurrency conflict detected. Another user saved changes to this record."
	/// </remarks>
	public ConcurrencyException(string message)
		: base(message)
	{
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="ConcurrencyException"/> class
	/// with a specific error message and inner exception.
	/// </summary>
	/// <param name="message">A custom error message describing the concurrency conflict.</param>
	/// <param name="innerException">The exception that caused this concurrency exception.</param>
	/// <remarks>
	/// Use this constructor when wrapping DbUpdateConcurrencyException or other concurrency-related exceptions.
	/// Preserves the full exception stack for logging and debugging.
	/// The inner exception typically contains details about which entity and row version failed.
	/// </remarks>
	public ConcurrencyException(string message, Exception innerException)
		: base(message, innerException)
	{
	}
}