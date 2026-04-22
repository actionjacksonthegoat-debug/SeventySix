// <copyright file="ApiTrackingJobSchedulerContributor.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Diagnostics.CodeAnalysis;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SeventySix.Shared.BackgroundJobs;
using SeventySix.Shared.Exceptions;

namespace SeventySix.ApiTracking.Jobs;

/// <summary>
/// Schedules ApiTracking domain recurring jobs.
/// </summary>
/// <param name="configuration">
/// Application configuration for reading job settings.
/// </param>
/// <param name="logger">
/// Logger for diagnostic messages.
/// </param>
[ExcludeFromCodeCoverage]
public sealed class ApiTrackingJobSchedulerContributor(
	IConfiguration configuration,
	ILogger<ApiTrackingJobSchedulerContributor> logger) : IJobSchedulerContributor
{
	/// <inheritdoc />
	public async Task ScheduleJobsAsync(
		IRecurringJobService recurringJobService,
		CancellationToken cancellationToken)
	{
		await ScheduleRetentionJobAsync(
			recurringJobService,
			cancellationToken);
	}

	/// <summary>
	/// Schedules the API tracking retention job if enabled.
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
	private async Task ScheduleRetentionJobAsync(
		IRecurringJobService recurringJobService,
		CancellationToken cancellationToken)
	{
		ApiTrackingRetentionSettings settings =
			configuration
				.GetSection(ApiTrackingRetentionSettings.SectionName)
				.Get<ApiTrackingRetentionSettings>()
			?? throw new RequiredConfigurationException(ApiTrackingRetentionSettings.SectionName);

		if (!settings.Enabled)
		{
			logger.LogInformation(
				"Skipping {JobName} - API tracking retention disabled",
				nameof(ApiTrackingRetentionJob));
			return;
		}

		TimeOnly preferredTimeUtc =
			new(
				settings.PreferredStartHourUtc,
				settings.PreferredStartMinuteUtc);

		TimeSpan interval =
			TimeSpan.FromHours(settings.IntervalHours);

		await recurringJobService.EnsureScheduledAtPreferredTimeAsync<ApiTrackingRetentionJob>(
			nameof(ApiTrackingRetentionJob),
			preferredTimeUtc,
			interval,
			cancellationToken);

		logger.LogInformation(
			"Scheduled {JobName} at {PreferredTime:HH:mm} UTC with interval {Interval}",
			nameof(ApiTrackingRetentionJob),
			preferredTimeUtc,
			interval);
	}
}