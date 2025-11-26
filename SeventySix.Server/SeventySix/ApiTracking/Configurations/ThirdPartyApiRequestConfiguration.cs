// <copyright file="ThirdPartyApiRequestConfiguration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SeventySix.ApiTracking;

/// <summary>
/// Entity Framework Core configuration for <see cref="ThirdPartyApiRequest"/> entity.
/// </summary>
/// <remarks>
/// Uses Fluent API to configure entity mapping, constraints, and indexes.
/// Preferred over Data Annotations to keep domain models framework-independent.
///
/// Design Patterns:
/// - Fluent Interface: Method chaining for readable configuration
/// - Separation of Concerns: Configuration separate from domain model
///
/// SOLID Principles:
/// - SRP: Only responsible for entity configuration
/// - OCP: Can be extended without modifying domain entity
/// </remarks>
public class ThirdPartyApiRequestConfiguration : IEntityTypeConfiguration<ThirdPartyApiRequest>
{
	/// <summary>
	/// Configures the entity mapping for ThirdPartyApiRequest.
	/// </summary>
	/// <param name="builder">The builder to be used to configure the entity type.</param>
	public void Configure(EntityTypeBuilder<ThirdPartyApiRequest> builder)
	{
		ArgumentNullException.ThrowIfNull(builder);

		// Table name with check constraint
		builder.ToTable("ThirdPartyApiRequests", t =>
		{
			// Check constraint: CallCount >= 0
			t.HasCheckConstraint("CK_ThirdPartyApiRequests_CallCount", "\"CallCount\" >= 0");
		});

		// Primary key
		builder.HasKey(e => e.Id);
		builder.Property(e => e.Id)
			.UseIdentityColumn() // PostgreSQL SERIAL
			.IsRequired();

		// ApiName - Required, max length 100
		builder.Property(e => e.ApiName)
			.IsRequired()
			.HasMaxLength(100);

		// BaseUrl - Required, max length 500
		builder.Property(e => e.BaseUrl)
			.IsRequired()
			.HasMaxLength(500);

		// CallCount - Required, default value 0
		builder.Property(e => e.CallCount)
			.IsRequired()
			.HasDefaultValue(0);

		// LastCalledAt - Optional timestamp
		builder.Property(e => e.LastCalledAt)
			.IsRequired(false);

		// ResetDate - Required date
		builder.Property(e => e.ResetDate)
			.IsRequired()
			.HasColumnType("date");

		// CreatedAt - Required timestamp, default NOW()
		builder.Property(e => e.CreatedAt)
			.IsRequired()
			.HasDefaultValueSql("NOW()")
			.HasColumnType("timestamp with time zone");

		// ModifiedAt - Optional timestamp (set when entity is modified)
		builder.Property(e => e.ModifiedAt)
			.IsRequired(false)
			.HasColumnType("timestamp with time zone");

		// RowVersion - Concurrency token
		// Note: For PostgreSQL in production, this will be mapped to xmin system column in ApplicationDbContext
		// For SQLite in tests, this will be a regular column with auto-increment
		builder.Property(e => e.RowVersion)
			.ValueGeneratedOnAddOrUpdate()
			.IsConcurrencyToken()
			.HasDefaultValue(0u); // Default for SQLite

		// Unique constraint: One record per API per day
		builder.HasIndex(e => new { e.ApiName, e.ResetDate })
			.IsUnique()
			.HasDatabaseName("UQ_ThirdPartyApiRequests_ApiName_ResetDate");

		// Performance index: Composite index for most common query (ApiName, ResetDate)
		// Note: This is redundant with unique constraint above, but keeping for clarity
		// PostgreSQL automatically creates an index for unique constraints
		builder.HasIndex(e => new { e.ApiName, e.ResetDate })
			.HasDatabaseName("IX_ThirdPartyApiRequests_ApiName_ResetDate");

		// Index for analytics queries on LastCalledAt
		builder.HasIndex(e => e.LastCalledAt)
			.HasDatabaseName("IX_ThirdPartyApiRequests_LastCalledAt");
	}
}
