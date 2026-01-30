// <copyright file="IpAnonymizationJobHandlerTests.cs" company="SeventySix">
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

namespace SeventySix.Identity.Tests.Jobs;

/// <summary>
/// Integration tests for <see cref="IpAnonymizationJobHandler"/>.
/// Tests verify that IP addresses are properly anonymized for GDPR compliance.
/// </summary>
/// <remarks>
/// 80/20 Focus: Tests the critical anonymization logic with real database.
/// Security/GDPR: Verifies IP addresses are removed after retention period.
/// </remarks>
[Collection(CollectionNames.IdentityPostgreSql)]
public class IpAnonymizationJobHandlerTests(
	IdentityPostgreSqlFixture fixture) : DataPostgreSqlTestBase(fixture)
{
	private static readonly DateTimeOffset TestTime =
		TestTimeProviderBuilder.DefaultTime;

	/// <summary>
	/// Verifies that IP addresses older than retention period are anonymized.
	/// </summary>
	[Fact]
	public async Task HandleAsync_OldLoginIp_AnonymizesIpAddressAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider =
			new(TestTime);

		await using IdentityDbContext context =
			CreateIdentityDbContext();

		IpAnonymizationSettings settings =
			new()
			{
				RetentionDays = 90,
				IntervalDays = 7,
			};

		IRecurringJobService recurringJobService =
			Substitute.For<IRecurringJobService>();

		IpAnonymizationJobHandler handler =
			new(
				context,
				recurringJobService,
				Options.Create(settings),
				timeProvider,
				NullLogger<IpAnonymizationJobHandler>.Instance);

		// Create user with old login (100 days ago - older than 90 day retention)
		ApplicationUser oldLoginUser =
			new UserBuilder(timeProvider)
				.WithUsername("old_login_user")
				.WithEmail("old@test.com")
				.WithLastLogin(
					TestTime.AddDays(-100).UtcDateTime,
					"192.168.1.100")
				.Build();

		// Create user with recent login (30 days ago - within 90 day retention)
		ApplicationUser recentLoginUser =
			new UserBuilder(timeProvider)
				.WithUsername("recent_login_user")
				.WithEmail("recent@test.com")
				.WithLastLogin(
					TestTime.AddDays(-30).UtcDateTime,
					"192.168.1.200")
				.Build();

		// Create user with no IP (should be unaffected)
		ApplicationUser noIpUser =
			new UserBuilder(timeProvider)
				.WithUsername("no_ip_user")
				.WithEmail("noip@test.com")
				.WithLastLogin(TestTime.AddDays(-100).UtcDateTime)
				.Build();

		context.Users.AddRange(
			oldLoginUser,
			recentLoginUser,
			noIpUser);
		await context.SaveChangesAsync();

		// Act
		await handler.HandleAsync(
			new IpAnonymizationJob(),
			CancellationToken.None);

		// Assert - Only old login user's IP should be anonymized
		// Use a fresh DbContext to verify database changes (ExecuteUpdateAsync bypasses change tracker)
		await using IdentityDbContext verifyContext =
			CreateIdentityDbContext();

		ApplicationUser? updatedOldUser =
			await verifyContext.Users
				.FirstOrDefaultAsync(user => user.Id == oldLoginUser.Id);

		ApplicationUser? updatedRecentUser =
			await verifyContext.Users
				.FirstOrDefaultAsync(user => user.Id == recentLoginUser.Id);

		updatedOldUser!.LastLoginIp.ShouldBeNull();
		updatedRecentUser!.LastLoginIp.ShouldBe("192.168.1.200");
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

		IpAnonymizationSettings settings =
			new()
			{
				RetentionDays = 90,
				IntervalDays = 14,
			};

		IRecurringJobService recurringJobService =
			Substitute.For<IRecurringJobService>();

		IpAnonymizationJobHandler handler =
			new(
				context,
				recurringJobService,
				Options.Create(settings),
				timeProvider,
				NullLogger<IpAnonymizationJobHandler>.Instance);

		// Act
		await handler.HandleAsync(
			new IpAnonymizationJob(),
			CancellationToken.None);

		// Assert - Verify next execution was scheduled with correct interval
		await recurringJobService
			.Received(1)
			.RecordAndScheduleNextAsync<IpAnonymizationJob>(
				nameof(IpAnonymizationJob),
				TestTime,
				TimeSpan.FromDays(14),
				Arg.Any<CancellationToken>());
	}
}