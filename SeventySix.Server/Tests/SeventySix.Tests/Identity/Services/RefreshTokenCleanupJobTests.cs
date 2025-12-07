// <copyright file="RefreshTokenCleanupJobTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
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
	private readonly IdentityDbContext dbContext;
	private readonly IServiceScopeFactory serviceScopeFactory;
	private readonly IOptions<RefreshTokenCleanupSettings> settings;
	private readonly ILogger<RefreshTokenCleanupJob> logger;
	private readonly TimeProvider timeProvider;
	private readonly RefreshTokenCleanupJob cleanupJob;
	private readonly User testUser;

	public RefreshTokenCleanupJobTests()
	{
		// Arrange DbContext - SQLite required for ExecuteDeleteAsync support
		DbContextOptions<IdentityDbContext> options =
			new DbContextOptionsBuilder<IdentityDbContext>()
				.UseSqlite("DataSource=:memory:")
				.Options;

		this.dbContext = new IdentityDbContext(options);
		this.dbContext.Database.OpenConnection();
		this.dbContext.Database.EnsureCreated();

		// Create test user for FK constraints
		this.testUser =
			new User
			{
				Username = "testuser",
				Email = "test@example.com",
				CreateDate = DateTime.UtcNow,
				CreatedBy = "system"
			};
		this.dbContext.Users.Add(this.testUser);
		this.dbContext.SaveChanges();

		// Arrange ServiceScope mocking
		IServiceScope scope =
			Substitute.For<IServiceScope>();
		scope.ServiceProvider.GetService(typeof(IdentityDbContext))
			.Returns(this.dbContext);

		this.serviceScopeFactory = Substitute.For<IServiceScopeFactory>();
		this.serviceScopeFactory.CreateScope()
			.Returns(scope);

		// Arrange settings
		this.settings = Options.Create(
			new RefreshTokenCleanupSettings
			{
				IntervalHours = 24,
				RetentionDays = 7
			});

		this.logger = Substitute.For<ILogger<RefreshTokenCleanupJob>>();
		this.timeProvider = TimeProvider.System;

		// Act
		this.cleanupJob =
			new RefreshTokenCleanupJob(
				this.serviceScopeFactory,
				this.settings,
				this.logger,
				this.timeProvider);
	}

	[Fact]
	public async Task CleanupExpiredTokensAsync_DeletesTokensExpiredMoreThanRetentionDaysAgo()
	{
		// Arrange - Create tokens at different expiration times
		DateTime now =
			this.timeProvider.GetUtcNow()
				.UtcDateTime;

		// Token expired 10 days ago (should be deleted - older than 7 days retention)
		RefreshToken oldExpiredToken =
			new()
			{
				TokenHash = "old-token-hash",
				FamilyId = Guid.NewGuid(),
				UserId = this.testUser.Id,
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
				UserId = this.testUser.Id,
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
				UserId = this.testUser.Id,
				ExpiresAt = now.AddDays(7),
				SessionStartedAt = now,
				CreateDate = now,
				IsRevoked = false
			};

		this.dbContext.RefreshTokens.AddRange(
			oldExpiredToken,
			recentExpiredToken,
			activeToken);
		await this.dbContext.SaveChangesAsync();

		// Act
		await this.cleanupJob.CleanupExpiredTokensAsync();

		// Assert
		List<RefreshToken> remainingTokens =
			await this.dbContext.RefreshTokens.ToListAsync();

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
	public async Task CleanupExpiredTokensAsync_LogsWarning_WhenTokensAreDeleted()
	{
		// Arrange
		DateTime now =
			this.timeProvider.GetUtcNow()
				.UtcDateTime;

		RefreshToken expiredToken =
			new()
			{
				TokenHash = "expired-token-hash",
				FamilyId = Guid.NewGuid(),
				UserId = this.testUser.Id,
				ExpiresAt = now.AddDays(-10),
				SessionStartedAt = now.AddDays(-40),
				CreateDate = now.AddDays(-40),
				IsRevoked = false
			};

		this.dbContext.RefreshTokens.Add(expiredToken);
		await this.dbContext.SaveChangesAsync();

		// Act
		await this.cleanupJob.CleanupExpiredTokensAsync();

		// Assert - Verify LogWarning was called
		this.logger.Received(1)
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
	public async Task CleanupExpiredTokensAsync_DoesNotLog_WhenNoTokensAreDeleted()
	{
		// Arrange - No expired tokens
		DateTime now =
			this.timeProvider.GetUtcNow()
				.UtcDateTime;

		RefreshToken activeToken =
			new()
			{
				TokenHash = "active-token-hash",
				FamilyId = Guid.NewGuid(),
				UserId = this.testUser.Id,
				ExpiresAt = now.AddDays(7),
				SessionStartedAt = now,
				CreateDate = now,
				IsRevoked = false
			};

		this.dbContext.RefreshTokens.Add(activeToken);
		await this.dbContext.SaveChangesAsync();

		// Act
		await this.cleanupJob.CleanupExpiredTokensAsync();

		// Assert - No LogWarning should be called
		this.logger.DidNotReceive()
			.Log(
				LogLevel.Warning,
				Arg.Any<EventId>(),
				Arg.Any<object>(),
				null,
				Arg.Any<Func<object, Exception?, string>>());
	}

	[Fact]
	public async Task CleanupExpiredTokensAsync_LogsError_AndDoesNotThrow_WhenDatabaseErrorOccurs()
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
				this.settings,
				this.logger,
				this.timeProvider);

		// Act - Should not throw (exception caught internally)
		await failingJob.CleanupExpiredTokensAsync();

		// Assert - Verify LogError was called with exception
		this.logger.Received(1)
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
	public async Task CleanupExpiredTokensAsync_HandlesEmptyDatabase()
	{
		// Arrange - Empty database

		// Act & Assert - Should not throw
		await Should.NotThrowAsync(
			async () =>
				await this.cleanupJob.CleanupExpiredTokensAsync());

		// Assert - No tokens should exist
		int count =
			await this.dbContext.RefreshTokens.CountAsync();
		count.ShouldBe(0);
	}

	public void Dispose()
	{
		this.dbContext.Database.CloseConnection();
		this.dbContext.Dispose();
	}
}