// <copyright file="MfaChallengeRefreshResult.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Result of refreshing an MFA challenge (resending code).
/// </summary>
/// <param name="Success">
/// Whether the refresh succeeded.
/// </param>
/// <param name="UserId">
/// The user ID for the challenge.
/// </param>
/// <param name="Email">
/// The user's email address.
/// </param>
/// <param name="NewCode">
/// The newly generated verification code.
/// </param>
/// <param name="Error">
/// Error message if refresh failed.
/// </param>
/// <param name="ErrorCode">
/// Error code for client handling.
/// </param>
public record MfaChallengeRefreshResult(
	bool Success,
	long UserId = 0,
	string Email = "",
	string NewCode = "",
	string? Error = null,
	string? ErrorCode = null)
{
	/// <summary>
	/// Creates a successful refresh result.
	/// </summary>
	/// <param name="userId">
	/// The user's ID.
	/// </param>
	/// <param name="email">
	/// The user's email.
	/// </param>
	/// <param name="newCode">
	/// The new verification code.
	/// </param>
	/// <returns>
	/// Success result.
	/// </returns>
	public static MfaChallengeRefreshResult Succeeded(
		long userId,
		string email,
		string newCode) =>
		new(
			Success: true,
			UserId: userId,
			Email: email,
			NewCode: newCode);

	/// <summary>
	/// Creates a failed refresh result.
	/// </summary>
	/// <param name="error">
	/// Error message.
	/// </param>
	/// <param name="errorCode">
	/// Error code.
	/// </param>
	/// <returns>
	/// Failure result.
	/// </returns>
	public static MfaChallengeRefreshResult Failed(
		string error,
		string errorCode) =>
		new(
			Success: false,
			Error: error,
			ErrorCode: errorCode);
}