// <copyright file="DomainException.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Exceptions;

/// <summary>
/// Base exception for domain errors.
/// </summary>
public abstract class DomainException : Exception
{
	/// <summary>
	/// Initializes a new instance of the <see cref="DomainException"/> class with the specified message.
	/// </summary>
	/// <param name="message">
	/// The error message that explains the reason for the exception.
	/// </param>
	public DomainException(string message)
		: base(message) { }

	/// <summary>
	/// Initializes a new instance of the <see cref="DomainException"/> class with a specified
	/// error message and a reference to the inner exception that is the cause of this exception.
	/// </summary>
	/// <param name="message">
	/// The error message that explains the reason for the exception.
	/// </param>
	/// <param name="innerException">
	/// The exception that caused the current exception.
	/// </param>
	public DomainException(string message, Exception innerException)
		: base(message, innerException) { }
}