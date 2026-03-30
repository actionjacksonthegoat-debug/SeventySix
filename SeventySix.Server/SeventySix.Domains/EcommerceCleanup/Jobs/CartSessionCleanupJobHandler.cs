// <copyright file="CartSessionCleanupJobHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Data.Common;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.EcommerceCleanup.Repositories;
using SeventySix.EcommerceCleanup.Settings;
using SeventySix.Shared.BackgroundJobs;

namespace SeventySix.EcommerceCleanup.Jobs;

/// <summary>
/// Handles periodic cleanup of expired cart sessions from ecommerce databases.
/// Cleans both SvelteKit and TanStack databases in each execution cycle.
/// </summary>
/// <param name="repository">
/// Repository for ecommerce database cleanup operations.
/// </param>
/// <param name="recurringJobService">
/// Service for recording execution and scheduling next run.
/// </param>
/// <param name="settings">
/// Configuration for cleanup behavior and database connections.
/// </param>
/// <param name="timeProvider">
/// Provides current time for cutoff calculations.
/// </param>
/// <param name="logger">
/// Logger for diagnostic messages.
/// </param>
public sealed class CartSessionCleanupJobHandler(
	IEcommerceCleanupRepository repository,
	IRecurringJobService recurringJobService,
	IOptions<EcommerceCleanupSettings> settings,
	TimeProvider timeProvider,
	ILogger<CartSessionCleanupJobHandler> logger)
{
	/// <summary>
	/// Handles the cart session cleanup job.
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
		CartSessionCleanupJob job,
		CancellationToken cancellationToken)
	{
		EcommerceCleanupSettings config =
			settings.Value;

		try
		{
			if (config.Enabled)
			{
				await ExecuteCleanupAsync(config, cancellationToken);
			}
		}
		catch (Exception exception) when (exception is not OperationCanceledException)
		{
			logger.LogError(
				exception,
				"Job {JobName} failed with unexpected exception",
				nameof(CartSessionCleanupJob));
		}

		// ALWAYS reschedule — never break the chain
		DateTimeOffset now =
			timeProvider.GetUtcNow();

		TimeSpan interval =
			TimeSpan.FromHours(config.CartSessions.IntervalHours);

		TimeOnly preferredTimeUtc =
			new(
				config.CartSessions.PreferredStartHourUtc,
				config.CartSessions.PreferredStartMinuteUtc);

		await recurringJobService.RecordAndScheduleNextAnchoredAsync<CartSessionCleanupJob>(
			nameof(CartSessionCleanupJob),
			now,
			preferredTimeUtc,
			interval,
			cancellationToken);
	}

	/// <summary>
	/// Executes the cleanup work across both ecommerce databases.
	/// Each database is cleaned independently — a failure in one does not prevent
	/// cleanup of the other.
	/// </summary>
	/// <param name="config">
	/// The ecommerce cleanup settings.
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	private async Task ExecuteCleanupAsync(
		EcommerceCleanupSettings config,
		CancellationToken cancellationToken)
	{
		DateTimeOffset now =
			timeProvider.GetUtcNow();

		DateTimeOffset cutoffDate =
			now.AddDays(-config.CartSessions.RetentionDays);

		await CleanupDatabaseAsync(
			"SvelteKit",
			config.SvelteKitConnectionString,
			cutoffDate,
			cancellationToken);

		await CleanupDatabaseAsync(
			"TanStack",
			config.TanStackConnectionString,
			cutoffDate,
			cancellationToken);
	}

	/// <summary>
	/// Cleans up expired cart sessions from a single ecommerce database.
	/// Logs errors but does not throw — cleanup is best-effort.
	/// </summary>
	/// <param name="databaseName">
	/// The friendly name of the database (for logging).
	/// </param>
	/// <param name="connectionString">
	/// The connection string for the target database.
	/// </param>
	/// <param name="cutoffDate">
	/// Sessions with <c>expires_at</c> before this date are deleted.
	/// </param>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	private async Task CleanupDatabaseAsync(
		string databaseName,
		string connectionString,
		DateTimeOffset cutoffDate,
		CancellationToken cancellationToken)
	{
		try
		{
			int deletedCount =
				await repository.DeleteExpiredCartSessionsAsync(
					connectionString,
					cutoffDate,
					cancellationToken);

			if (deletedCount > 0)
			{
				logger.LogInformation(
					"Cart session cleanup completed for {DatabaseName}: {DeletedCount} expired sessions removed",
					databaseName,
					deletedCount);
			}
		}
		catch (DbException exception)
		{
			logger.LogError(
				exception,
				"Database error during {JobName} for {DatabaseName}. Job will reschedule normally.",
				nameof(CartSessionCleanupJob),
				databaseName);
		}
		catch (InvalidOperationException exception)
		{
			logger.LogError(
				exception,
				"Operation error during {JobName} for {DatabaseName}. Job will reschedule normally.",
				nameof(CartSessionCleanupJob),
				databaseName);
		}
	}
}