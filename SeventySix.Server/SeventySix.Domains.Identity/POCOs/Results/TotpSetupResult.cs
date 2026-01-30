// <copyright file="TotpSetupResult.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Result of TOTP setup operation.
/// </summary>
/// <param name="Success">
/// Whether the operation succeeded.
/// </param>
/// <param name="Secret">
/// The base32-encoded TOTP secret (null on failure).
/// </param>
/// <param name="QrCodeUri">
/// The otpauth:// URI for QR code generation (null on failure).
/// </param>
/// <param name="Error">
/// Error message (null on success).
/// </param>
/// <param name="ErrorCode">
/// Error code for client handling (null on success).
/// </param>
public record TotpSetupResult(
	bool Success,
	string? Secret = null,
	string? QrCodeUri = null,
	string? Error = null,
	string? ErrorCode = null)
{
	/// <summary>
	/// Creates a successful TOTP setup result.
	/// </summary>
	/// <param name="secret">
	/// The base32-encoded TOTP secret.
	/// </param>
	/// <param name="qrCodeUri">
	/// The otpauth:// URI for QR code generation.
	/// </param>
	/// <returns>
	/// A successful result with setup information.
	/// </returns>
	public static TotpSetupResult Succeeded(
		string secret,
		string qrCodeUri) =>
		new(
			Success: true,
			Secret: secret,
			QrCodeUri: qrCodeUri);

	/// <summary>
	/// Creates a failed TOTP setup result.
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
	public static TotpSetupResult Failed(
		string error,
		string? errorCode = null) =>
		new(
			Success: false,
			Error: error,
			ErrorCode: errorCode);
}