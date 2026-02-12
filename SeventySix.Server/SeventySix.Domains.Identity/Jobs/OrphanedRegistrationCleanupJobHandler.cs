// <copyright file="OrphanedRegistrationCleanupJobHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.Identity.Settings;
using SeventySix.Shared.BackgroundJobs;

namespace SeventySix.Identity.Jobs;

/// <summary>
/// Handles periodic cleanup of orphaned registration users.
/// Removes users who started registration but never completed email confirmation.
/// </summary>
/// <param name="dbContext">
/// The Identity database context.
/// </param>
/// <param name="recurringJobService">
/// Service for recording execution and scheduling next run.
/// </param>
/// <param name="settings">
/// Configuration for cleanup behavior.
/// </param>
/// <param name="timeProvider">
/// Provides current time for cutoff calculations.
/// </param>
/// <param name="logger">
/// Logger for diagnostic messages.
/// </param>
public class OrphanedRegistrationCleanupJobHandler(
	IdentityDbContext dbContext,
	IRecurringJobService recurringJobService,
	IOptions<OrphanedRegistrationCleanupSettings> settings,
	TimeProvider timeProvider,
	ILogger<OrphanedRegistrationCleanupJobHandler> logger)
{
	/// <summary>
	/// Handles the orphaned registration cleanup job.
	/// Deletes users where IsActive is false, EmailConfirmed is false,
	/// and CreateDate is older than the retention threshold.
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
		OrphanedRegistrationCleanupJob job,
		CancellationToken cancellationToken)
	{
		OrphanedRegistrationCleanupSettings config =
			settings.Value;

		DateTimeOffset now =
			timeProvider.GetUtcNow();

		DateTime cutoffDate =
			now.AddHours(-config.RetentionHours).UtcDateTime;

		int deletedCount =
			await dbContext.Users
				.Where(user =>
					!user.IsActive
					&& !user.EmailConfirmed
					&& user.CreateDate < cutoffDate)
				.ExecuteDeleteAsync(cancellationToken);

		if (deletedCount > 0)
		{
			logger.LogInformation(
				"Orphaned registration cleanup completed: {DeletedCount} orphaned users removed",
				deletedCount);
		}

		TimeSpan interval =
			TimeSpan.FromHours(config.IntervalHours);

		await recurringJobService.RecordAndScheduleNextAsync<OrphanedRegistrationCleanupJob>(
			nameof(OrphanedRegistrationCleanupJob),
			now,
			interval,
			cancellationToken);
	}
}