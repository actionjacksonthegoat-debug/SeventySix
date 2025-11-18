// <copyright file="DomainException.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Application.Exceptions;

/// <summary>
/// Base exception class for all domain-specific errors.
/// Serves as the root of the domain exception hierarchy.
/// </summary>
/// <remarks>
/// This abstract exception class implements a custom exception hierarchy for the domain layer,
/// following Clean Architecture principles where the domain defines its own errors.
///
/// Design Principles:
/// - Single Responsibility: Represents domain-level errors only
/// - Open/Closed: Open for extension via derived classes, closed for modification
/// - Domain Independence: No dependencies on framework or infrastructure
///
/// Exception Hierarchy:
/// <code>
/// DomainException (abstract)
/// ├── EntityNotFoundException (entity not found in repository)
/// ├── BusinessRuleViolationException (business rule failures)
/// └── [Add more specific exceptions as needed]
/// </code>
///
/// Usage:
/// - Never throw DomainException directly (it's abstract)
/// - Create specific derived exceptions for different domain errors
/// - Catch DomainException to handle all domain errors generically
/// - GlobalExceptionMiddleware maps these to appropriate HTTP responses
///
/// Mapping to HTTP:
/// - DomainException → 400 Bad Request (generic)
/// - EntityNotFoundException → 404 Not Found
/// - BusinessRuleViolationException → 422 Unprocessable Entity
/// </remarks>
public abstract class DomainException : Exception
{
	/// <summary>
	/// Initializes a new instance of the <see cref="DomainException"/> class.
	/// </summary>
	/// <remarks>
	/// Default constructor for derived classes.
	/// Typically used when derived class provides its own default message.
	/// </remarks>
	protected DomainException()
	{
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="DomainException"/> class with a specified error message.
	/// </summary>
	/// <param name="message">The message that describes the error.</param>
	/// <remarks>
	/// Use this constructor to provide a descriptive error message for the domain error.
	/// The message should be user-friendly as it may be returned in API responses.
	/// </remarks>
	protected DomainException(string message)
		: base(message)
	{
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="DomainException"/> class with a specified error message
	/// and a reference to the inner exception that is the cause of this exception.
	/// </summary>
	/// <param name="message">The message that describes the error.</param>
	/// <param name="innerException">
	/// The exception that is the cause of the current exception, or null if no inner exception is specified.
	/// </param>
	/// <remarks>
	/// Use this constructor when wrapping lower-level exceptions to maintain the exception chain.
	/// Preserves the full exception stack for logging and debugging.
	/// Example: Wrapping database exceptions or external service failures.
	/// </remarks>
	protected DomainException(string message, Exception innerException)
		: base(message, innerException)
	{
	}
}