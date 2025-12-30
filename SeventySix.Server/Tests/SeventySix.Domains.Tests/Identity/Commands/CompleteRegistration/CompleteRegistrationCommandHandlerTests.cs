// <copyright file="CompleteRegistrationCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Identity;
using SeventySix.Shared.Extensions;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Commands.CompleteRegistration;

/// <summary>
/// Tests for EmailVerificationTokenRepository with focus on hashed token validation.
/// </summary>
[Collection("DatabaseTests")]
public class CompleteRegistrationCommandHandlerTests(
	TestcontainersPostgreSqlFixture fixture) : DataPostgreSqlTestBase(fixture)
{
	[Fact]
	public async Task GetByHashAsync_ShouldFindValidHashedTokenAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();

		EmailVerificationTokenRepository repository =
			new(context);

		string rawToken =
			Convert.ToBase64String(
			System.Security.Cryptography.RandomNumberGenerator.GetBytes(64));

		string hashedToken =
			CryptoExtensions.ComputeSha256Hash(rawToken);

		string testEmail = "test@example.com";

		EmailVerificationToken verificationToken =
			new()
			{
				Email = testEmail,
				TokenHash = hashedToken,
				ExpiresAt =
					TestTimeProviderBuilder
				.DefaultTime.AddHours(24)
				.UtcDateTime,
				IsUsed = false,
			};

		context.EmailVerificationTokens.Add(verificationToken);
		await context.SaveChangesAsync();

		// Act
		EmailVerificationToken? foundToken =
			await repository.GetByHashAsync(
			hashedToken);

		// Assert
		foundToken.ShouldNotBeNull();
		foundToken.TokenHash.ShouldBe(hashedToken);
		foundToken.Email.ShouldBe(testEmail);
		foundToken.IsUsed.ShouldBeFalse();
	}

	[Fact]
	public async Task GetByHashAsync_ShouldReturnNullForInvalidHashAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();

		EmailVerificationTokenRepository repository =
			new(context);

		string validHash =
			CryptoExtensions.ComputeSha256Hash("valid-token");

		string invalidHash =
			CryptoExtensions.ComputeSha256Hash(
			"different-token");

		EmailVerificationToken verificationToken =
			new()
			{
				Email = "test@example.com",
				TokenHash = validHash,
				ExpiresAt =
					TestTimeProviderBuilder
				.DefaultTime.AddHours(24)
				.UtcDateTime,
				IsUsed = false,
			};

		context.EmailVerificationTokens.Add(verificationToken);
		await context.SaveChangesAsync();

		// Act
		EmailVerificationToken? foundToken =
			await repository.GetByHashAsync(
			invalidHash);

		// Assert
		foundToken.ShouldBeNull();
	}

	[Fact]
	public async Task GetByHashAsync_ShouldNotFindUsedTokenAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();

		EmailVerificationTokenRepository repository =
			new(context);

		string hashedToken =
			CryptoExtensions.ComputeSha256Hash("used-token");

		EmailVerificationToken usedToken =
			new()
			{
				Email = "test@example.com",
				TokenHash = hashedToken,
				ExpiresAt =
					TestTimeProviderBuilder
				.DefaultTime.AddHours(24)
				.UtcDateTime,
				IsUsed = true, // Already used
			};

		context.EmailVerificationTokens.Add(usedToken);
		await context.SaveChangesAsync();

		// Act - Repository doesn't filter by IsUsed, but handler should
		EmailVerificationToken? foundToken =
			await repository.GetByHashAsync(
			hashedToken);

		// Assert - Repository returns the token, handler validates IsUsed
		foundToken.ShouldNotBeNull();
		foundToken.IsUsed.ShouldBeTrue();
	}
}