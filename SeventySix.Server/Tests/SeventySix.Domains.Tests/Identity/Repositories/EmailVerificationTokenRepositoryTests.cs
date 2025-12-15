// <copyright file="EmailVerificationTokenRepositoryTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

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
	public EmailVerificationTokenRepositoryTests(TestcontainersPostgreSqlFixture fixture)
		: base(fixture)
	{
	}

	[Fact]
	public async Task GetByTokenAsync_ReturnsToken_WhenExistsAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		EmailVerificationTokenRepository repository = new(context);
		string testId = Guid.NewGuid().ToString("N")[..8];

		EmailVerificationToken token =
			new()
			{
				Email = $"verify_{testId}@example.com",
				Token = $"token_{testId}",
				ExpiresAt = DateTime.UtcNow.AddHours(24),
				CreateDate = DateTime.UtcNow,
				IsUsed = false
			};

		context.EmailVerificationTokens.Add(token);
		await context.SaveChangesAsync();

		// Act
		EmailVerificationToken? result = await repository.GetByTokenAsync(
			token.Token,
			CancellationToken.None);

		// Assert
		result.ShouldNotBeNull();
		result.Email.ShouldBe(token.Email);
		result.IsUsed.ShouldBeFalse();
	}

	[Fact]
	public async Task GetByTokenAsync_ReturnsNull_WhenNotFoundAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		EmailVerificationTokenRepository repository = new(context);

		// Act
		EmailVerificationToken? result = await repository.GetByTokenAsync(
			"nonexistent_token",
			CancellationToken.None);

		// Assert
		result.ShouldBeNull();
	}

	[Fact]
	public async Task CreateAsync_CreatesTokenAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		EmailVerificationTokenRepository repository = new(context);
		string testId = Guid.NewGuid().ToString("N")[..8];

		EmailVerificationToken token =
			new()
			{
				Email = $"create_{testId}@example.com",
				Token = $"create_token_{testId}",
				ExpiresAt = DateTime.UtcNow.AddHours(24),
				CreateDate = DateTime.UtcNow,
				IsUsed = false
			};

		// Act
		await repository.CreateAsync(token, CancellationToken.None);

		// Assert
		token.Id.ShouldBeGreaterThan(0);

		// Verify in fresh context
		await using IdentityDbContext verifyContext = CreateIdentityDbContext();
		EmailVerificationToken? created = await verifyContext.EmailVerificationTokens.FindAsync(token.Id);
		created.ShouldNotBeNull();
		created.Token.ShouldBe(token.Token);
	}

	[Fact]
	public async Task InvalidateTokensForEmailAsync_InvalidatesAllUnusedTokensAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		EmailVerificationTokenRepository repository = new(context);
		string testId = Guid.NewGuid().ToString("N")[..8];
		string email = $"invalidate_{testId}@example.com";

		// Create multiple unused tokens
		EmailVerificationToken token1 =
			new()
			{
				Email = email,
				Token = $"inv_token1_{testId}",
				ExpiresAt = DateTime.UtcNow.AddHours(24),
				CreateDate = DateTime.UtcNow,
				IsUsed = false
			};

		EmailVerificationToken token2 =
			new()
			{
				Email = email,
				Token = $"inv_token2_{testId}",
				ExpiresAt = DateTime.UtcNow.AddHours(24),
				CreateDate = DateTime.UtcNow,
				IsUsed = false
			};

		context.EmailVerificationTokens.AddRange(token1, token2);
		await context.SaveChangesAsync();

		// Act
		int invalidatedCount = await repository.InvalidateTokensForEmailAsync(
			email,
			CancellationToken.None);

		// Assert
		invalidatedCount.ShouldBe(2);

		// Verify tokens are marked as used
		await using IdentityDbContext verifyContext = CreateIdentityDbContext();
		EmailVerificationToken? verifiedToken1 = await verifyContext.EmailVerificationTokens.FindAsync(token1.Id);
		EmailVerificationToken? verifiedToken2 = await verifyContext.EmailVerificationTokens.FindAsync(token2.Id);

		verifiedToken1!.IsUsed.ShouldBeTrue();
		verifiedToken2!.IsUsed.ShouldBeTrue();
	}
}