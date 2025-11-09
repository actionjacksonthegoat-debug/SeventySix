// <copyright file="DomainException.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Domain.Exceptions;

/// <summary>
/// Base exception for domain-related errors.
/// </summary>
public abstract class DomainException : Exception
{
	/// <summary>
	/// Initializes a new instance of the <see cref="DomainException"/> class.
	/// </summary>
	protected DomainException()
	{
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="DomainException"/> class.
	/// </summary>
	/// <param name="message">Exception message.</param>
	protected DomainException(string message)
		: base(message)
	{
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="DomainException"/> class.
	/// </summary>
	/// <param name="message">Exception message.</param>
	/// <param name="innerException">Inner exception.</param>
	protected DomainException(string message, Exception innerException)
		: base(message, innerException)
	{
	}
}
