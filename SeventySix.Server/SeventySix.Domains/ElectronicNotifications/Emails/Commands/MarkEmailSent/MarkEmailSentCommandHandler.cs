// <copyright file="MarkEmailSentCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ElectronicNotifications.Emails;

/// <summary>
/// Handler for <see cref="MarkEmailSentCommand"/>.
/// </summary>
public static class MarkEmailSentCommandHandler
{
	/// <summary>
	/// Handles marking an email queue entry as sent.
	/// </summary>
	/// <param name="command">
	/// The mark email sent command.
	/// </param>
	/// <param name="dbContext">
	/// The database context for email queue operations.
	/// </param>
	/// <param name="timeProvider">
	/// Time provider for current time values.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// True if the entry was updated; otherwise false.
	/// </returns>
	public static async Task<bool> HandleAsync(
		MarkEmailSentCommand command,
		ElectronicNotificationsDbContext dbContext,
		TimeProvider timeProvider,
		CancellationToken cancellationToken)
	{
		EmailQueueEntry? entry =
			await dbContext.EmailQueue.FindAsync(
				[command.EmailQueueId],
				cancellationToken);

		if (entry is null)
		{
			return false;
		}

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		entry.Status = EmailQueueStatus.Sent;
		entry.SentAt = now;
		entry.LastAttemptAt = now;
		entry.Attempts++;
		entry.ErrorMessage = null;

		await dbContext.SaveChangesAsync(cancellationToken);

		return true;
	}
}