// <copyright file="EmailQueueEntryConfiguration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SeventySix.ElectronicNotifications.Emails;

/// <summary>
/// Entity Framework Core configuration for <see cref="EmailQueueEntry"/> entity.
/// </summary>
/// <remarks>
/// Design Principles:
/// - Composite index on Status + CreateDate for efficient queue processing
/// - Unique index on IdempotencyKey for duplicate prevention
/// - Index on RecipientUserId for user email history queries.
/// </remarks>
public class EmailQueueEntryConfiguration
	: IEntityTypeConfiguration<EmailQueueEntry>
{
	/// <summary>
	/// Configures the entity mapping for EmailQueueEntry.
	/// </summary>
	/// <param name="builder">
	/// The builder to be used to configure the entity type.
	/// </param>
	public void Configure(EntityTypeBuilder<EmailQueueEntry> builder)
	{
		ArgumentNullException.ThrowIfNull(builder);

		builder.ToTable("EmailQueue");

		builder.HasKey(entry => entry.Id);
		builder
			.Property(entry => entry.Id)
			.UseIdentityColumn()
			.IsRequired();

		// EmailType - Required, max 50 chars
		builder
			.Property(entry => entry.EmailType)
			.IsRequired()
			.HasMaxLength(50);

		// RecipientEmail - Required, standard email max length
		builder
			.Property(entry => entry.RecipientEmail)
			.IsRequired()
			.HasMaxLength(256);

		// RecipientUserId - Optional FK for audit
		builder
			.Property(entry => entry.RecipientUserId)
			.IsRequired(false);

		// TemplateData - Required, stored as JSONB
		builder
			.Property(entry => entry.TemplateData)
			.IsRequired()
			.HasColumnType("jsonb");

		// Status - Required with default
		builder
			.Property(entry => entry.Status)
			.IsRequired()
			.HasMaxLength(20)
			.HasDefaultValue(EmailQueueStatus.Pending);

		// Attempts - Required with default 0
		builder
			.Property(entry => entry.Attempts)
			.IsRequired()
			.HasDefaultValue(0);

		// MaxAttempts - Required with default 3
		builder
			.Property(entry => entry.MaxAttempts)
			.IsRequired()
			.HasDefaultValue(3);

		// LastAttemptAt - Optional timestamp
		builder
			.Property(entry => entry.LastAttemptAt)
			.HasColumnType("timestamp with time zone");

		// ErrorMessage - Optional, truncate long errors
		builder
			.Property(entry => entry.ErrorMessage)
			.HasMaxLength(1000);

		// CreateDate - Required (auto-set by interceptor)
		builder
			.Property(entry => entry.CreateDate)
			.IsRequired()
			.HasDefaultValueSql("NOW()")
			.HasColumnType("timestamp with time zone");

		// SentAt - Optional timestamp
		builder
			.Property(entry => entry.SentAt)
			.HasColumnType("timestamp with time zone");

		// IdempotencyKey - Required for duplicate prevention
		builder
			.Property(entry => entry.IdempotencyKey)
			.IsRequired();

		// Index for queue processing (fetch pending/failed emails)
		builder
			.HasIndex(entry => new { entry.Status, entry.CreateDate })
			.HasDatabaseName("IX_EmailQueue_Status_CreateDate");

		// Unique index for idempotency checks
		builder
			.HasIndex(entry => entry.IdempotencyKey)
			.IsUnique()
			.HasDatabaseName("IX_EmailQueue_IdempotencyKey");

		// Index for user email history lookups
		builder
			.HasIndex(entry => entry.RecipientUserId)
			.HasDatabaseName("IX_EmailQueue_RecipientUserId");
	}
}