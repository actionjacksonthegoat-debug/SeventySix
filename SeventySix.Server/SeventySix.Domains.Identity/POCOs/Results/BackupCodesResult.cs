// <copyright file="BackupCodesResult.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Result containing generated backup codes.
/// </summary>
/// <param name="Success">
/// Whether the operation succeeded.
/// </param>
/// <param name="Codes">
/// The generated backup codes (shown to user once only).
/// </param>
/// <param name="Error">
/// Error message (null on success).
/// </param>
/// <param name="ErrorCode">
/// Error code for client handling (null on success).
/// </param>
public record BackupCodesResult(
	bool Success,
	IReadOnlyList<string>? Codes = null,
	string? Error = null,
	string? ErrorCode = null)
{
	/// <summary>
	/// Creates a successful backup codes result.
	/// </summary>
	/// <param name="codes">
	/// The generated backup codes.
	/// </param>
	/// <returns>
	/// A successful result with backup codes.
	/// </returns>
	public static BackupCodesResult Succeeded(IReadOnlyList<string> codes) =>
		new(
			Success: true,
			Codes: codes);

	/// <summary>
	/// Creates a failed backup codes result.
	/// </summary>
	/// <param name="error">
	/// Error message.
	/// </param>
	/// <param name="errorCode">
	/// Error code for client handling.
	/// </param>
	/// <returns>
	/// A failure result with error details.
	/// </returns>
	public static BackupCodesResult Failed(
		string error,
		string? errorCode = null) =>
		new(
			Success: false,
			Error: error,
			ErrorCode: errorCode);
}