// <copyright file="GetPendingEmailsQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;

namespace SeventySix.ElectronicNotifications.Emails;

/// <summary>
/// Handler for <see cref="GetPendingEmailsQuery"/>.
/// </summary>
public static class GetPendingEmailsQueryHandler
{
	/// <summary>
	/// Handles retrieval of pending emails for processing.
	/// Uses a raw SQL query with FOR UPDATE SKIP LOCKED to atomically claim rows,
	/// preventing concurrent job instances from processing the same email entry.
	/// </summary>
	/// <param name="query">
	/// The get pending emails query.
	/// </param>
	/// <param name="dbContext">
	/// The database context for email queue operations.
	/// </param>
	/// <param name="timeProvider">
	/// Time provider for current UTC time.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// List of claimable pending email queue entries, locked for the current transaction.
	/// </returns>
	public static async Task<IReadOnlyList<EmailQueueEntry>> HandleAsync(
		GetPendingEmailsQuery query,
		ElectronicNotificationsDbContext dbContext,
		TimeProvider timeProvider,
		CancellationToken cancellationToken)
	{
		DateTimeOffset now =
			timeProvider.GetUtcNow();

		DateTimeOffset retryThreshold =
			now.AddMinutes(-query.RetryDelayMinutes);

		// Raw SQL with FOR UPDATE SKIP LOCKED atomically claims rows for this worker.
		// SKIP LOCKED: rows locked by another concurrent worker are silently skipped,
		// preventing duplicate processing without blocking.
		// Entities are tracked (no AsNoTracking) so the row lock is held within
		// the surrounding Wolverine EF Core transaction.
		return await dbContext.EmailQueue
			.FromSqlInterpolated(
				$"""
				SELECT * FROM "ElectronicNotifications"."EmailQueue"
				WHERE ("Status" = {EmailQueueStatus.Pending}
					OR ("Status" = {EmailQueueStatus.Failed}
						AND ("LastAttemptAt" IS NULL OR "LastAttemptAt" < {retryThreshold})))
				AND "Attempts" < "MaxAttempts"
				ORDER BY "CreateDate"
				LIMIT {query.BatchSize}
				FOR UPDATE SKIP LOCKED
				""")
			.ToListAsync(cancellationToken);
	}
}