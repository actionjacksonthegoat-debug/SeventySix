// <copyright file="ExternalServiceException.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared;

/// <summary>
/// Exception thrown when an external service fails or is unavailable.
/// </summary>
/// <remarks>
/// Used to signal failures when communicating with external APIs, databases, or services.
/// Indicates the failure is transient and retry may succeed.
/// </remarks>
public class ExternalServiceException : DomainException
{
	/// <summary>
	/// Initializes a new instance of the <see cref="ExternalServiceException"/> class.
	/// </summary>
	public ExternalServiceException()
		: base("An external service error occurred.")
	{
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="ExternalServiceException"/> class with a specified error message.
	/// </summary>
	/// <param name="message">The message that describes the error.</param>
	public ExternalServiceException(string message)
		: base(message)
	{
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="ExternalServiceException"/> class with a specified error message and inner exception.
	/// </summary>
	/// <param name="message">The message that describes the error.</param>
	/// <param name="innerException">The exception that is the cause of the current exception.</param>
	public ExternalServiceException(string message, Exception innerException)
		: base(message, innerException)
	{
	}
}
