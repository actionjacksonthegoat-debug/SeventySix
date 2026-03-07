// <copyright file="IdentityJobSchedulerContributorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Configuration;
using NSubstitute;
using SeventySix.Identity.Jobs;
using SeventySix.Identity.Registration;
using SeventySix.Shared.BackgroundJobs;

namespace SeventySix.Identity.Tests.Registration;

/// <summary>
/// Unit tests for <see cref="IdentityJobSchedulerContributor"/>.
/// </summary>
public sealed class IdentityJobSchedulerContributorTests
{
	[Fact]
	public async Task ScheduleJobsAsync_WhenJobsDisabled_DoesNotScheduleAnyIdentityJobsAsync()
	{
		// Arrange
		IRecurringJobService recurringJobService =
			Substitute.For<IRecurringJobService>();

		IdentityJobSchedulerContributor contributor =
			new(
				CreateConfiguration(
					refreshEnabled: false,
					orphanedEnabled: false));

		// Act
		await contributor.ScheduleJobsAsync(
			recurringJobService,
			CancellationToken.None);

		// Assert
		await recurringJobService
			.DidNotReceive()
			.EnsureScheduledAtPreferredTimeAsync<RefreshTokenCleanupJob>(
				Arg.Any<string>(),
				Arg.Any<TimeOnly>(),
				Arg.Any<TimeSpan>(),
				Arg.Any<CancellationToken>());

		await recurringJobService
			.DidNotReceive()
			.EnsureScheduledAtPreferredTimeAsync<OrphanedRegistrationCleanupJob>(
				Arg.Any<string>(),
				Arg.Any<TimeOnly>(),
				Arg.Any<TimeSpan>(),
				Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task ScheduleJobsAsync_WhenJobsEnabled_SchedulesAnchoredIdentityJobsAsync()
	{
		// Arrange
		IRecurringJobService recurringJobService =
			Substitute.For<IRecurringJobService>();

		IdentityJobSchedulerContributor contributor =
			new(
				CreateConfiguration(
					refreshEnabled: true,
					orphanedEnabled: true));

		// Act
		await contributor.ScheduleJobsAsync(
			recurringJobService,
			CancellationToken.None);

		// Assert
		await recurringJobService
			.Received(1)
			.EnsureScheduledAtPreferredTimeAsync<RefreshTokenCleanupJob>(
				nameof(RefreshTokenCleanupJob),
				new TimeOnly(3, 15),
				TimeSpan.FromHours(24),
				Arg.Any<CancellationToken>());

		await recurringJobService
			.Received(1)
			.EnsureScheduledAtPreferredTimeAsync<OrphanedRegistrationCleanupJob>(
				nameof(OrphanedRegistrationCleanupJob),
				new TimeOnly(4, 30),
				TimeSpan.FromHours(24),
				Arg.Any<CancellationToken>());
	}

	private static IConfiguration CreateConfiguration(
		bool refreshEnabled,
		bool orphanedEnabled)
	{
		Dictionary<string, string?> values =
			new()
			{
				["RefreshTokenCleanup:Enabled"] = refreshEnabled.ToString(),
				["RefreshTokenCleanup:IntervalHours"] = "24",
				["RefreshTokenCleanup:RetentionDays"] = "30",
				["RefreshTokenCleanup:UsedTokenRetentionHours"] = "48",
				["RefreshTokenCleanup:PreferredStartHourUtc"] = "3",
				["RefreshTokenCleanup:PreferredStartMinuteUtc"] = "15",
				["OrphanedRegistrationCleanup:Enabled"] = orphanedEnabled.ToString(),
				["OrphanedRegistrationCleanup:RetentionHours"] = "48",
				["OrphanedRegistrationCleanup:IntervalHours"] = "24",
				["OrphanedRegistrationCleanup:PreferredStartHourUtc"] = "4",
				["OrphanedRegistrationCleanup:PreferredStartMinuteUtc"] = "30",
			};

		return new ConfigurationBuilder()
			.AddInMemoryCollection(values)
			.Build();
	}
}