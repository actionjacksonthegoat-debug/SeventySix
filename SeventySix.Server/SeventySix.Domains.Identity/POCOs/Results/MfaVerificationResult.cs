// <copyright file="MfaVerificationResult.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Result of MFA code verification attempt.
/// </summary>
/// <param name="Success">
/// Whether verification succeeded.
/// </param>
/// <param name="UserId">
/// The user ID associated with the challenge.
/// </param>
/// <param name="Error">
/// Error message if verification failed.
/// </param>
/// <param name="ErrorCode">
/// Error code for client handling.
/// </param>
public record MfaVerificationResult(
	bool Success,
	long UserId,
	string? Error = null,
	string? ErrorCode = null)
{
	/// <summary>
	/// Creates a successful verification result.
	/// </summary>
	/// <param name="userId">
	/// The verified user's ID.
	/// </param>
	/// <returns>
	/// Success result.
	/// </returns>
	public static MfaVerificationResult Succeeded(long userId) =>
		new(
			Success: true,
			UserId: userId);

	/// <summary>
	/// Creates a failed verification result.
	/// </summary>
	/// <param name="userId">
	/// The user ID (0 if unknown).
	/// </param>
	/// <param name="error">
	/// Error message.
	/// </param>
	/// <param name="errorCode">
	/// Error code.
	/// </param>
	/// <returns>
	/// Failure result.
	/// </returns>
	public static MfaVerificationResult Failed(
		long userId,
		string error,
		string errorCode) =>
		new(
			Success: false,
			UserId: userId,
			Error: error,
			ErrorCode: errorCode);
}