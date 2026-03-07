// <copyright file="RefreshTokenCleanupJobHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Identity.Jobs;
using SeventySix.Identity.Settings;
using SeventySix.Shared.BackgroundJobs;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Identity.Tests.Jobs;

/// <summary>
/// Integration tests for <see cref="RefreshTokenCleanupJobHandler"/>.
/// Tests verify that expired refresh tokens are properly cleaned up.
/// </summary>
/// <remarks>
/// 80/20 Focus: Tests the critical cleanup logic with real database.
/// Security: Verifies tokens are properly deleted after retention period.
/// </remarks>
[Collection(CollectionNames.IdentityPostgreSql)]
public sealed class RefreshTokenCleanupJobHandlerTests(
	IdentityPostgreSqlFixture fixture) : DataPostgreSqlTestBase(fixture)
{
	private static readonly DateTimeOffset TestTime =
		TestTimeProviderBuilder.DefaultTime;

	/// <summary>
	/// Verifies that expired tokens older than retention period are deleted.
	/// </summary>
	[Fact]
	public async Task HandleAsync_ExpiredTokensOlderThanRetention_DeletesTokensAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider =
			new(TestTime);

		await using IdentityDbContext context =
			CreateIdentityDbContext();

		RefreshTokenCleanupSettings settings =
			new()
			{
				Enabled = true,
				RetentionDays = 7,
				IntervalHours = 24,
			};

		IRecurringJobService recurringJobService =
			Substitute.For<IRecurringJobService>();

		RefreshTokenCleanupJobHandler handler =
			new(
				context,
				recurringJobService,
				Options.Create(settings),
				timeProvider,
				NullLogger<RefreshTokenCleanupJobHandler>.Instance);

		// Create a user first
		ApplicationUser user =
			new UserBuilder(timeProvider)
				.WithUsername("cleanup_test")
				.WithEmail("cleanup@test.com")
				.Build();

		context.Users.Add(user);
		await context.SaveChangesAsync();

		// Create an expired token that's older than retention (expired 10 days ago)
		RefreshToken expiredOldToken =
			new RefreshTokenBuilder(timeProvider)
				.WithUserId(user.Id)
				.WithExpiresAt(TestTime.AddDays(-10))
				.Build();

		// Create an expired token that's within retention (expired 3 days ago)
		RefreshToken expiredRecentToken =
			new RefreshTokenBuilder(timeProvider)
				.WithUserId(user.Id)
				.WithExpiresAt(TestTime.AddDays(-3))
				.Build();

		// Create a valid token (not expired)
		RefreshToken validToken =
			new RefreshTokenBuilder(timeProvider)
				.WithUserId(user.Id)
				.WithExpiresAt(TestTime.AddDays(7))
				.Build();

		context.RefreshTokens.AddRange(
			expiredOldToken,
			expiredRecentToken,
			validToken);
		await context.SaveChangesAsync();

		// Act
		await handler.HandleAsync(
			new RefreshTokenCleanupJob(),
			CancellationToken.None);

		// Assert - Only the token expired beyond retention should be deleted
		List<RefreshToken> remainingTokens =
			await context.RefreshTokens
				.Where(token => token.UserId == user.Id)
				.ToListAsync();

		remainingTokens.Count.ShouldBe(2);
		remainingTokens.ShouldNotContain(
			token => token.Id == expiredOldToken.Id);
	}

	/// <summary>
	/// Verifies that the job schedules the next execution.
	/// </summary>
	[Fact]
	public async Task HandleAsync_Always_SchedulesNextExecutionAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider =
			new(TestTime);

		await using IdentityDbContext context =
			CreateIdentityDbContext();

		RefreshTokenCleanupSettings settings =
			new()
			{
				Enabled = true,
				RetentionDays = 7,
				IntervalHours = 12,
			};

		IRecurringJobService recurringJobService =
			Substitute.For<IRecurringJobService>();

		RefreshTokenCleanupJobHandler handler =
			new(
				context,
				recurringJobService,
				Options.Create(settings),
				timeProvider,
				NullLogger<RefreshTokenCleanupJobHandler>.Instance);

		// Act
		await handler.HandleAsync(
			new RefreshTokenCleanupJob(),
			CancellationToken.None);

		// Assert - Verify next execution was scheduled with correct interval
		await recurringJobService
			.Received(1)
			.RecordAndScheduleNextAsync<RefreshTokenCleanupJob>(
				nameof(RefreshTokenCleanupJob),
				TestTime,
				TimeSpan.FromHours(12),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Verifies that no cleanup occurs when disabled, but rescheduling still happens.
	/// </summary>
	[Fact]
	public async Task HandleAsync_WhenDisabled_SkipsWorkButReschedulesAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider =
			new(TestTime);

		await using IdentityDbContext context =
			CreateIdentityDbContext();

		RefreshTokenCleanupSettings settings =
			new()
			{
				Enabled = false,
				RetentionDays = 7,
				IntervalHours = 24,
			};

		IRecurringJobService recurringJobService =
			Substitute.For<IRecurringJobService>();

		RefreshTokenCleanupJobHandler handler =
			new(
				context,
				recurringJobService,
				Options.Create(settings),
				timeProvider,
				NullLogger<RefreshTokenCleanupJobHandler>.Instance);

		// Create a token that WOULD be deleted if cleanup was enabled
		ApplicationUser user =
			new UserBuilder(timeProvider)
				.WithUsername("disabled_cleanup")
				.WithEmail("disabled@test.com")
				.Build();

		context.Users.Add(user);
		await context.SaveChangesAsync();

		RefreshToken expiredToken =
			new RefreshTokenBuilder(timeProvider)
				.WithUserId(user.Id)
				.WithExpiresAt(TestTime.AddDays(-10))
				.Build();

		context.RefreshTokens.Add(expiredToken);
		await context.SaveChangesAsync();

		long tokenId = expiredToken.Id;

		// Act
		await handler.HandleAsync(
			new RefreshTokenCleanupJob(),
			CancellationToken.None);

		// Assert — token should NOT be deleted when cleanup is disabled
		bool tokenExists =
			await context.RefreshTokens
				.AnyAsync(token => token.Id == tokenId);

		tokenExists.ShouldBeTrue();

		// Assert — rescheduling should still occur
		await recurringJobService
			.Received(1)
			.RecordAndScheduleNextAsync<RefreshTokenCleanupJob>(
				nameof(RefreshTokenCleanupJob),
				TestTime,
				TimeSpan.FromHours(24),
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Verifies that an exception type NOT handled by the inner catch (e.g., HttpRequestException)
	/// is caught by the outer try/catch and rescheduling still occurs.
	/// </summary>
	[Fact]
	public async Task HandleAsync_UncaughtExceptionDuringWork_StillReschedulesNextRunAsync()
	{
		// Arrange — TimeProvider throws on first call (inside ExecuteCleanupAsync),
		// returns normal time on second call (for reschedule in HandleAsync)
		TimeProvider timeProvider =
			Substitute.For<TimeProvider>();

		timeProvider
			.GetUtcNow()
			.Returns(
				_ => throw new HttpRequestException("Transient failure"),
				_ => TestTime);

		await using IdentityDbContext context =
			CreateIdentityDbContext();

		RefreshTokenCleanupSettings settings =
			new()
			{
				Enabled = true,
				RetentionDays = 7,
				IntervalHours = 24,
			};

		IRecurringJobService recurringJobService =
			Substitute.For<IRecurringJobService>();

		RefreshTokenCleanupJobHandler handler =
			new(
				context,
				recurringJobService,
				Options.Create(settings),
				timeProvider,
				NullLogger<RefreshTokenCleanupJobHandler>.Instance);

		// Act — must not throw
		await handler.HandleAsync(
			new RefreshTokenCleanupJob(),
			CancellationToken.None);

		// Assert — reschedule MUST still happen despite uncaught exception type
		await recurringJobService
			.Received(1)
			.RecordAndScheduleNextAsync<RefreshTokenCleanupJob>(
				nameof(RefreshTokenCleanupJob),
				TestTime,
				TimeSpan.FromHours(24),
				Arg.Any<CancellationToken>());
	}
}