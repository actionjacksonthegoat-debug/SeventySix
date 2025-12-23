// <copyright file="BusinessRuleViolationException.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Exceptions;

/// <summary>
/// Exception thrown when a business rule is violated.
/// </summary>
/// <remarks>
/// Used to signal business logic validation failures that are not covered by input validation.
/// Examples: Cannot delete active entity, insufficient balance, etc.
/// </remarks>
public class BusinessRuleViolationException : DomainException
{
	/// <summary>
	/// Initializes a new instance of the <see cref="BusinessRuleViolationException"/> class.
	/// </summary>
	public BusinessRuleViolationException()
		: base("A business rule was violated.") { }

	/// <summary>
	/// Initializes a new instance of the <see cref="BusinessRuleViolationException"/> class with a specified error message.
	/// </summary>
	/// <param name="message">
	/// The message that describes the error.
	/// </param>
	public BusinessRuleViolationException(string message)
		: base(message) { }

	/// <summary>
	/// Initializes a new instance of the <see cref="BusinessRuleViolationException"/> class with a specified error message and inner exception.
	/// </summary>
	/// <param name="message">
	/// The message that describes the error.
	/// </param>
	/// <param name="innerException">
	/// The exception that is the cause of the current exception.
	/// </param>
	public BusinessRuleViolationException(
		string message,
		Exception innerException)
		: base(message, innerException) { }
}