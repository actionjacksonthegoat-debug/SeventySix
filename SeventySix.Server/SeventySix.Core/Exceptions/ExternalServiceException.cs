// <copyright file="ExternalServiceException.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Core.Exceptions;

/// <summary>
/// Exception thrown when an external service call fails.
/// </summary>
/// <remarks>
/// Used to wrap exceptions from third-party API calls (OpenWeather, etc.).
/// Provides a consistent exception type for external service failures.
/// </remarks>
public class ExternalServiceException : Exception
{
	/// <summary>
	/// Initializes a new instance of the <see cref="ExternalServiceException"/> class.
	/// </summary>
	public ExternalServiceException()
		: base("An external service error occurred")
	{
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="ExternalServiceException"/> class.
	/// </summary>
	/// <param name="message">The error message.</param>
	public ExternalServiceException(string message)
		: base(message)
	{
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="ExternalServiceException"/> class.
	/// </summary>
	/// <param name="message">The error message.</param>
	/// <param name="innerException">The inner exception.</param>
	public ExternalServiceException(string message, Exception innerException)
		: base(message, innerException)
	{
	}
}
