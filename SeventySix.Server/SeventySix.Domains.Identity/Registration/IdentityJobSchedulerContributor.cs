// <copyright file="IdentityJobSchedulerContributor.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Configuration;
using SeventySix.Identity.Jobs;
using SeventySix.Identity.Settings;
using SeventySix.Shared.BackgroundJobs;

namespace SeventySix.Identity.Registration;

/// <summary>
/// Schedules Identity-specific recurring jobs.
/// Contributes to the application's job scheduling without cross-domain dependencies.
/// </summary>
/// <param name="configuration">
/// Application configuration for reading job settings.
/// </param>
public sealed class IdentityJobSchedulerContributor(
	IConfiguration configuration) : IJobSchedulerContributor
{
	/// <inheritdoc />
	public async Task ScheduleJobsAsync(
		IRecurringJobService recurringJobService,
		CancellationToken cancellationToken)
	{
		await ScheduleRefreshTokenCleanupJobAsync(
			recurringJobService,
			cancellationToken);

		await ScheduleIpAnonymizationJobAsync(
			recurringJobService,
			cancellationToken);
	}

	/// <summary>
	/// Schedules the refresh token cleanup job.
	/// </summary>
	/// <param name="recurringJobService">
	/// The recurring job service for scheduling.
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	private async Task ScheduleRefreshTokenCleanupJobAsync(
		IRecurringJobService recurringJobService,
		CancellationToken cancellationToken)
	{
		RefreshTokenCleanupSettings settings =
			configuration
				.GetSection(RefreshTokenCleanupSettings.SectionName)
				.Get<RefreshTokenCleanupSettings>()
			?? new();

		TimeOnly preferredTimeUtc =
			new(
				settings.PreferredStartHourUtc,
				settings.PreferredStartMinuteUtc);

		TimeSpan interval =
			TimeSpan.FromHours(settings.IntervalHours);

		await recurringJobService.EnsureScheduledAtPreferredTimeAsync<RefreshTokenCleanupJob>(
			nameof(RefreshTokenCleanupJob),
			preferredTimeUtc,
			interval,
			cancellationToken);
	}

	/// <summary>
	/// Schedules the IP anonymization job for GDPR compliance.
	/// </summary>
	/// <param name="recurringJobService">
	/// The recurring job service for scheduling.
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	private async Task ScheduleIpAnonymizationJobAsync(
		IRecurringJobService recurringJobService,
		CancellationToken cancellationToken)
	{
		IpAnonymizationSettings settings =
			configuration
				.GetSection(IpAnonymizationSettings.SectionName)
				.Get<IpAnonymizationSettings>()
			?? new();

		TimeOnly preferredTimeUtc =
			new(
				settings.PreferredStartHourUtc,
				settings.PreferredStartMinuteUtc);

		TimeSpan interval =
			TimeSpan.FromDays(settings.IntervalDays);

		await recurringJobService.EnsureScheduledAtPreferredTimeAsync<IpAnonymizationJob>(
			nameof(IpAnonymizationJob),
			preferredTimeUtc,
			interval,
			cancellationToken);
	}
}