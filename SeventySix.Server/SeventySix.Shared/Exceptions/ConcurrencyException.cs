// <copyright file="ConcurrencyException.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Exceptions;

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
/// HTTP Mapping:
/// - Maps to 409 Conflict in GlobalExceptionMiddleware
/// </remarks>
public class ConcurrencyException : DomainException
{
	/// <summary>
	/// Initializes a new instance of the <see cref="ConcurrencyException"/> class with a default message.
	/// </summary>
	public ConcurrencyException()
		: base("The entity was modified by another user. Please refresh and try again.")
	{
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="ConcurrencyException"/> class
	/// with a specific error message.
	/// </summary>
	/// <param name="message">A custom error message describing the concurrency conflict.</param>
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
	public ConcurrencyException(
		string message,
		Exception innerException)
		: base(
			message,
			innerException)
	{
	}
}