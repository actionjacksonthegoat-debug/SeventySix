// <copyright file="RegistrationTokenServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.POCOs;
using SeventySix.Shared.Utilities;
using Shouldly;

namespace SeventySix.Shared.Tests.Utilities;

/// <summary>
/// Unit tests for <see cref="RegistrationTokenService"/> encode/decode round-trip.
/// </summary>
public sealed class RegistrationTokenServiceTests
{
	private const string TestEmail = "user@example.com";
	private const string TestToken = "abc123verification";
	private const string InvalidBase64 = "!!!not-base64!!!";

	// Valid Base64Url that decodes to "hello" (not valid JSON for the DTO)
	private const string ValidBase64InvalidJson = "aGVsbG8";

	/// <summary>
	/// Encode returns a non-empty string for valid inputs.
	/// </summary>
	[Fact]
	public void Encode_ValidEmailAndToken_ReturnsNonEmptyString()
	{
		string result =
			RegistrationTokenService.Encode(TestEmail, TestToken);

		result.ShouldNotBeNullOrEmpty();
	}

	/// <summary>
	/// Decode of Encode output returns the original email and token.
	/// </summary>
	[Fact]
	public void Encode_ThenDecode_RoundTripsCorrectly()
	{
		string encoded =
			RegistrationTokenService.Encode(TestEmail, TestToken);

		CombinedRegistrationTokenDto? decoded =
			RegistrationTokenService.Decode(encoded);

		decoded.ShouldNotBeNull();
		decoded.Email.ShouldBe(TestEmail);
		decoded.Token.ShouldBe(TestToken);
	}

	/// <summary>
	/// Decode returns null for null input.
	/// </summary>
	[Fact]
	public void Decode_NullInput_ReturnsNull()
	{
		CombinedRegistrationTokenDto? result =
			RegistrationTokenService.Decode(null!);

		result.ShouldBeNull();
	}

	/// <summary>
	/// Decode returns null for empty string input.
	/// </summary>
	[Fact]
	public void Decode_EmptyInput_ReturnsNull()
	{
		CombinedRegistrationTokenDto? result =
			RegistrationTokenService.Decode(string.Empty);

		result.ShouldBeNull();
	}

	/// <summary>
	/// Decode returns null for whitespace-only input.
	/// </summary>
	[Fact]
	public void Decode_WhitespaceInput_ReturnsNull()
	{
		CombinedRegistrationTokenDto? result =
			RegistrationTokenService.Decode("   ");

		result.ShouldBeNull();
	}

	/// <summary>
	/// Decode returns null for invalid Base64 input.
	/// </summary>
	[Fact]
	public void Decode_InvalidBase64_ReturnsNull()
	{
		CombinedRegistrationTokenDto? result =
			RegistrationTokenService.Decode(InvalidBase64);

		result.ShouldBeNull();
	}

	/// <summary>
	/// Decode returns null when Base64 decodes successfully but JSON is not a valid DTO.
	/// </summary>
	[Fact]
	public void Decode_ValidBase64ButInvalidJson_ReturnsNull()
	{
		CombinedRegistrationTokenDto? result =
			RegistrationTokenService.Decode(ValidBase64InvalidJson);

		result.ShouldBeNull();
	}
}