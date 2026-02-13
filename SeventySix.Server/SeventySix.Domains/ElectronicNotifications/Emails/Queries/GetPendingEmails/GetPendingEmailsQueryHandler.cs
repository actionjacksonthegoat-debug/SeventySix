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
	/// List of pending email queue entries.
	/// </returns>
	public static async Task<IReadOnlyList<EmailQueueEntry>> HandleAsync(
		GetPendingEmailsQuery query,
		ElectronicNotificationsDbContext dbContext,
		TimeProvider timeProvider,
		CancellationToken cancellationToken)
	{
		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		DateTime retryThreshold =
			now.AddMinutes(-query.RetryDelayMinutes);

		return await dbContext
			.EmailQueue
			.AsNoTracking()
			.Where(entry =>
				entry.Status == EmailQueueStatus.Pending
				|| (entry.Status == EmailQueueStatus.Failed
					&& (entry.LastAttemptAt == null
						|| entry.LastAttemptAt < retryThreshold)))
			.Where(entry => entry.Attempts < entry.MaxAttempts)
			.OrderBy(entry => entry.CreateDate)
			.Take(query.BatchSize)
			.ToListAsync(cancellationToken);
	}
}