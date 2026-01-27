// <copyright file="MfaConstants.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Constants for MFA functionality.
/// </summary>
public static class MfaConstants
{
	/// <summary>
	/// Default verification code length.
	/// </summary>
	public const int DefaultCodeLength = 6;

	/// <summary>
	/// Default code expiration in minutes.
	/// </summary>
	public const int DefaultCodeExpirationMinutes = 5;

	/// <summary>
	/// Default maximum verification attempts.
	/// </summary>
	public const int DefaultMaxAttempts = 5;

	/// <summary>
	/// Default cooldown between resend requests in seconds.
	/// </summary>
	public const int DefaultResendCooldownSeconds = 60;
}