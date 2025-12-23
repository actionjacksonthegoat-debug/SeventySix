// <copyright file="EmailRateLimitException.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Exceptions;

namespace SeventySix.ElectronicNotifications.Emails;

/// <summary>
/// Exception thrown when email sending is blocked due to rate limiting.
/// </summary>
public class EmailRateLimitException : DomainException
{
	/// <summary>
	/// Gets the time until the rate limit resets.
	/// </summary>
	public TimeSpan TimeUntilReset { get; }

	/// <summary>
	/// Gets the remaining quota (should be 0 when this exception is thrown).
	/// </summary>
	public int RemainingQuota { get; }

	/// <summary>
	/// Initializes a new instance of the <see cref="EmailRateLimitException"/> class.
	/// </summary>
	public EmailRateLimitException()
		: base("Email daily limit exceeded.") { }

	/// <summary>
	/// Initializes a new instance of the <see cref="EmailRateLimitException"/> class.
	/// </summary>
	/// <param name="timeUntilReset">
	/// Time until rate limit resets.
	/// </param>
	/// <param name="remainingQuota">
	/// Current remaining quota.
	/// </param>
	public EmailRateLimitException(TimeSpan timeUntilReset, int remainingQuota)
		: base(
			$"Email daily limit exceeded. Resets in: {timeUntilReset:hh\\:mm\\:ss}")
	{
		TimeUntilReset = timeUntilReset;
		RemainingQuota = remainingQuota;
	}

	/// <summary>
	/// Initializes a new instance of the <see cref="EmailRateLimitException"/> class.
	/// </summary>
	/// <param name="message">
	/// The error message.
	/// </param>
	/// <param name="innerException">
	/// The inner exception.
	/// </param>
	public EmailRateLimitException(string message, Exception innerException)
		: base(message, innerException) { }
}