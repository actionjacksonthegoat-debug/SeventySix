// <copyright file="RegistrationTokenService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Buffers.Text;
using System.Text;
using System.Text.Json;
using SeventySix.Shared.POCOs;

namespace SeventySix.Shared.Utilities;

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
		CombinedRegistrationTokenDto combinedToken =
			new(email, verificationToken);

		string jsonPayload =
			JsonSerializer.Serialize(combinedToken);

		byte[] payloadBytes =
			Encoding.UTF8.GetBytes(jsonPayload);

		return Base64Url.EncodeToString(payloadBytes);
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
	public static CombinedRegistrationTokenDto? Decode(string encodedToken)
	{
		if (string.IsNullOrWhiteSpace(encodedToken))
		{
			return null;
		}

		try
		{
			byte[] decodedBytes =
				Base64Url.DecodeFromChars(encodedToken);

			string jsonPayload =
				Encoding.UTF8.GetString(decodedBytes);

			return JsonSerializer.Deserialize<CombinedRegistrationTokenDto>(
				jsonPayload);
		}
		catch
		{
			return null;
		}
	}
}