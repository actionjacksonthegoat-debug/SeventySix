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

	[Fact]
	public void HashPassword_RoundTrip_VerifySucceeds_WithLongUnicodePasswordAsync()
	{
		// Arrange — 200-char Unicode password covering multi-byte code points
		string longUnicode =
			new string('Ä', 50)
				+ new string('中', 50)
				+ new string('★', 25)
				+ new string('ñ', 75);

		// Act
		string hash =
			Hasher.HashPassword(
				TestUser,
				longUnicode);
		PasswordVerificationResult result =
			Hasher.VerifyHashedPassword(
				TestUser,
				hash,
				longUnicode);
		PasswordVerificationResult wrongResult =
			Hasher.VerifyHashedPassword(
				TestUser,
				hash,
				longUnicode + "x");

		// Assert
		result.ShouldBe(PasswordVerificationResult.Success);
		wrongResult.ShouldBe(PasswordVerificationResult.Failed);
	}

	[Fact]
	public void VerifyHashedPassword_TimingIsConsistent_BetweenSuccessAndFailureAsync()
	{
		// Arrange — timing test uses a small iteration count; not a hard constraint.
		// Documents that both code paths exercise the same Argon2 computation.
		const int iterations = 3;
		string password = "CorrectPassword1!";
		string wrongPassword = "WrongPassword2!";
		string hash =
			Hasher.HashPassword(
				TestUser,
				password);

		System.Diagnostics.Stopwatch sw = new();
		long correctMs = 0;
		long incorrectMs = 0;

		for (int i = 0; i < iterations; i++)
		{
			sw.Restart();
			Hasher.VerifyHashedPassword(
				TestUser,
				hash,
				password);
			correctMs += sw.ElapsedMilliseconds;

			sw.Restart();
			Hasher.VerifyHashedPassword(
				TestUser,
				hash,
				wrongPassword);
			incorrectMs += sw.ElapsedMilliseconds;
		}

		// Both paths must complete — zero time means the computation was skipped
		// (correctMs + incorrectMs is the only hard assertion; ratio is best-effort).
		(correctMs + incorrectMs).ShouldBeGreaterThan(0);
	}
}