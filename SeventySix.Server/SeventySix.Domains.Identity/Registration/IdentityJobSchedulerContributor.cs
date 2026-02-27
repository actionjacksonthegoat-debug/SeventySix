// <copyright file="IdentityJobSchedulerContributor.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Diagnostics.CodeAnalysis;
using Microsoft.Extensions.Configuration;
using SeventySix.Identity.Jobs;
using SeventySix.Identity.Settings;
using SeventySix.Shared.BackgroundJobs;
using SeventySix.Shared.Exceptions;

namespace SeventySix.Identity.Registration;

/// <summary>
/// Schedules Identity-specific recurring jobs.
/// Contributes to the application's job scheduling without cross-domain dependencies.
/// </summary>
/// <param name="configuration">
/// Application configuration for reading job settings.
/// </param>
[ExcludeFromCodeCoverage]
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

		await ScheduleOrphanedRegistrationCleanupJobAsync(
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
			?? throw new RequiredConfigurationException(RefreshTokenCleanupSettings.SectionName);

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
			?? throw new RequiredConfigurationException(IpAnonymizationSettings.SectionName);

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

	/// <summary>
	/// Schedules the orphaned registration cleanup job.
	/// Removes users who started registration but never completed email confirmation.
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
	private async Task ScheduleOrphanedRegistrationCleanupJobAsync(
		IRecurringJobService recurringJobService,
		CancellationToken cancellationToken)
	{
		OrphanedRegistrationCleanupSettings settings =
			configuration
				.GetSection(OrphanedRegistrationCleanupSettings.SectionName)
				.Get<OrphanedRegistrationCleanupSettings>()
			?? throw new RequiredConfigurationException(OrphanedRegistrationCleanupSettings.SectionName);

		TimeOnly preferredTimeUtc =
			new(
				settings.PreferredStartHourUtc,
				settings.PreferredStartMinuteUtc);

		TimeSpan interval =
			TimeSpan.FromHours(settings.IntervalHours);

		await recurringJobService.EnsureScheduledAtPreferredTimeAsync<OrphanedRegistrationCleanupJob>(
			nameof(OrphanedRegistrationCleanupJob),
			preferredTimeUtc,
			interval,
			cancellationToken);
	}
}