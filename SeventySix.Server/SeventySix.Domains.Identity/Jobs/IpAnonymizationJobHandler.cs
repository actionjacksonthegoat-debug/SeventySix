// <copyright file="IpAnonymizationJobHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Identity.Settings;
using SeventySix.Shared.BackgroundJobs;

namespace SeventySix.Identity.Jobs;

/// <summary>
/// Handles periodic anonymization of old IP addresses for GDPR compliance.
/// </summary>
/// <param name="dbContext">
/// The Identity database context.
/// </param>
/// <param name="recurringJobService">
/// Service for recording execution and scheduling next run.
/// </param>
/// <param name="settings">
/// Configuration for anonymization behavior.
/// </param>
/// <param name="timeProvider">
/// Provides current time for cutoff calculations.
/// </param>
/// <param name="logger">
/// Logger for diagnostic messages.
/// </param>
public sealed class IpAnonymizationJobHandler(
	IdentityDbContext dbContext,
	IRecurringJobService recurringJobService,
	IOptions<IpAnonymizationSettings> settings,
	TimeProvider timeProvider,
	ILogger<IpAnonymizationJobHandler> logger)
{
	/// <summary>
	/// Handles the IP anonymization job.
	/// </summary>
	/// <param name="job">
	/// The job message (marker type).
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	public async Task HandleAsync(
		IpAnonymizationJob job,
		CancellationToken cancellationToken)
	{
		IpAnonymizationSettings config =
			settings.Value;

		await ExecuteAnonymizationAsync(config, cancellationToken);

		// ALWAYS reschedule — never break the chain
		DateTimeOffset now =
			timeProvider.GetUtcNow();

		TimeSpan interval =
			TimeSpan.FromDays(config.IntervalDays);

		await recurringJobService.RecordAndScheduleNextAsync<IpAnonymizationJob>(
			nameof(IpAnonymizationJob),
			now,
			interval,
			cancellationToken);
	}

	/// <summary>
	/// Executes the anonymization work in a try/catch to ensure rescheduling
	/// always occurs even when errors happen. This is GDPR-critical —
	/// the rescheduling chain must never break.
	/// </summary>
	/// <param name="config">
	/// The IP anonymization settings.
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	private async Task ExecuteAnonymizationAsync(
		IpAnonymizationSettings config,
		CancellationToken cancellationToken)
	{
		try
		{
			DateTimeOffset now =
				timeProvider.GetUtcNow();

			DateTimeOffset cutoffDate =
				now.AddDays(-config.RetentionDays).UtcDateTime;

			int anonymizedCount =
				await dbContext.Users
					.Where(
						user => user.LastLoginIp != null)
					.Where(
						user => user.LastLoginAt <= cutoffDate)
					.ExecuteUpdateAsync(
						setter => setter.SetProperty(
							user => user.LastLoginIp,
							(string?)null),
						cancellationToken);

			if (anonymizedCount > 0)
			{
				logger.LogInformation(
					"IP anonymization completed: {AnonymizedCount} user IP addresses anonymized",
					anonymizedCount);
			}
		}
		catch (DbUpdateException exception)
		{
			logger.LogError(
				exception,
				"Database update error during {JobName}. Job will reschedule normally.",
				nameof(IpAnonymizationJob));
		}
		catch (DbException exception)
		{
			logger.LogError(
				exception,
				"Database error during {JobName}. Job will reschedule normally.",
				nameof(IpAnonymizationJob));
		}
		catch (InvalidOperationException exception)
		{
			logger.LogError(
				exception,
				"Operation error during {JobName}. Job will reschedule normally.",
				nameof(IpAnonymizationJob));
		}
	}
}