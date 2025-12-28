// <copyright file="PasswordResetTokenConfigurationTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Time.Testing;
using SeventySix.Identity;
using SeventySix.Shared.Extensions;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Configurations;

/// <summary>
/// Integration tests for <see cref="PasswordResetTokenConfiguration"/>.
/// </summary>
/// <remarks>
/// Validates FK constraints and cascade delete behavior at the database level.
/// Uses Testcontainers with PostgreSQL for realistic integration testing.
/// </remarks>
[Collection("DatabaseTests")]
public class PasswordResetTokenConfigurationTests : DataPostgreSqlTestBase
{
	public PasswordResetTokenConfigurationTests(
		TestcontainersPostgreSqlFixture fixture)
		: base(fixture) { }

	[Fact]
	public async Task DeleteUser_CascadesDelete_ToPasswordResetTokensAsync()
	{
		// Arrange - Create user with password reset token
		FakeTimeProvider timeProvider = new();
		await using IdentityDbContext context = CreateIdentityDbContext();

		string testId =
			Guid.NewGuid().ToString("N")[..8];
		User user =
			new UserBuilder(timeProvider)
			.WithUsername($"cascade_{testId}")
			.WithEmail($"cascade_{testId}@example.com")
			.Build();
		await context.Users.AddAsync(user);
		await context.SaveChangesAsync();

		PasswordResetToken token =
			new PasswordResetTokenBuilder(timeProvider)
			.WithUserId(user.Id)
			.Build();
		await context.PasswordResetTokens.AddAsync(token);
		await context.SaveChangesAsync();

		long tokenId = token.Id;

		// Verify token exists
		PasswordResetToken? existingToken =
			await context.PasswordResetTokens.FindAsync(tokenId);
		existingToken.ShouldNotBeNull();

		// Act - Delete user
		context.Users.Remove(user);
		await context.SaveChangesAsync();

		// Assert - Token should be cascade deleted
		PasswordResetToken? deletedToken =
			await context.PasswordResetTokens.FindAsync(tokenId);
		deletedToken.ShouldBeNull();
	}

	[Fact]
	public async Task CreatePasswordResetToken_Fails_WhenUserDoesNotExistAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		await using IdentityDbContext context = CreateIdentityDbContext();

		PasswordResetToken token =
			new PasswordResetTokenBuilder(timeProvider)
			.WithUserId(999999) // Non-existent user
			.Build();

		// Act & Assert - FK constraint should prevent insert
		context.PasswordResetTokens.Add(token);
		await Should.ThrowAsync<DbUpdateException>(() =>
			context.SaveChangesAsync());
	}

	[Fact]
	public async Task DeleteUser_CascadesDelete_ToMultiplePasswordResetTokensAsync()
	{
		// Arrange - Create user with multiple password reset tokens
		FakeTimeProvider timeProvider = new();
		await using IdentityDbContext context = CreateIdentityDbContext();

		string testId =
			Guid.NewGuid().ToString("N")[..8];
		User user =
			new UserBuilder(timeProvider)
			.WithUsername($"multi_{testId}")
			.WithEmail($"multi_{testId}@example.com")
			.Build();
		await context.Users.AddAsync(user);
		await context.SaveChangesAsync();

		PasswordResetToken token1 =
			new PasswordResetTokenBuilder(timeProvider)
			.WithUserId(user.Id)
			.WithTokenHash(
				CryptoExtensions.ComputeSha256Hash($"token1_{testId}"))
			.Build();
		PasswordResetToken token2 =
			new PasswordResetTokenBuilder(timeProvider)
			.WithUserId(user.Id)
			.WithTokenHash(
				CryptoExtensions.ComputeSha256Hash($"token2_{testId}"))
			.Build();

		await context.PasswordResetTokens.AddRangeAsync(token1, token2);
		await context.SaveChangesAsync();

		long token1Id = token1.Id;
		long token2Id = token2.Id;

		// Act - Delete user
		context.Users.Remove(user);
		await context.SaveChangesAsync();

		// Assert - All tokens should be cascade deleted
		int remainingTokens =
			await context
			.PasswordResetTokens.Where(t =>
				t.Id == token1Id || t.Id == token2Id)
			.CountAsync();
		remainingTokens.ShouldBe(0);
	}
}