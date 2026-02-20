// <copyright file="CryptoExtensionsTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Extensions;
using Shouldly;

namespace SeventySix.Shared.Tests.Extensions;

/// <summary>
/// Unit tests for CryptoExtensions utility methods.
/// </summary>
public sealed class CryptoExtensionsTests
{
	[Fact]
	public void GenerateSecureToken_ReturnsBase64String()
	{
		// Act
		string token =
			CryptoExtensions.GenerateSecureToken();

		// Assert
		token.ShouldNotBeNullOrEmpty();
		IsBase64(token).ShouldBeTrue();
	}

	[Fact]
	public void GenerateSecureToken_ReturnsUnique_EachCall()
	{
		// Act
		string token1 =
			CryptoExtensions.GenerateSecureToken();
		string token2 =
			CryptoExtensions.GenerateSecureToken();

		// Assert
		token1.ShouldNotBe(token2);
	}

	[Fact]
	public void GenerateSecureToken_WithCustomSize_ReturnsExpectedLength()
	{
		// Arrange
		int sizeInBytes = 64;

		// Act
		string token =
			CryptoExtensions.GenerateSecureToken(sizeInBytes);

		// Assert - Base64 encodes 3 bytes into 4 chars, with potential padding
		byte[] decoded =
			Convert.FromBase64String(token);
		decoded.Length.ShouldBe(sizeInBytes);
	}

	[Fact]
	public void GeneratePkceCodeVerifier_ReturnsUrlSafeString()
	{
		// Act
		string verifier =
			CryptoExtensions.GeneratePkceCodeVerifier();

		// Assert - Should be URL-safe (no +, /, or = padding)
		verifier.ShouldNotBeNullOrEmpty();
		verifier.ShouldNotContain("+");
		verifier.ShouldNotContain("/");
		verifier.ShouldNotContain("=");
	}

	[Fact]
	public void GeneratePkceCodeVerifier_ReturnsUnique_EachCall()
	{
		// Act
		string verifier1 =
			CryptoExtensions.GeneratePkceCodeVerifier();
		string verifier2 =
			CryptoExtensions.GeneratePkceCodeVerifier();

		// Assert
		verifier1.ShouldNotBe(verifier2);
	}

	[Fact]
	public void ComputeSha256Hash_ReturnsConsistentHash()
	{
		// Arrange
		string input = "test-token";

		// Act
		string hash1 =
			CryptoExtensions.ComputeSha256Hash(input);
		string hash2 =
			CryptoExtensions.ComputeSha256Hash(input);

		// Assert
		hash1.ShouldBe(hash2);
		hash1.Length.ShouldBe(64); // SHA256 = 32 bytes = 64 hex chars
	}

	[Fact]
	public void ComputeSha256Hash_DifferentInputs_ReturnsDifferentHashes()
	{
		// Act
		string hash1 =
			CryptoExtensions.ComputeSha256Hash("input1");
		string hash2 =
			CryptoExtensions.ComputeSha256Hash("input2");

		// Assert
		hash1.ShouldNotBe(hash2);
	}

	[Fact]
	public void ComputePkceCodeChallenge_ReturnsUrlSafeBase64()
	{
		// Arrange
		string verifier =
			CryptoExtensions.GeneratePkceCodeVerifier();

		// Act
		string challenge =
			CryptoExtensions.ComputePkceCodeChallenge(verifier);

		// Assert - Should be URL-safe Base64
		challenge.ShouldNotBeNullOrEmpty();
		challenge.ShouldNotContain("+");
		challenge.ShouldNotContain("/");
		challenge.ShouldNotContain("=");
	}

	[Fact]
	public void ComputePkceCodeChallenge_SameVerifier_ReturnsSameChallenge()
	{
		// Arrange
		string verifier = "test-verifier-12345";

		// Act
		string challenge1 =
			CryptoExtensions.ComputePkceCodeChallenge(verifier);
		string challenge2 =
			CryptoExtensions.ComputePkceCodeChallenge(verifier);

		// Assert
		challenge1.ShouldBe(challenge2);
	}

	private static bool IsBase64(string input)
	{
		try
		{
			_ =
				Convert.FromBase64String(input);
			return true;
		}
		catch (FormatException)
		{
			return false;
		}
	}
}