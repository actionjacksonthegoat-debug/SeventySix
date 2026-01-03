// <copyright file="EmailQueueEntry.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Entities;

namespace SeventySix.ElectronicNotifications.Emails;

/// <summary>
/// Represents an email queued for delivery.
/// </summary>
/// <remarks>
/// Design Principles:
/// - Outbox pattern: emails are persisted before sending for reliability
/// - Idempotency: IdempotencyKey prevents duplicate sends
/// - Retry logic: Attempts and MaxAttempts track delivery attempts
/// - Auditability: Full history of email delivery status.
/// </remarks>
public class EmailQueueEntry : ICreatableEntity
{
	/// <summary>
	/// Gets or sets the unique identifier.
	/// </summary>
	public long Id { get; set; }

	/// <summary>
	/// Gets or sets the email type (Welcome, PasswordReset, Verification).
	/// </summary>
	/// <seealso cref="EmailType"/>
	public string EmailType { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the recipient email address.
	/// </summary>
	public string RecipientEmail { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the recipient user ID (optional, for audit purposes).
	/// </summary>
	public long? RecipientUserId { get; set; }

	/// <summary>
	/// Gets or sets the template data as JSON.
	/// </summary>
	/// <remarks>
	/// Contains email-specific data like username, tokens, etc.
	/// Stored as JSONB in PostgreSQL.
	/// </remarks>
	public string TemplateData { get; set; } = "{}";

	/// <summary>
	/// Gets or sets the current status.
	/// </summary>
	/// <seealso cref="EmailQueueStatus"/>
	public string Status { get; set; } = EmailQueueStatus.Pending;

	/// <summary>
	/// Gets or sets the number of send attempts made.
	/// </summary>
	public int Attempts { get; set; }

	/// <summary>
	/// Gets or sets the maximum number of attempts before dead-lettering.
	/// </summary>
	public int MaxAttempts { get; set; } = 3;

	/// <summary>
	/// Gets or sets when the last send attempt occurred.
	/// </summary>
	public DateTime? LastAttemptAt { get; set; }

	/// <summary>
	/// Gets or sets the error message from the last failed attempt.
	/// </summary>
	public string? ErrorMessage { get; set; }

	/// <summary>
	/// Gets or sets when this entry was created.
	/// </summary>
	public DateTime CreateDate { get; set; }

	/// <summary>
	/// Gets or sets when the email was successfully sent.
	/// </summary>
	public DateTime? SentAt { get; set; }

	/// <summary>
	/// Gets or sets the idempotency key to prevent duplicate sends.
	/// </summary>
	public Guid IdempotencyKey { get; set; }
}
