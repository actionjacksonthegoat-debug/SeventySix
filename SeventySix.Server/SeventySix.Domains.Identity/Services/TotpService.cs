// <copyright file="TotpService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Security.Cryptography;
using Microsoft.Extensions.Options;
using OtpNet;

namespace SeventySix.Identity;

/// <summary>
/// Service for TOTP (Time-based One-Time Password) operations.
/// </summary>
/// <param name="settings">
/// TOTP configuration settings.
/// </param>
public sealed class TotpService(IOptions<TotpSettings> settings)
	: ITotpService
{
	/// <summary>
	/// TOTP secret length in bytes (160 bits per RFC 4226).
	/// </summary>
	private const int SecretLengthBytes = 20;

	/// <inheritdoc/>
	public string GenerateSecret()
	{
		byte[] secretBytes =
			new byte[SecretLengthBytes];
		RandomNumberGenerator.Fill(secretBytes);

		return Base32Encoding.ToString(secretBytes);
	}

	/// <inheritdoc/>
	public string GenerateSetupUri(
		string secret,
		string userEmail)
	{
		string encodedIssuer =
			Uri.EscapeDataString(settings.Value.IssuerName);
		string encodedAccount =
			Uri.EscapeDataString(userEmail);

		// otpauth://totp/{issuer}:{account}?secret={secret}&issuer={issuer}&algorithm=SHA1&digits=6&period=30
		return $"otpauth://totp/{encodedIssuer}:{encodedAccount}?secret={secret}&issuer={encodedIssuer}&algorithm=SHA1&digits=6&period={settings.Value.TimeStepSeconds}";
	}

	/// <inheritdoc/>
	public bool VerifyCode(
		string secret,
		string code)
	{
		byte[] secretBytes =
			Base32Encoding.ToBytes(secret);

		Totp totpValidator =
			new(
				secretBytes,
				step: settings.Value.TimeStepSeconds);

		VerificationWindow verificationWindow =
			new(
				previous: settings.Value.AllowedTimeStepDrift,
				future: settings.Value.AllowedTimeStepDrift);

		return totpValidator.VerifyTotp(
			code,
			out long _,
			verificationWindow);
	}
}