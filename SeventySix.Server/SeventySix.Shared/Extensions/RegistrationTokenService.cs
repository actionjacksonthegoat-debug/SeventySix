// <copyright file="RegistrationTokenService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Text;
using System.Text.Json;

namespace SeventySix.Shared.Extensions;

/// <summary>
/// Service for encoding and decoding combined registration tokens.
/// </summary>
public static class RegistrationTokenService
{
	/// <summary>
	/// Encodes email and token into a single URL-safe string.
	/// </summary>
	/// <param name="email">
	/// User email address.
	/// </param>
	/// <param name="verificationToken">
	/// Identity email confirmation token.
	/// </param>
	/// <returns>
	/// Base64 URL-encoded combined token.
	/// </returns>
	public static string Encode(
		string email,
		string verificationToken)
	{
		CombinedRegistrationToken combinedToken =
			new(email, verificationToken);

		string jsonPayload =
			JsonSerializer.Serialize(combinedToken);

		byte[] payloadBytes =
			Encoding.UTF8.GetBytes(jsonPayload);

		return Base64UrlEncode(payloadBytes);
	}

	/// <summary>
	/// Decodes a combined token back to email and verification token.
	/// </summary>
	/// <param name="encodedToken">
	/// The Base64 URL-encoded combined token.
	/// </param>
	/// <returns>
	/// Decoded token or null if invalid.
	/// </returns>
	public static CombinedRegistrationToken? Decode(string encodedToken)
	{
		if (string.IsNullOrWhiteSpace(encodedToken))
		{
			return null;
		}

		try
		{
			byte[] decodedBytes =
				Base64UrlDecode(encodedToken);

			string jsonPayload =
				Encoding.UTF8.GetString(decodedBytes);

			return JsonSerializer.Deserialize<CombinedRegistrationToken>(
				jsonPayload);
		}
		catch
		{
			return null;
		}
	}

	/// <summary>
	/// Encodes bytes to URL-safe Base64 string (RFC 4648).
	/// </summary>
	private static string Base64UrlEncode(byte[] input)
	{
		string base64Standard =
			Convert.ToBase64String(input);

		return base64Standard
			.Replace('+', '-')
			.Replace('/', '_')
			.TrimEnd('=');
	}

	/// <summary>
	/// Decodes URL-safe Base64 string to bytes (RFC 4648).
	/// </summary>
	private static byte[] Base64UrlDecode(string input)
	{
		string base64Standard =
			input
				.Replace('-', '+')
				.Replace('_', '/');

		// Add padding if needed
		int paddingNeeded =
			(4 - base64Standard.Length % 4) % 4;

		base64Standard +=
			new string('=', paddingNeeded);

		return Convert.FromBase64String(base64Standard);
	}
}