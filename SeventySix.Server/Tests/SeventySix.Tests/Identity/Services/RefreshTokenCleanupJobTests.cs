// <copyright file="RefreshTokenCleanupJobTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.Identity.Settings;
using Shouldly;

namespace SeventySix.Tests.Identity.Services;

/// <summary>
/// Unit tests for RefreshTokenCleanupJob background service.
/// Focus: Token cleanup logic, error handling, and logging.
/// Note: ExecuteAsync is not tested directly (BackgroundService lifecycle is framework-managed).
/// </summary>
public class RefreshTokenCleanupJobTests : IDisposable
{
	private readonly IdentityDbContext DbContext;
	private readonly IServiceScopeFactory ServiceScopeFactory;
	private readonly IOptions<RefreshTokenCleanupSettings> Settings;
	private readonly ILogger<RefreshTokenCleanupJob> Logger;
	private readonly TimeProvider TimeProvider;
	private readonly RefreshTokenCleanupJob CleanupJob;
	private readonly User TestUser;

	public RefreshTokenCleanupJobTests()
	{
		// Arrange DbContext - SQLite required for ExecuteDeleteAsync support
		DbContextOptions<IdentityDbContext> options =
			new DbContextOptionsBuilder<IdentityDbContext>()
				.UseSqlite("DataSource=:memory:")
				.Options;

		this.DbContext = new IdentityDbContext(options);
		this.DbContext.Database.OpenConnection();
		this.DbContext.Database.EnsureCreated();

		// Create test user for FK constraints
		this.TestUser =
			new User
			{
				Username = "testuser",
				Email = "test@example.com",
				CreateDate = DateTime.UtcNow,
				CreatedBy = "system"
			};
		this.DbContext.Users.Add(this.TestUser);
		this.DbContext.SaveChanges();

		// Arrange ServiceScope mocking
		IServiceScope scope =
			Substitute.For<IServiceScope>();
		scope.ServiceProvider.GetService(typeof(IdentityDbContext))
			.Returns(this.DbContext);

		this.ServiceScopeFactory = Substitute.For<IServiceScopeFactory>();
		this.ServiceScopeFactory.CreateScope()
			.Returns(scope);

		// Arrange settings
		this.Settings = Options.Create(
			new RefreshTokenCleanupSettings
			{
				IntervalHours = 24,
				RetentionDays = 7
			});

		this.Logger = Substitute.For<ILogger<RefreshTokenCleanupJob>>();
		this.TimeProvider = TimeProvider.System;

		// Act
		this.CleanupJob =
			new RefreshTokenCleanupJob(
				this.ServiceScopeFactory,
				this.Settings,
				this.Logger,
				this.TimeProvider);
	}

	[Fact]
	public async Task CleanupExpiredTokensAsync_DeletesTokensExpiredMoreThanRetentionDaysAgoAsync()
	{
		// Arrange - Create tokens at different expiration times
		DateTime now =
			this.TimeProvider.GetUtcNow()
				.UtcDateTime;

		// Token expired 10 days ago (should be deleted - older than 7 days retention)
		RefreshToken oldExpiredToken =
			new()
			{
				TokenHash = "old-token-hash",
				FamilyId = Guid.NewGuid(),
				UserId = this.TestUser.Id,
				ExpiresAt = now.AddDays(-10),
				SessionStartedAt = now.AddDays(-40),
				CreateDate = now.AddDays(-40),
				IsRevoked = false
			};

		// Token expired 5 days ago (should NOT be deleted - within 7 days retention)
		RefreshToken recentExpiredToken =
			new()
			{
				TokenHash = "recent-token-hash",
				FamilyId = Guid.NewGuid(),
				UserId = this.TestUser.Id,
				ExpiresAt = now.AddDays(-5),
				SessionStartedAt = now.AddDays(-35),
				CreateDate = now.AddDays(-35),
				IsRevoked = false
			};

		// Token not yet expired (should NOT be deleted)
		RefreshToken activeToken =
			new()
			{
				TokenHash = "active-token-hash",
				FamilyId = Guid.NewGuid(),
				UserId = this.TestUser.Id,
				ExpiresAt = now.AddDays(7),
				SessionStartedAt = now,
				CreateDate = now,
				IsRevoked = false
			};

		this.DbContext.RefreshTokens.AddRange(
			oldExpiredToken,
			recentExpiredToken,
			activeToken);
		await this.DbContext.SaveChangesAsync();

		// Act
		await this.CleanupJob.CleanupExpiredTokensAsync();

		// Assert
		List<RefreshToken> remainingTokens =
			await this.DbContext.RefreshTokens.ToListAsync();

		remainingTokens.Count.ShouldBe(2);
		remainingTokens.ShouldNotContain(
			t =>
				t.Id == oldExpiredToken.Id);
		remainingTokens.ShouldContain(
			t =>
				t.Id == recentExpiredToken.Id);
		remainingTokens.ShouldContain(
			t =>
				t.Id == activeToken.Id);
	}

