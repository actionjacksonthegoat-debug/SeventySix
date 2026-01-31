// <copyright file="IpAnonymizationJobHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

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
public class IpAnonymizationJobHandler(
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

		DateTimeOffset now =
			timeProvider.GetUtcNow();

		DateTime cutoffDate =
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

		TimeSpan interval =
			TimeSpan.FromDays(config.IntervalDays);

		await recurringJobService.RecordAndScheduleNextAsync<IpAnonymizationJob>(
			nameof(IpAnonymizationJob),
			now,
			interval,
			cancellationToken);
	}
}