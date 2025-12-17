// <copyright file="InitiateRegistrationCommandHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using SeventySix.Identity;
using SeventySix.Shared.Extensions;
using SeventySix.TestUtilities.TestBases;
using Shouldly;
using Xunit;

namespace SeventySix.Domains.Tests.Identity.Commands.InitiateRegistration;

/// <summary>
/// Tests for EmailVerificationToken entity with focus on token hashing security.
/// </summary>
[Collection("DatabaseTests")]
public class InitiateRegistrationCommandHandlerTests(
	TestcontainersPostgreSqlFixture fixture) : DataPostgreSqlTestBase(fixture)
{
	[Fact]
	public async Task EmailVerificationToken_ShouldStoreTokenHashAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();

		string knownToken = "test-token-12345";
		string expectedHash =
			CryptoExtensions.ComputeSha256Hash(knownToken);

		string uniqueEmail =
			$"test-{Guid.NewGuid():N}@example.com";

		EmailVerificationToken verificationToken =
			new()
			{
				Email = uniqueEmail,
				TokenHash = expectedHash,
				ExpiresAt =
					DateTime.UtcNow.AddHours(24),
				IsUsed = false,
			};

		// Act
		context.EmailVerificationTokens.Add(verificationToken);
		await context.SaveChangesAsync();

		// Assert
		EmailVerificationToken? savedToken =
			await context.EmailVerificationTokens.FirstOrDefaultAsync(token =>
				token.Email == uniqueEmail);

		savedToken.ShouldNotBeNull();
		savedToken.TokenHash.ShouldBe(expectedHash);
		savedToken.TokenHash.Length.ShouldBe(64); // SHA256 hex = 64 chars
	}

	[Fact]
	public async Task EmailVerificationToken_ShouldEnforceUniqueTokenHashAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();

		string hashedToken =
			CryptoExtensions.ComputeSha256Hash(
			"duplicate-token");

		EmailVerificationToken firstToken =
			new()
			{
				Email = "first@example.com",
				TokenHash = hashedToken,
				ExpiresAt =
					DateTime.UtcNow.AddHours(24),
				IsUsed = false,
			};

		EmailVerificationToken duplicateToken =
			new()
			{
				Email = "second@example.com",
				TokenHash = hashedToken, // Same hash
				ExpiresAt =
					DateTime.UtcNow.AddHours(24),
				IsUsed = false,
			};

		context.EmailVerificationTokens.Add(firstToken);
		await context.SaveChangesAsync();

		// Act & Assert
		context.EmailVerificationTokens.Add(duplicateToken);

		DbUpdateException exception =
			await Should.ThrowAsync<DbUpdateException>(async () =>
				await context.SaveChangesAsync());

		exception.InnerException?.Message.ShouldContain(
			"IX_EmailVerificationTokens_TokenHash");
	}
}