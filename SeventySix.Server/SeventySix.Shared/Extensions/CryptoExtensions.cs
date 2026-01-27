// <copyright file="CryptoExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Buffers.Text;
using System.Security.Cryptography;
using System.Text;

namespace SeventySix.Shared.Extensions;

/// <summary>
/// Cryptographic utility extension methods.
/// Consolidates secure random generation and hashing used across the application.
/// </summary>
/// <remarks>
/// DRY: Used by TokenService, AuthController, and any other component needing
/// secure random bytes or hashing.
/// </remarks>
public static class CryptoExtensions
{
	/// <summary>
	/// Default size for random tokens in bytes.
	/// </summary>
	private const int DefaultTokenSizeBytes = 32;

	/// <summary>
	/// Generates a cryptographically secure random token as Base64.
	/// </summary>
	/// <param name="sizeInBytes">
	/// Size of random data in bytes. Default: 32.
	/// </param>
	/// <returns>
	/// Base64-encoded random token.
	/// </returns>
	public static string GenerateSecureToken(
		int sizeInBytes = DefaultTokenSizeBytes)
	{
		byte[] randomBytes =
			new byte[sizeInBytes];
		RandomNumberGenerator.Fill(randomBytes);
		return Convert.ToBase64String(randomBytes);
	}

	/// <summary>
	/// Generates a PKCE code verifier for OAuth flows.
	/// Uses Base64URL encoding (no padding, URL-safe characters).
	/// </summary>
	/// <param name="sizeInBytes">
	/// Size of random data in bytes. Default: 32.
	/// </param>
	/// <returns>
	/// Base64URL-encoded code verifier.
	/// </returns>
	/// <remarks>
	/// PKCE (Proof Key for Code Exchange) requires URL-safe characters.
	/// See RFC 7636: https://tools.ietf.org/html/rfc7636
	/// </remarks>
	public static string GeneratePkceCodeVerifier(
		int sizeInBytes = DefaultTokenSizeBytes)
	{
		byte[] randomBytes =
			new byte[sizeInBytes];
		RandomNumberGenerator.Fill(randomBytes);

		return Base64Url.EncodeToString(randomBytes);
	}

	/// <summary>
	/// Computes SHA256 hash of the input string.
	/// </summary>
	/// <param name="input">
	/// String to hash.
	/// </param>
	/// <returns>
	/// Hex-encoded SHA256 hash (uppercase).
	/// </returns>
	public static string ComputeSha256Hash(string input)
	{
		byte[] bytes =
			SHA256.HashData(Encoding.UTF8.GetBytes(input));

		return Convert.ToHexString(bytes);
	}

	/// <summary>
	/// Computes SHA256 hash and encodes as Base64URL for PKCE code challenge.
	/// </summary>
	/// <param name="codeVerifier">
	/// The PKCE code verifier to hash.
	/// </param>
	/// <returns>
	/// Base64URL-encoded SHA256 hash for code challenge.
	/// </returns>
	/// <remarks>
	/// Used in PKCE flow to create the code_challenge from code_verifier.
	/// See RFC 7636 Section 4.2.
	/// </remarks>
	public static string ComputePkceCodeChallenge(string codeVerifier)
	{
		byte[] hash =
			SHA256.HashData(Encoding.UTF8.GetBytes(codeVerifier));

		return Base64Url.EncodeToString(hash);
	}
}