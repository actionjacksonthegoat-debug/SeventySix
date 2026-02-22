// <copyright file="EnqueueEmailCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SeventySix.Shared.Contracts.Emails;

namespace SeventySix.ElectronicNotifications.Emails;

/// <summary>
/// Handler for <see cref="EnqueueEmailCommand"/>.
/// </summary>
/// <remarks>
/// Handles the shared email contract from any bounded context.
/// </remarks>
public static class EnqueueEmailCommandHandler
{
	/// <summary>
	/// Handles enqueueing an email for delivery.
	/// </summary>
	/// <param name="command">
	/// The enqueue email command.
	/// </param>
	/// <param name="dbContext">
	/// The database context for email queue operations.
	/// </param>
	/// <param name="settings">
	/// The email queue settings.
	/// </param>
	/// <param name="timeProvider">
	/// Time provider for current time values.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// The ID of the created (or existing) queue entry.
	/// </returns>
	public static async Task<long> HandleAsync(
		EnqueueEmailCommand command,
		ElectronicNotificationsDbContext dbContext,
		IOptions<EmailQueueSettings> settings,
		TimeProvider timeProvider,
		CancellationToken cancellationToken)
	{
		Guid idempotencyKey =
			command.IdempotencyKey ?? Guid.NewGuid();

		// Check for duplicate (idempotency)
		EmailQueueEntry? existingEntry =
			await dbContext
				.EmailQueue
				.FirstOrDefaultAsync(
					entry =>
						entry.IdempotencyKey == idempotencyKey,
					cancellationToken);

		if (existingEntry is not null)
		{
			return existingEntry.Id;
		}

		string templateDataJson =
			JsonSerializer.Serialize(
				command.TemplateData);

		int maxAttempts =
			settings.Value.MaxAttempts;
		DateTimeOffset createDate =
			timeProvider.GetUtcNow();

		EmailQueueEntry entry =
			new()
			{
				EmailType = command.EmailType,
				RecipientEmail = command.RecipientEmail,
				RecipientUserId = command.RecipientUserId,
				TemplateData = templateDataJson,
				Status = EmailQueueStatus.Pending,
				MaxAttempts = maxAttempts,
				CreateDate = createDate,
				IdempotencyKey = idempotencyKey
			};

		dbContext.EmailQueue.Add(entry);
		await dbContext.SaveChangesAsync(cancellationToken);

		return entry.Id;
	}
}