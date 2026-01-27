// <copyright file="SecurityEventConfiguration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SeventySix.Identity;

/// <summary>
/// EF Core configuration for <see cref="SecurityEvent"/> entity.
/// </summary>
/// <remarks>
/// <para>Maps to security.SecurityEvents table.</para>
/// <para>
/// DESIGN DECISION: UserId has no foreign key constraint intentionally.
/// This allows logging anonymous events and preserves the audit trail even
/// if the user is deleted. Username is stored at event time (immutable copy)
/// for permanent audit history.
/// </para>
/// <para>
/// Indexes optimized for:
/// <list type="bullet">
///   <item><description>User-specific security history queries (UserId)</description></item>
///   <item><description>Event type filtering with date ranges (EventType + CreateDate)</description></item>
///   <item><description>Cleanup jobs for old events (CreateDate)</description></item>
/// </list>
/// </para>
/// </remarks>
public class SecurityEventConfiguration : IEntityTypeConfiguration<SecurityEvent>
{
	/// <summary>
	/// Configures the entity mapping for SecurityEvent.
	/// </summary>
	/// <param name="builder">
	/// The builder to be used to configure the entity type.
	/// </param>
	public void Configure(EntityTypeBuilder<SecurityEvent> builder)
	{
		ArgumentNullException.ThrowIfNull(builder);

		builder.ToTable(
			"SecurityEvents",
			"security");

		builder.HasKey(securityEvent => securityEvent.Id);

		builder
			.Property(securityEvent => securityEvent.Id)
			.UseIdentityColumn()
			.IsRequired();

		builder
			.Property(securityEvent => securityEvent.EventType)
			.IsRequired();

		builder
			.Property(securityEvent => securityEvent.Username)
			.HasMaxLength(100);

		// IPv6 max length is 45 characters
		builder
			.Property(securityEvent => securityEvent.IpAddress)
			.HasMaxLength(45);

		builder
			.Property(securityEvent => securityEvent.UserAgent)
			.HasMaxLength(500);

		builder
			.Property(securityEvent => securityEvent.Details)
			.HasMaxLength(2000);

		builder
			.Property(securityEvent => securityEvent.CreateDate)
			.IsRequired();

		// Index for user-specific security history queries
		builder
			.HasIndex(securityEvent => securityEvent.UserId)
			.HasDatabaseName("IX_SecurityEvents_UserId");

		// Composite index for event type filtering with date range
		builder
			.HasIndex(
				securityEvent => new
				{
					securityEvent.EventType,
					securityEvent.CreateDate
				})
			.HasDatabaseName("IX_SecurityEvents_EventType_CreateDate");

		// Index for date-based cleanup queries
		builder
			.HasIndex(securityEvent => securityEvent.CreateDate)
			.HasDatabaseName("IX_SecurityEvents_CreateDate");
	}
}