	[Fact]
	public async Task CleanupExpiredTokensAsync_LogsWarning_WhenTokensAreDeletedAsync()
	{
		// Arrange
		DateTime now =
			this.TimeProvider.GetUtcNow()
				.UtcDateTime;

		RefreshToken expiredToken =
			new()
			{
				TokenHash = "expired-token-hash",
				FamilyId = Guid.NewGuid(),
				UserId = this.TestUser.Id,
				ExpiresAt = now.AddDays(-10),
				SessionStartedAt = now.AddDays(-40),
				CreateDate = now.AddDays(-40),
				IsRevoked = false
			};

		this.DbContext.RefreshTokens.Add(expiredToken);
		await this.DbContext.SaveChangesAsync();

		// Act
		await this.CleanupJob.CleanupExpiredTokensAsync();

		// Assert - Verify LogWarning was called
		this.Logger.Received(1)
			.Log(
				LogLevel.Warning,
				Arg.Any<EventId>(),
				Arg.Is<object>(
					o =>
						o.ToString()!
							.Contains("Cleaned up")),
				null,
				Arg.Any<Func<object, Exception?, string>>());
	}

	[Fact]
	public async Task CleanupExpiredTokensAsync_DoesNotLog_WhenNoTokensAreDeletedAsync()
	{
		// Arrange - No expired tokens
		DateTime now =
			this.TimeProvider.GetUtcNow()
				.UtcDateTime;

		RefreshToken activeToken =
			new()
			{
				TokenHash = "active-token-hash",
				FamilyId = Guid.NewGuid(),
				UserId = this.TestUser.Id,
				ExpiresAt = now.AddDays(7),
				SessionStartedAt = now,
				CreateDate = now,
				IsRevoked = false
			};

		this.DbContext.RefreshTokens.Add(activeToken);
		await this.DbContext.SaveChangesAsync();

		// Act
		await this.CleanupJob.CleanupExpiredTokensAsync();

		// Assert - No LogWarning should be called
		this.Logger.DidNotReceive()
			.Log(
				LogLevel.Warning,
				Arg.Any<EventId>(),
				Arg.Any<object>(),
				null,
				Arg.Any<Func<object, Exception?, string>>());
	}

	[Fact]
	public async Task CleanupExpiredTokensAsync_LogsError_AndDoesNotThrow_WhenDatabaseErrorOccursAsync()
	{
		// Arrange - Create a scope factory that returns closed connection (simulates database error)
		IServiceScope failingScope =
			Substitute.For<IServiceScope>();

		DbContextOptions<IdentityDbContext> failingOptions =
			new DbContextOptionsBuilder<IdentityDbContext>()
				.UseSqlite("DataSource=:memory:")
				.Options;

		IdentityDbContext failingContext =
			new(failingOptions);

		// Don't open connection - this will cause errors when trying to query
		failingScope.ServiceProvider.GetService(typeof(IdentityDbContext))
			.Returns(failingContext);

		IServiceScopeFactory failingFactory =
			Substitute.For<IServiceScopeFactory>();
		failingFactory.CreateAsyncScope()
			.Returns(failingScope);

		RefreshTokenCleanupJob failingJob =
			new(
				failingFactory,
				this.Settings,
				this.Logger,
				this.TimeProvider);

		// Act - Should not throw (exception caught internally)
		await failingJob.CleanupExpiredTokensAsync();

		// Assert - Verify LogError was called with exception
		this.Logger.Received(1)
			.Log(
				LogLevel.Error,
				Arg.Any<EventId>(),
				Arg.Is<object>(
					o =>
						o.ToString()!
							.Contains("Error during refresh token cleanup")),
				Arg.Any<Exception>(),
				Arg.Any<Func<object, Exception?, string>>());

		failingContext.Dispose();
	}

	[Fact]
	public async Task CleanupExpiredTokensAsync_HandlesEmptyDatabaseAsync()
	{
		// Arrange - Empty database

		// Act & Assert - Should not throw
		await Should.NotThrowAsync(
			async () =>
				await this.CleanupJob.CleanupExpiredTokensAsync());

		// Assert - No tokens should exist
		int count =
			await this.DbContext.RefreshTokens.CountAsync();
		count.ShouldBe(0);
	}

	public void Dispose()
	{
		this.DbContext.Database.CloseConnection();
		this.DbContext.Dispose();
	}
}