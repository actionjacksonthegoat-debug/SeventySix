// <copyright file="IMfaAttemptTracker.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Tracks per-user MFA verification attempts to prevent brute-force attacks
/// on TOTP codes and backup codes.
/// </summary>
/// <remarks>
/// Email-based MFA uses the <see cref="MfaChallenge"/> entity for attempt tracking.
/// TOTP and backup codes have no challenge entity, so this in-memory tracker
/// provides the same protection with TTL-based automatic expiry.
/// </remarks>
public interface IMfaAttemptTracker
{
	/// <summary>
	/// Determines whether a user is locked out for the specified attempt type.
	/// </summary>
	///
	/// <param name="userId">
	/// The user to check.
	/// </param>
	/// <param name="attemptType">
	/// The type of MFA attempt (e.g., "totp", "backup").
	/// </param>
	///
	/// <returns>
	/// True if the user has exceeded the maximum allowed attempts.
	/// </returns>
	public bool IsLockedOut(
		long userId,
		string attemptType);

	/// <summary>
	/// Records a failed verification attempt for the user.
	/// </summary>
	///
	/// <param name="userId">
	/// The user who failed verification.
	/// </param>
	/// <param name="attemptType">
	/// The type of MFA attempt (e.g., "totp", "backup").
	/// </param>
	public void RecordFailedAttempt(
		long userId,
		string attemptType);

	/// <summary>
	/// Resets the attempt counter after successful verification.
	/// </summary>
	///
	/// <param name="userId">
	/// The user who succeeded.
	/// </param>
	/// <param name="attemptType">
	/// The type of MFA attempt (e.g., "totp", "backup").
	/// </param>
	public void ResetAttempts(
		long userId,
		string attemptType);
}