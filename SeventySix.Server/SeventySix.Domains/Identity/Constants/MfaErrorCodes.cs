// <copyright file="MfaErrorCodes.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Error codes for MFA-related failures.
/// </summary>
public static class MfaErrorCodes
{
	/// <summary>
	/// The verification code is invalid.
	/// </summary>
	public const string InvalidCode = "MFA_INVALID_CODE";

	/// <summary>
	/// The verification code has expired.
	/// </summary>
	public const string CodeExpired = "MFA_CODE_EXPIRED";

	/// <summary>
	/// Too many verification attempts.
	/// </summary>
	public const string TooManyAttempts = "MFA_TOO_MANY_ATTEMPTS";

	/// <summary>
	/// The challenge token is invalid or not found.
	/// </summary>
	public const string InvalidChallenge = "MFA_INVALID_CHALLENGE";

	/// <summary>
	/// The challenge has already been used.
	/// </summary>
	public const string ChallengeUsed = "MFA_CHALLENGE_USED";

	/// <summary>
	/// Resend request too soon (cooldown not elapsed).
	/// </summary>
	public const string ResendCooldown = "MFA_RESEND_COOLDOWN";
}