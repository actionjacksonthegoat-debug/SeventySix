// <copyright file="AuthRepositoryTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Time.Testing;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Identity.Tests.Repositories;

/// <summary>
/// Integration tests for <see cref="AuthRepository"/>.
/// </summary>
/// <remarks>
/// AuthRepository is now simplified to only handle UpdateLastLoginAsync.
/// User lookup, external logins, and roles are handled by UserManager.
/// </remarks>
[Collection(CollectionNames.IdentityPostgreSql)]
public sealed class AuthRepositoryTests : DataPostgreSqlTestBase
{
	public AuthRepositoryTests(IdentityPostgreSqlFixture fixture)
		: base(fixture) { }

	/// <summary>
	/// Verifies UpdateLastLoginAsync updates last login timestamp and IP address.
	/// </summary>
	[Fact]
	public async Task UpdateLastLoginAsync_UpdatesTimestampAndIpAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider =
			new();
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		AuthRepository repository =
			new(context);
		string testId =
			Guid.NewGuid().ToString("N")[..8];

		ApplicationUser user =
			new UserBuilder(timeProvider)
			.WithUsername($"logintest_{testId}")
			.WithEmail($"logintest_{testId}@example.com")
			.Build();

		context.Users.Add(user);
		await context.SaveChangesAsync();

		DateTimeOffset loginTime =
			timeProvider.GetUtcNow();
		string clientIp = "192.168.1.100";

		// Act
		await repository.UpdateLastLoginAsync(
			user.Id,
			loginTime,
			clientIp,
			CancellationToken.None);

		// Assert - use fresh context to verify
		await using IdentityDbContext verifyContext =
			CreateIdentityDbContext();
		ApplicationUser? updatedUser =
			await verifyContext.Users.FindAsync(user.Id);

		updatedUser.ShouldNotBeNull();
		updatedUser.LastLoginAt.ShouldNotBeNull();
		DateTimeOffset lastLoginAt =
			updatedUser.LastLoginAt ?? throw new InvalidOperationException("LastLoginAt should not be null");
		lastLoginAt.ShouldBe(
			loginTime,
			TimeSpan.FromSeconds(1));
		updatedUser.LastLoginIp.ShouldBe(clientIp);
	}

	/// <summary>
	/// Verifies UpdateLastLoginAsync handles null IP address.
	/// </summary>
	[Fact]
	public async Task UpdateLastLoginAsync_WithNullIp_UpdatesOnlyTimestampAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider =
			new();
		await using IdentityDbContext context =
			CreateIdentityDbContext();
		AuthRepository repository =
			new(context);
		string testId =
			Guid.NewGuid().ToString("N")[..8];

		ApplicationUser user =
			new UserBuilder(timeProvider)
			.WithUsername($"nulliptest_{testId}")
			.WithEmail($"nulliptest_{testId}@example.com")
			.Build();

		context.Users.Add(user);
		await context.SaveChangesAsync();

		DateTimeOffset loginTime =
			timeProvider.GetUtcNow();

		// Act
		await repository.UpdateLastLoginAsync(
			user.Id,
			loginTime,
			null,
			CancellationToken.None);

		// Assert - use fresh context to verify
		await using IdentityDbContext verifyContext =
			CreateIdentityDbContext();
		ApplicationUser? updatedUser =
			await verifyContext.Users.FindAsync(user.Id);

		updatedUser.ShouldNotBeNull();
		updatedUser.LastLoginAt.ShouldNotBeNull();
		DateTimeOffset lastLoginAt =
			updatedUser.LastLoginAt ?? throw new InvalidOperationException("LastLoginAt should not be null");
		lastLoginAt.ShouldBe(
			loginTime,
			TimeSpan.FromSeconds(1));
		updatedUser.LastLoginIp.ShouldBeNull();
	}
}