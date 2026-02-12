// <copyright file="MfaChallengeValidationResult.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Result of validating an MFA challenge token (without verifying the MFA code).
/// Used by TOTP and backup code flows to confirm prior password authentication.
/// </summary>
/// <param name="Success">
/// Whether the challenge token is valid.
/// </param>
/// <param name="UserId">
/// The user ID associated with the challenge (0 if invalid).
/// </param>
/// <param name="Error">
/// Error message if validation failed.
/// </param>
/// <param name="ErrorCode">
/// Error code for client handling.
/// </param>
public record MfaChallengeValidationResult(
	bool Success,
	long UserId,
	string? Error = null,
	string? ErrorCode = null)
{
	/// <summary>
	/// Creates a successful validation result.
	/// </summary>
	/// <param name="userId">
	/// The verified user's ID.
	/// </param>
	/// <returns>
	/// Success result with user ID.
	/// </returns>
	public static MfaChallengeValidationResult Succeeded(long userId) =>
		new(
			Success: true,
			UserId: userId);

	/// <summary>
	/// Creates a failed validation result.
	/// </summary>
	/// <param name="error">
	/// Error message.
	/// </param>
	/// <param name="errorCode">
	/// Error code.
	/// </param>
	/// <returns>
	/// Failure result with error details.
	/// </returns>
	public static MfaChallengeValidationResult Failed(
		string error,
		string errorCode) =>
		new(
			Success: false,
			UserId: 0,
			Error: error,
			ErrorCode: errorCode);
}