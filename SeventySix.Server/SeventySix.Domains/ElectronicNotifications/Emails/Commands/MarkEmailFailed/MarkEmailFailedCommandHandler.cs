// <copyright file="MarkEmailFailedCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.POCOs;

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
	/// A Result indicating success or failure with error details.
	/// </returns>
	public static async Task<Result> HandleAsync(
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
			return Result.Failure(
				$"Email queue entry {command.EmailQueueId} not found");
		}

		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;

		entry.Attempts++;
		entry.LastAttemptAt = now;

		string errorMessage =
			TruncateErrorMessage(command.ErrorMessage);
		entry.ErrorMessage = errorMessage;

		entry.Status =
			entry.Attempts >= entry.MaxAttempts
				? EmailQueueStatus.DeadLetter
				: EmailQueueStatus.Failed;

		await dbContext.SaveChangesAsync(cancellationToken);

		return Result.Success();
	}

	/// <summary>
	/// Truncates error message to fit database column size.
	/// </summary>
	/// <param name="errorMessage">
	/// The error message to truncate.
	/// </param>
	/// <returns>
	/// The truncated error message.
	/// </returns>
	private static string TruncateErrorMessage(string errorMessage)
	{
		const int maxLength = 1000;

		return errorMessage.Length <= maxLength
			? errorMessage
			: errorMessage[..maxLength];
	}
}