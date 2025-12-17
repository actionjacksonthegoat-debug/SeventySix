// <copyright file="EmailVerificationTokenRepositoryTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Time.Testing;
using SeventySix.Identity;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Repositories;

/// <summary>
/// Integration tests for <see cref="EmailVerificationTokenRepository"/>.
/// </summary>
/// <remarks>
/// Follows 80/20 rule - tests critical registration token paths only.
/// Uses Testcontainers with PostgreSQL for realistic integration testing.
/// </remarks>
[Collection("DatabaseTests")]
public class EmailVerificationTokenRepositoryTests : DataPostgreSqlTestBase
{
	public EmailVerificationTokenRepositoryTests(
		TestcontainersPostgreSqlFixture fixture)
		: base(fixture) { }

	[Fact]
	public async Task GetByHashAsync_ReturnsToken_WhenExistsAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		await using IdentityDbContext context = CreateIdentityDbContext();
		EmailVerificationTokenRepository repository =
			new(context);
		string testId =
			Guid.NewGuid().ToString("N")[..8];

		string tokenHash =
			SeventySix.Shared.Extensions.CryptoExtensions.ComputeSha256Hash(
				$"token_{testId}");

		EmailVerificationToken token =
			new()
			{
				Email =
					$"verify_{testId}@example.com",
				TokenHash = tokenHash,
				ExpiresAt =
					timeProvider.GetUtcNow().UtcDateTime.AddHours(24),
				CreateDate =
					timeProvider.GetUtcNow().UtcDateTime,
				IsUsed = false,
			};

		context.EmailVerificationTokens.Add(token);
		await context.SaveChangesAsync();

		// Act
		EmailVerificationToken? result =
			await repository.GetByHashAsync(
			tokenHash,
			CancellationToken.None);

		// Assert
		result.ShouldNotBeNull();
		result.Email.ShouldBe(token.Email);
		result.IsUsed.ShouldBeFalse();
	}

	[Fact]
	public async Task GetByHashAsync_ReturnsNull_WhenNotFoundAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		EmailVerificationTokenRepository repository =
			new(context);

		string nonexistentHash =
			SeventySix.Shared.Extensions.CryptoExtensions.ComputeSha256Hash(
				"nonexistent_token");

		// Act
		EmailVerificationToken? result =
			await repository.GetByHashAsync(
			nonexistentHash,
			CancellationToken.None);

		// Assert
		result.ShouldBeNull();
	}

	[Fact]
	public async Task CreateAsync_CreatesTokenAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		await using IdentityDbContext context = CreateIdentityDbContext();
		EmailVerificationTokenRepository repository =
			new(context);
		string testId =
			Guid.NewGuid().ToString("N")[..8];

		string tokenHash =
			SeventySix.Shared.Extensions.CryptoExtensions.ComputeSha256Hash(
				$"create_token_{testId}");

		EmailVerificationToken token =
			new()
			{
				Email =
					$"create_{testId}@example.com",
				TokenHash = tokenHash,
				ExpiresAt =
					timeProvider.GetUtcNow().UtcDateTime.AddHours(24),
				CreateDate =
					timeProvider.GetUtcNow().UtcDateTime,
				IsUsed = false,
			};

		// Act
		await repository.CreateAsync(token, CancellationToken.None);

		// Assert
		token.Id.ShouldBeGreaterThan(0);

		// Verify in fresh context
		await using IdentityDbContext verifyContext = CreateIdentityDbContext();
		EmailVerificationToken? created =
			await verifyContext.EmailVerificationTokens.FindAsync(token.Id);
		created.ShouldNotBeNull();
		created.TokenHash.ShouldBe(tokenHash);
	}

	[Fact]
	public async Task InvalidateTokensForEmailAsync_InvalidatesAllUnusedTokensAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		await using IdentityDbContext context = CreateIdentityDbContext();
		EmailVerificationTokenRepository repository =
			new(context);
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		string email =
			$"invalidate_{testId}@example.com";

		string tokenHash1 =
			SeventySix.Shared.Extensions.CryptoExtensions.ComputeSha256Hash(
				$"inv_token1_{testId}");

		string tokenHash2 =
			SeventySix.Shared.Extensions.CryptoExtensions.ComputeSha256Hash(
				$"inv_token2_{testId}");

		// Create multiple unused tokens
		EmailVerificationToken token1 =
			new()
			{
				Email = email,
				TokenHash = tokenHash1,
				ExpiresAt =
					timeProvider.GetUtcNow().UtcDateTime.AddHours(24),
				CreateDate =
					timeProvider.GetUtcNow().UtcDateTime,
				IsUsed = false,
			};

		EmailVerificationToken token2 =
			new()
			{
				Email = email,
				TokenHash = tokenHash2,
				ExpiresAt =
					timeProvider.GetUtcNow().UtcDateTime.AddHours(24),
				CreateDate =
					timeProvider.GetUtcNow().UtcDateTime,
				IsUsed = false,
			};

		context.EmailVerificationTokens.AddRange(token1, token2);
		await context.SaveChangesAsync();

		// Act
		int invalidatedCount =
			await repository.InvalidateTokensForEmailAsync(
			email,
			CancellationToken.None);

		// Assert
		invalidatedCount.ShouldBe(2);

		// Verify tokens are marked as used
		await using IdentityDbContext verifyContext = CreateIdentityDbContext();
		EmailVerificationToken? verifiedToken1 =
			await verifyContext.EmailVerificationTokens.FindAsync(token1.Id);
		EmailVerificationToken? verifiedToken2 =
			await verifyContext.EmailVerificationTokens.FindAsync(token2.Id);

		verifiedToken1!.IsUsed.ShouldBeTrue();
		verifiedToken2!.IsUsed.ShouldBeTrue();
	}
}