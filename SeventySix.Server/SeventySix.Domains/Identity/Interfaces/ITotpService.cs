// <copyright file="ITotpService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Service for TOTP (Time-based One-Time Password) operations.
/// </summary>
public interface ITotpService
{
	/// <summary>
	/// Generates a new TOTP secret for enrollment.
	/// </summary>
	/// <returns>
	/// A base32-encoded 160-bit secret.
	/// </returns>
	public string GenerateSecret();

	/// <summary>
	/// Generates the otpauth:// URI for QR code display.
	/// </summary>
	/// <param name="secret">
	/// The base32-encoded TOTP secret.
	/// </param>
	/// <param name="userEmail">
	/// The user's email address for account identification.
	/// </param>
	/// <returns>
	/// A properly formatted otpauth:// URI.
	/// </returns>
	public string GenerateSetupUri(
		string secret,
		string userEmail);

	/// <summary>
	/// Verifies a TOTP code against a secret.
	/// </summary>
	/// <param name="secret">
	/// The base32-encoded TOTP secret.
	/// </param>
	/// <param name="code">
	/// The 6-digit code to verify.
	/// </param>
	/// <returns>
	/// True if the code is valid within the allowed time window.
	/// </returns>
	public bool VerifyCode(
		string secret,
		string code);
}