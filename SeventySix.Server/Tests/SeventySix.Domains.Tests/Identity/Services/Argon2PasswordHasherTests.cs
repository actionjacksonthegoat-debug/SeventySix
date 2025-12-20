// <copyright file="Argon2PasswordHasherTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Options;
using SeventySix.Identity;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Services;

/// <summary>
/// Tests for <see cref="Argon2PasswordHasher"/>.
/// </summary>
/// <remarks>
/// Security-critical tests - 100% coverage required per 80/20 rule.
/// </remarks>
public class Argon2PasswordHasherTests
{
	private readonly Argon2PasswordHasher Hasher;

	public Argon2PasswordHasherTests()
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
			new Argon2PasswordHasher(Options.Create(authSettings));
	}

	[Fact]
	public void HashPassword_ShouldReturnArgon2idFormattedHashAsync()
	{
		// Arrange
		string password = "SecurePassword123!";

		// Act
		string hash =
			Hasher.HashPassword(password);

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
			Hasher.HashPassword(password);
		string hash2 =
			Hasher.HashPassword(password);

		// Assert
		hash1.ShouldNotBe(hash2);
	}

	[Fact]
	public void VerifyPassword_ShouldReturnTrueForCorrectPasswordAsync()
	{
		// Arrange
		string password = "SecurePassword123!";
		string hash =
			Hasher.HashPassword(password);

		// Act
		bool result =
			Hasher.VerifyPassword(password, hash);

		// Assert
		result.ShouldBeTrue();
	}

	[Fact]
	public void VerifyPassword_ShouldReturnFalseForIncorrectPasswordAsync()
	{
		// Arrange
		string password = "SecurePassword123!";
		string wrongPassword = "WrongPassword456!";
		string hash =
			Hasher.HashPassword(password);

		// Act
		bool result =
			Hasher.VerifyPassword(wrongPassword, hash);

		// Assert
		result.ShouldBeFalse();
	}

	[Fact]
	public void VerifyPassword_ShouldReturnFalseForInvalidHashFormatAsync()
	{
		// Arrange
		string password = "SecurePassword123!";
		string invalidHash = "$bcrypt$invalidhash";

		// Act
		bool result =
			Hasher.VerifyPassword(password, invalidHash);

		// Assert
		result.ShouldBeFalse();
	}

	[Fact]
	public void VerifyPassword_ShouldReturnFalseForMalformedArgon2HashAsync()
	{
		// Arrange
		string password = "SecurePassword123!";
		string malformedHash = "$argon2id$v=19$m=invalid$salt$hash";

		// Act
		bool result =
			Hasher.VerifyPassword(password, malformedHash);

		// Assert
		result.ShouldBeFalse();
	}

	[Theory]
	[InlineData(null)]
	[InlineData("")]
	[InlineData("   ")]
	public void HashPassword_ShouldThrowForNullOrWhitespaceAsync(
		string? password)
	{
		// Act & Assert
		Should.Throw<ArgumentException>(() => Hasher.HashPassword(password!));
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
			Hasher.VerifyPassword(password!, hash!));
	}
}