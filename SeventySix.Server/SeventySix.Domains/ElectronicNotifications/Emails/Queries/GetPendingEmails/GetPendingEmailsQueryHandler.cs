// <copyright file="GetPendingEmailsQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using SeventySix.ElectronicNotifications;
using SeventySix.ElectronicNotifications.Emails;

namespace SeventySix.Domains.ElectronicNotifications.Emails.Queries.GetPendingEmails;

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
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// List of pending email queue entries.
	/// </returns>
	public static async Task<IReadOnlyList<EmailQueueEntry>> HandleAsync(
		GetPendingEmailsQuery query,
		ElectronicNotificationsDbContext dbContext,
		CancellationToken cancellationToken)
	{
		return await dbContext
			.EmailQueue
			.Where(entry =>
				entry.Status == EmailQueueStatus.Pending
				|| entry.Status == EmailQueueStatus.Failed)
			.Where(entry => entry.Attempts < entry.MaxAttempts)
			.OrderBy(entry => entry.CreateDate)
			.Take(query.BatchSize)
			.ToListAsync(cancellationToken);
	}
}