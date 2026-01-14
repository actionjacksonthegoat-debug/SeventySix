// <copyright file="ScheduledJobService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Options;
using SeventySix.ElectronicNotifications.Emails;
using SeventySix.Identity.Settings;
using SeventySix.Logging;
using SeventySix.Shared.BackgroundJobs;
using SeventySix.Shared.Constants;

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Service for retrieving scheduled background job statuses with health indicators.
/// </summary>
/// <param name="recurringJobRepository">
/// Repository for accessing recurring job execution records.
/// </param>
/// <param name="refreshTokenCleanupSettings">
/// Configuration settings for the refresh token cleanup job.
/// </param>
/// <param name="ipAnonymizationSettings">
/// Configuration settings for the IP anonymization job.
/// </param>
/// <param name="logCleanupSettings">
/// Configuration settings for the log cleanup job.
/// </param>
/// <param name="emailQueueSettings">
/// Configuration settings for the email queue processor.
/// </param>
/// <param name="timeProvider">
/// Abstraction for time-related operations.
/// </param>
public class ScheduledJobService(
	IRecurringJobRepository recurringJobRepository,
	IOptions<RefreshTokenCleanupSettings> refreshTokenCleanupSettings,
	IOptions<IpAnonymizationSettings> ipAnonymizationSettings,
	IOptions<LogCleanupSettings> logCleanupSettings,
	IOptions<EmailQueueSettings> emailQueueSettings,
	TimeProvider timeProvider) : IScheduledJobService
{
	/// <summary>
	/// Grace period multiplier for health status calculation.
	/// A job is considered unhealthy if it hasn't run within
	/// (expected interval) * (1 + GracePeriodMultiplier).
	/// </summary>
	private const double GracePeriodMultiplier = 0.1;

	/// <summary>
	/// Metadata for each known scheduled job, keyed by job name.
	/// Contains display information and expected execution intervals.
	/// </summary>
	private readonly Dictionary<string, (string DisplayName, TimeSpan Interval)> JobMetadata =
		new()
		{
			["RefreshTokenCleanupJob"] =
				("Refresh Token Cleanup", TimeSpan.FromHours(refreshTokenCleanupSettings.Value.IntervalHours)),
			["IpAnonymizationJob"] =
				("IP Anonymization", TimeSpan.FromDays(ipAnonymizationSettings.Value.IntervalDays)),
			["LogCleanupJob"] =
				("Log Cleanup", TimeSpan.FromHours(logCleanupSettings.Value.IntervalHours)),
			["EmailQueueProcessJob"] =
				("Email Queue Processor", TimeSpan.FromSeconds(emailQueueSettings.Value.ProcessingIntervalSeconds)),
		};

	/// <inheritdoc />
	public async Task<IReadOnlyList<RecurringJobStatusResponse>> GetAllJobStatusesAsync(
		CancellationToken cancellationToken)
	{
		IReadOnlyList<RecurringJobExecution> executions =
			await recurringJobRepository.GetAllAsync(cancellationToken);

		Dictionary<string, RecurringJobExecution> executionsByName =
			executions.ToDictionary(
				execution => execution.JobName,
				execution => execution);

		List<RecurringJobStatusResponse> responses =
			[];

		foreach (KeyValuePair<string, (string DisplayName, TimeSpan Interval)> jobEntry in JobMetadata)
		{
			executionsByName.TryGetValue(
				jobEntry.Key,
				out RecurringJobExecution? execution);

			RecurringJobStatusResponse response =
				MapToResponse(
					jobEntry.Key,
					jobEntry.Value.DisplayName,
					jobEntry.Value.Interval,
					execution);

			responses.Add(response);
		}

		return responses;
	}

	/// <summary>
	/// Maps job metadata and execution record to a response DTO.
	/// </summary>
	/// <param name="jobName">
	/// The internal job identifier name.
	/// </param>
	/// <param name="displayName">
	/// The user-friendly display name for the job.
	/// </param>
	/// <param name="interval">
	/// The expected execution interval for the job.
	/// </param>
	/// <param name="execution">
	/// The most recent execution record, if available.
	/// </param>
	/// <returns>
	/// A response DTO containing job status information.
	/// </returns>
	private RecurringJobStatusResponse MapToResponse(
		string jobName,
		string displayName,
		TimeSpan interval,
		RecurringJobExecution? execution)
	{
		string status =
			CalculateHealthStatus(
				execution,
				interval);

		string formattedInterval =
			FormatIntervalForDisplay(interval);

		DateTimeOffset? lastExecutedAt =
			execution?.LastExecutedAt;

		DateTimeOffset? nextScheduledAt =
			execution?.NextScheduledAt;

		string lastExecutedBy =
			execution?.LastExecutedBy ?? "N/A";

		return new RecurringJobStatusResponse
		{
			JobName = jobName,
			DisplayName = displayName,
			LastExecutedAt = lastExecutedAt,
			NextScheduledAt = nextScheduledAt,
			LastExecutedBy = lastExecutedBy,
			Status = status,
			Interval = formattedInterval,
		};
	}

	/// <summary>
	/// Calculates the health status based on execution timing.
	/// </summary>
	/// <param name="execution">
	/// The most recent execution record, if available.
	/// </param>
	/// <param name="expectedInterval">
	/// The expected execution interval for the job.
	/// </param>
	/// <returns>
	/// A health status string: "Healthy", "Degraded", or "Unknown".
	/// </returns>
	private string CalculateHealthStatus(
		RecurringJobExecution? execution,
		TimeSpan expectedInterval)
	{
		if (execution is null)
		{
			return HealthStatusConstants.Unknown;
		}

		DateTimeOffset now =
			timeProvider.GetUtcNow();

		TimeSpan timeSinceLastExecution =
			now - execution.LastExecutedAt;

		TimeSpan maximumAllowedInterval =
			expectedInterval * (1 + GracePeriodMultiplier);

		return timeSinceLastExecution <= maximumAllowedInterval
			? HealthStatusConstants.Healthy
			: HealthStatusConstants.Degraded;
	}

	/// <summary>
	/// Formats a time interval for user-friendly display.
	/// </summary>
	/// <param name="interval">
	/// The time interval to format.
	/// </param>
	/// <returns>
	/// A human-readable string representation of the interval.
	/// </returns>
	private static string FormatIntervalForDisplay(TimeSpan interval)
	{
		if (interval.TotalDays >= 1)
		{
			int days =
				(int)interval.TotalDays;

			return days == 1
				? "Daily"
				: $"Every {days} days";
		}

		if (interval.TotalHours >= 1)
		{
			int hours =
				(int)interval.TotalHours;

			return hours == 1
				? "Hourly"
				: $"Every {hours} hours";
		}

		if (interval.TotalMinutes >= 1)
		{
			int minutes =
				(int)interval.TotalMinutes;

			return minutes == 1
				? "Every minute"
				: $"Every {minutes} minutes";
		}

		int seconds =
			(int)interval.TotalSeconds;

		return seconds == 1
			? "Every second"
			: $"Every {seconds} seconds";
	}
}
