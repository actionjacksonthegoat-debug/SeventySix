// <copyright file="AuthRepositoryTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Time.Testing;
using SeventySix.Identity;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Repositories;

/// <summary>
/// Integration tests for <see cref="AuthRepository"/>.
/// </summary>
/// <remarks>
/// Follows 80/20 rule - tests critical authentication paths only.
/// Uses Testcontainers with PostgreSQL for realistic integration testing.
/// </remarks>
[Collection("DatabaseTests")]
public class AuthRepositoryTests : DataPostgreSqlTestBase
{
	public AuthRepositoryTests(TestcontainersPostgreSqlFixture fixture)
		: base(fixture)
	{
	}

	[Fact]
	public async Task GetUserByUsernameOrEmailForUpdateAsync_ReturnsUser_WhenFoundByUsernameAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		await using IdentityDbContext context = CreateIdentityDbContext();
		AuthRepository repository = new(context);
		string testId = Guid.NewGuid().ToString("N")[..8];

		User user = new UserBuilder(timeProvider)
			.WithUsername($"authtest_{testId}")
			.WithEmail($"authtest_{testId}@example.com")
			.Build();

		context.Users.Add(user);
		await context.SaveChangesAsync();

		// Act
		User? result = await repository.GetUserByUsernameOrEmailForUpdateAsync(
			user.Username,
			CancellationToken.None);

		// Assert
		result.ShouldNotBeNull();
		result.Id.ShouldBe(user.Id);
		result.Username.ShouldBe(user.Username);
	}

	[Fact]
	public async Task GetUserByUsernameOrEmailForUpdateAsync_ReturnsUser_WhenFoundByEmailAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		await using IdentityDbContext context = CreateIdentityDbContext();
		AuthRepository repository = new(context);
		string testId = Guid.NewGuid().ToString("N")[..8];

		User user = new UserBuilder(timeProvider)
			.WithUsername($"emailtest_{testId}")
			.WithEmail($"emailtest_{testId}@example.com")
			.Build();

		context.Users.Add(user);
		await context.SaveChangesAsync();

		// Act
		User? result = await repository.GetUserByUsernameOrEmailForUpdateAsync(
			user.Email,
			CancellationToken.None);

		// Assert
		result.ShouldNotBeNull();
		result.Id.ShouldBe(user.Id);
	}

	[Fact]
	public async Task GetUserByUsernameOrEmailForUpdateAsync_ReturnsNull_WhenNotFoundAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		AuthRepository repository = new(context);

		// Act
		User? result = await repository.GetUserByUsernameOrEmailForUpdateAsync(
			"nonexistent_user",
			CancellationToken.None);

		// Assert
		result.ShouldBeNull();
	}

	[Fact]
	public async Task UpdateLastLoginAsync_UpdatesTimestampAndIpAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		await using IdentityDbContext context = CreateIdentityDbContext();
		AuthRepository repository = new(context);
		string testId = Guid.NewGuid().ToString("N")[..8];

		User user = new UserBuilder(timeProvider)
			.WithUsername($"logintest_{testId}")
			.WithEmail($"logintest_{testId}@example.com")
			.Build();

		context.Users.Add(user);
		await context.SaveChangesAsync();

		DateTime loginTime = timeProvider.GetUtcNow().UtcDateTime;
		string clientIp = "192.168.1.100";

		// Act
		await repository.UpdateLastLoginAsync(
			user.Id,
			loginTime,
			clientIp,
			CancellationToken.None);

		// Assert - use fresh context to verify
		await using IdentityDbContext verifyContext = CreateIdentityDbContext();
		User? updatedUser = await verifyContext.Users.FindAsync(user.Id);

		updatedUser.ShouldNotBeNull();
		updatedUser.LastLoginAt.ShouldNotBeNull();
		updatedUser.LastLoginAt.Value.ShouldBe(loginTime, TimeSpan.FromSeconds(1));
		updatedUser.LastLoginIp.ShouldBe(clientIp);
	}

	[Fact]
	public async Task GetExternalLoginAsync_ReturnsLogin_WhenExistsAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		await using IdentityDbContext context = CreateIdentityDbContext();
		AuthRepository repository = new(context);
		string testId = Guid.NewGuid().ToString("N")[..8];

		User user = new UserBuilder(timeProvider)
			.WithUsername($"oauth_{testId}")
			.WithEmail($"oauth_{testId}@example.com")
			.Build();

		context.Users.Add(user);
		await context.SaveChangesAsync();

		ExternalLogin externalLogin =
			new()
			{
				UserId = user.Id,
				Provider = "GitHub",
				ProviderUserId = $"github_{testId}",
				CreateDate = timeProvider.GetUtcNow().UtcDateTime
			};

		context.ExternalLogins.Add(externalLogin);
		await context.SaveChangesAsync();

		// Act
		ExternalLogin? result = await repository.GetExternalLoginAsync(
			"GitHub",
			$"github_{testId}",
			CancellationToken.None);

		// Assert
		result.ShouldNotBeNull();
		result.UserId.ShouldBe(user.Id);
	}

	[Fact]
	public async Task GetRoleIdByNameAsync_ReturnsRoleId_WhenExistsAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		AuthRepository repository = new(context);

		// SecurityRoles should be seeded - check for User role
		// Act
		int? roleId = await repository.GetRoleIdByNameAsync(
			"User",
			CancellationToken.None);

		// Assert
		roleId.ShouldNotBeNull();
		roleId.Value.ShouldBeGreaterThan(0);
	}

	[Fact]
	public async Task GetRoleIdByNameAsync_ReturnsNull_WhenNotFoundAsync()
	{
		// Arrange
		await using IdentityDbContext context = CreateIdentityDbContext();
		AuthRepository repository = new(context);

		// Act
		int? roleId = await repository.GetRoleIdByNameAsync(
			"NonExistentRole",
			CancellationToken.None);

		// Assert
		roleId.ShouldBeNull();
	}
}
