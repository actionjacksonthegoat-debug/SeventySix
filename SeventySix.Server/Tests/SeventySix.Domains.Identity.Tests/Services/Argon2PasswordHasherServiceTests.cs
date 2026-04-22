// <copyright file="Argon2PasswordHasherServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Shouldly;

namespace SeventySix.Identity.Tests.Services;

/// <summary>
/// Tests for <see cref="IdentityArgon2PasswordHasherService"/>.
/// </summary>
/// <remarks>
/// Security-critical tests - 100% coverage required per 80/20 rule.
/// </remarks>
public sealed class Argon2PasswordHasherServiceTests
{
	private readonly IdentityArgon2PasswordHasherService Hasher;
	private readonly ApplicationUser TestUser =
		new() { UserName = "testuser" };

	public Argon2PasswordHasherServiceTests()
	{
		AuthSettings authSettings =
			new()
			{
				Password =
					new PasswordSettings
					{
						Argon2 =
							new Argon2Settings
							{
								MemorySize = 4096, // 4 MB for fast tests
								Iterations = 2,
								DegreeOfParallelism = 1,
							},
					},
			};

		Hasher =
			new IdentityArgon2PasswordHasherService(Options.Create(authSettings));
	}

	[Fact]
	public void HashPassword_ShouldReturnArgon2idFormattedHashAsync()
	{
		// Arrange
		string password = "SecurePassword123!";

		// Act
		string hash =
			Hasher.HashPassword(TestUser, password);

		// Assert
		hash.ShouldStartWith("$argon2id$v=19$");
		hash.ShouldContain("m=4096");
		hash.ShouldContain("t=2");
		hash.ShouldContain("p=1");
	}

	[Fact]
	public void HashPassword_ShouldProduceDifferentHashesForSamePasswordAsync()
	{
		// Arrange (different salts should produce different hashes)
		string password = "SecurePassword123!";

		// Act
		string hash1 =
			Hasher.HashPassword(TestUser, password);
		string hash2 =
			Hasher.HashPassword(TestUser, password);

		// Assert
		hash1.ShouldNotBe(hash2);
	}

	[Fact]
	public void VerifyPassword_ShouldReturnSuccessForCorrectPasswordAsync()
	{
		// Arrange
		string password = "SecurePassword123!";
		string hash =
			Hasher.HashPassword(TestUser, password);

		// Act
		PasswordVerificationResult result =
			Hasher.VerifyHashedPassword(TestUser, hash, password);

		// Assert
		result.ShouldBe(PasswordVerificationResult.Success);
	}

	[Fact]
	public void VerifyPassword_ShouldReturnFailedForIncorrectPasswordAsync()
	{
		// Arrange
		string password = "SecurePassword123!";
		string wrongPassword = "WrongPassword456!";
		string hash =
			Hasher.HashPassword(TestUser, password);

		// Act
		PasswordVerificationResult result =
			Hasher.VerifyHashedPassword(TestUser, hash, wrongPassword);

		// Assert
		result.ShouldBe(PasswordVerificationResult.Failed);
	}

	[Fact]
	public void VerifyPassword_ShouldReturnFailedForInvalidHashFormatAsync()
	{
		// Arrange
		string password = "SecurePassword123!";
		string invalidHash = "$bcrypt$invalidhash";

		// Act
		PasswordVerificationResult result =
			Hasher.VerifyHashedPassword(TestUser, invalidHash, password);

		// Assert
		result.ShouldBe(PasswordVerificationResult.Failed);
	}

	[Fact]
	public void VerifyPassword_ShouldReturnFailedForMalformedArgon2HashAsync()
	{
		// Arrange
		string password = "SecurePassword123!";
		string malformedHash = "$argon2id$v=19$m=invalid$salt$hash";

		// Act
		PasswordVerificationResult result =
			Hasher.VerifyHashedPassword(TestUser, malformedHash, password);

		// Assert
		result.ShouldBe(PasswordVerificationResult.Failed);
	}

	[Theory]
	[InlineData(null)]
	[InlineData("")]
	[InlineData("   ")]
	public void HashPassword_ShouldThrowForNullOrWhitespaceAsync(
		string? password)
	{
		// Act & Assert
		Should.Throw<ArgumentException>(
			() => Hasher.HashPassword(
				TestUser,
				password!));
	}

	[Theory]
	[InlineData(null, "somehash")]
	[InlineData("password", null)]
	[InlineData("", "somehash")]
	[InlineData("password", "")]
	public void VerifyPassword_ShouldThrowForNullOrEmptyInputsAsync(
		string? password,
		string? hash)
	{
		// Act & Assert
		Should.Throw<ArgumentException>(() =>
			Hasher.VerifyHashedPassword(
				TestUser,
				hash!,
				password!));
	}
}