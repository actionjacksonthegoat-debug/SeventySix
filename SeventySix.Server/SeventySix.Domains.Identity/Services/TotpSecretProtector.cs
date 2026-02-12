// <copyright file="TotpSecretProtector.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.DataProtection;

namespace SeventySix.Identity;

/// <summary>
/// Encrypts and decrypts TOTP secrets using the Data Protection API.
/// Provides at-rest encryption for TOTP shared secrets stored in the database.
/// </summary>
///
/// <param name="protectionProvider">
/// The data protection provider.
/// </param>
public sealed class TotpSecretProtector(
	IDataProtectionProvider protectionProvider)
{
	private IDataProtector Protector { get; } =
		protectionProvider.CreateProtector("TotpSecrets.v1");

	/// <summary>
	/// Encrypts a plaintext TOTP secret for database storage.
	/// </summary>
	///
	/// <param name="plaintextSecret">
	/// The Base32-encoded TOTP secret to encrypt.
	/// </param>
	///
	/// <returns>
	/// The encrypted secret string.
	/// </returns>
	public string Protect(string plaintextSecret) =>
		Protector.Protect(plaintextSecret);

	/// <summary>
	/// Decrypts a stored TOTP secret for code verification.
	/// </summary>
	///
	/// <param name="protectedSecret">
	/// The encrypted secret from the database.
	/// </param>
	///
	/// <returns>
	/// The original Base32-encoded TOTP secret.
	/// </returns>
	public string Unprotect(string protectedSecret) =>
		Protector.Unprotect(protectedSecret);
}