// <copyright file="RefreshTokenCleanupJobHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.Identity.Jobs;
using SeventySix.Identity.Settings;
using SeventySix.Shared.BackgroundJobs;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Jobs;

/// <summary>
/// Integration tests for <see cref="RefreshTokenCleanupJobHandler"/>.
/// Tests verify that expired refresh tokens are properly cleaned up.
/// </summary>
/// <remarks>
/// 80/20 Focus: Tests the critical cleanup logic with real database.
/// Security: Verifies tokens are properly deleted after retention period.
/// </remarks>
[Collection(CollectionNames.PostgreSql)]
public class RefreshTokenCleanupJobHandlerTests(
	TestcontainersPostgreSqlFixture fixture) : DataPostgreSqlTestBase(fixture)
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
				.WithExpiresAt(TestTime.AddDays(-10).UtcDateTime)
				.Build();

		// Create an expired token that's within retention (expired 3 days ago)
		RefreshToken expiredRecentToken =
			new RefreshTokenBuilder(timeProvider)
				.WithUserId(user.Id)
				.WithExpiresAt(TestTime.AddDays(-3).UtcDateTime)
				.Build();

		// Create a valid token (not expired)
		RefreshToken validToken =
			new RefreshTokenBuilder(timeProvider)
				.WithUserId(user.Id)
				.WithExpiresAt(TestTime.AddDays(7).UtcDateTime)
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
}
