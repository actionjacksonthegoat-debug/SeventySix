// <copyright file="MarkEmailFailedCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ElectronicNotifications.Emails;

/// <summary>
/// Handler for <see cref="MarkEmailFailedCommand"/>.
/// </summary>
public static class MarkEmailFailedCommandHandler
{
	/// <summary>
	/// Handles marking an email queue entry as failed.
	/// </summary>
	/// <param name="command">
	/// The mark email failed command.
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
		MarkEmailFailedCommand command,
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

		entry.Attempts++;
		entry.LastAttemptAt = now;

		string errorMessage =
			TruncateErrorMessage(command.ErrorMessage);
		entry.ErrorMessage = errorMessage;

		// Mark as dead letter if max attempts reached
		entry.Status =
			entry.Attempts >= entry.MaxAttempts
				? EmailQueueStatus.DeadLetter
				: EmailQueueStatus.Failed;

		await dbContext.SaveChangesAsync(cancellationToken);

		return true;
	}

	/// <summary>
	/// Truncates error message to fit database column size.
	/// </summary>
	private static string TruncateErrorMessage(string errorMessage)
	{
		const int maxLength = 1000;

		return errorMessage.Length <= maxLength
			? errorMessage
			: errorMessage[..maxLength];
	}
}
