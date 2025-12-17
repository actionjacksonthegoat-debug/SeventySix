// <copyright file="CryptoExtensionsTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Extensions;

namespace SeventySix.Shared.Tests.Extensions;

/// <summary>
/// Unit tests for CryptoExtensions utility methods.
/// </summary>
public class CryptoExtensionsTests
{
	[Fact]
	public void GenerateSecureToken_ReturnsBase64String()
	{
		// Act
		string token =
			CryptoExtensions.GenerateSecureToken();

		// Assert
		Assert.NotEmpty(token);
		Assert.True(IsBase64(token));
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
		Assert.NotEqual(token1, token2);
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
		Assert.Equal(sizeInBytes, decoded.Length);
	}

	[Fact]
	public void GeneratePkceCodeVerifier_ReturnsUrlSafeString()
	{
		// Act
		string verifier =
			CryptoExtensions.GeneratePkceCodeVerifier();

		// Assert - Should be URL-safe (no +, /, or = padding)
		Assert.NotEmpty(verifier);
		Assert.DoesNotContain("+", verifier);
		Assert.DoesNotContain("/", verifier);
		Assert.DoesNotContain("=", verifier);
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
		Assert.NotEqual(verifier1, verifier2);
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
		Assert.Equal(hash1, hash2);
		Assert.Equal(64, hash1.Length); // SHA256 = 32 bytes = 64 hex chars
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
		Assert.NotEqual(hash1, hash2);
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
		Assert.NotEmpty(challenge);
		Assert.DoesNotContain("+", challenge);
		Assert.DoesNotContain("/", challenge);
		Assert.DoesNotContain("=", challenge);
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
		Assert.Equal(challenge1, challenge2);
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