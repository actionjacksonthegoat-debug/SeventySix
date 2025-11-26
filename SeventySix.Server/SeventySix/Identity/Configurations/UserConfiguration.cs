// <copyright file="UserConfiguration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SeventySix.Identity;

/// <summary>
/// Entity Framework Core configuration for <see cref="User"/> entity.
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
///
/// Configuration Highlights:
/// - Unique indexes on Username and Email (filtered to exclude soft-deleted users)
/// - Global query filter to exclude soft-deleted users by default
/// - Optimistic concurrency control via RowVersion (xmin in PostgreSQL)
/// - JSON storage for user preferences (jsonb in PostgreSQL)
/// - Audit field tracking (CreatedAt, CreatedBy, ModifiedAt, ModifiedBy)
/// - Soft delete support (IsDeleted, DeletedAt, DeletedBy)
/// </remarks>
public class UserConfiguration : IEntityTypeConfiguration<User>
{
	/// <summary>
	/// Configures the entity mapping for User.
	/// </summary>
	/// <param name="builder">The builder to be used to configure the entity type.</param>
	public void Configure(EntityTypeBuilder<User> builder)
	{
		ArgumentNullException.ThrowIfNull(builder);

		// Table name
		builder.ToTable("Users");

		// Primary key
		builder.HasKey(e => e.Id);
		builder.Property(e => e.Id)
			.UseIdentityColumn() // PostgreSQL SERIAL
			.IsRequired();

		// Username - Required, max length 50, unique (non-deleted only)
		builder.Property(e => e.Username)
			.IsRequired()
			.HasMaxLength(50);
		builder.HasIndex(e => e.Username)
			.IsUnique()
			.HasFilter("\"IsDeleted\" = false") // Unique only for non-deleted users
			.HasDatabaseName("IX_Users_Username");

		// Email - Required, max length 255, unique (non-deleted only)
		builder.Property(e => e.Email)
			.IsRequired()
			.HasMaxLength(255);
		builder.HasIndex(e => e.Email)
			.IsUnique()
			.HasFilter("\"IsDeleted\" = false") // Unique only for non-deleted users
			.HasDatabaseName("IX_Users_Email");

		// FullName - Optional, max length 100
		builder.Property(e => e.FullName)
			.HasMaxLength(100);

		// Audit fields - CreatedAt
		builder.Property(e => e.CreatedAt)
			.IsRequired()
			.HasDefaultValueSql("NOW()")
			.HasColumnType("timestamp with time zone");

		// Audit fields - CreatedBy (optional, max length 100)
		builder.Property(e => e.CreatedBy)
			.HasMaxLength(100);

		// Audit fields - ModifiedAt (optional)
		builder.Property(e => e.ModifiedAt)
			.HasColumnType("timestamp with time zone");

		// Audit fields - ModifiedBy (optional, max length 100)
		builder.Property(e => e.ModifiedBy)
			.HasMaxLength(100);

		// IsActive - Required, default true
		builder.Property(e => e.IsActive)
			.IsRequired()
			.HasDefaultValue(true);

		// Soft delete - IsDeleted (required, default false)
		builder.Property(e => e.IsDeleted)
			.IsRequired()
			.HasDefaultValue(false);
		builder.HasIndex(e => e.IsDeleted)
			.HasDatabaseName("IX_Users_IsDeleted");

		// Soft delete - DeletedAt (optional)
		builder.Property(e => e.DeletedAt)
			.HasColumnType("timestamp with time zone");

		// Soft delete - DeletedBy (optional, max length 100)
		builder.Property(e => e.DeletedBy)
			.HasMaxLength(100);

		// Concurrency control - RowVersion
		// Note: PostgreSQL uses xmin system column for concurrency
		// This will be configured in ApplicationDbContext.OnModelCreating
		// For SQLite tests, this will be a nullable uint column
		builder.Property(e => e.RowVersion)
			.IsRowVersion()
			.IsRequired(false);

		// Preferences - JSON column (jsonb in PostgreSQL)
		builder.Property(e => e.Preferences)
			.HasColumnType("jsonb");

		// Last activity - LastLoginAt (optional)
		builder.Property(e => e.LastLoginAt)
			.HasColumnType("timestamp with time zone");

		// Last activity - LastLoginIp (optional, max length 45 for IPv6 support)
		builder.Property(e => e.LastLoginIp)
			.HasMaxLength(45);

		// Performance indexes
		builder.HasIndex(e => new { e.IsActive, e.CreatedAt })
			.HasDatabaseName("IX_Users_IsActive_CreatedAt");

		builder.HasIndex(e => e.CreatedAt)
			.HasDatabaseName("IX_Users_CreatedAt");

		// Global query filter - Exclude soft-deleted users by default
		builder.HasQueryFilter(e => !e.IsDeleted);
	}
}
