// <copyright file="LogConfiguration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SeventySix.Logging;

/// <summary>
/// Entity Framework Core configuration for <see cref="Log"/> entity.
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
public class LogConfiguration : IEntityTypeConfiguration<Log>
{
	/// <summary>
	/// Configures the entity mapping for Log.
	/// </summary>
	/// <param name="builder">The builder to be used to configure the entity type.</param>
	public void Configure(EntityTypeBuilder<Log> builder)
	{
		ArgumentNullException.ThrowIfNull(builder);

		// Table name (PascalCase to match other tables)
		builder.ToTable("Logs");

		// Primary key
		builder.HasKey(e => e.Id);
		builder.Property(e => e.Id)
			.UseIdentityColumn() // PostgreSQL SERIAL
			.IsRequired();

		// LogLevel - Required, max length 20
		builder.Property(e => e.LogLevel)
			.IsRequired()
			.HasMaxLength(20);

		// Message - Required, max length 4000
		builder.Property(e => e.Message)
			.IsRequired()
			.HasMaxLength(4000);

		// ExceptionMessage - Optional, max length 2000
		builder.Property(e => e.ExceptionMessage)
			.HasMaxLength(2000);

		// BaseExceptionMessage - Optional, max length 2000
		builder.Property(e => e.BaseExceptionMessage)
			.HasMaxLength(2000);

		// StackTrace - Optional, unlimited text
		builder.Property(e => e.StackTrace)
			.HasColumnType("text");

		// SourceContext - Optional, max length 500
		builder.Property(e => e.SourceContext)
			.HasMaxLength(500);

		// RequestMethod - Optional, max length 10
		builder.Property(e => e.RequestMethod)
			.HasMaxLength(10);

		// RequestPath - Optional, max length 2000
		builder.Property(e => e.RequestPath)
			.HasMaxLength(2000);

		// StatusCode - Optional
		builder.Property(e => e.StatusCode);

		// DurationMs - Optional
		builder.Property(e => e.DurationMs);

		// Properties - Optional, JSON text
		builder.Property(e => e.Properties)
			.HasColumnType("text");

		// CreateDate - Required, default NOW()
		// Maps to CreateDate column in database
		// ValueGeneratedOnAdd allows explicit values to override the database default
		builder.Property(e => e.CreateDate)
			.IsRequired()
			.HasColumnName("CreateDate")
			.ValueGeneratedOnAdd()
			.HasDefaultValueSql("NOW()")
			.HasColumnType("timestamp with time zone");

		// MachineName - Optional, max length 100
		builder.Property(e => e.MachineName)
			.HasMaxLength(100);

		// Environment - Optional, max length 50
		builder.Property(e => e.Environment)
			.HasMaxLength(50);

		// Indexes for common queries
		builder.HasIndex(e => e.CreateDate)
			.HasDatabaseName("IX_Logs_CreatedAt");

		builder.HasIndex(e => e.LogLevel)
			.HasDatabaseName("IX_Logs_LogLevel");

		builder.HasIndex(e => e.SourceContext)
			.HasDatabaseName("IX_Logs_SourceContext");

		builder.HasIndex(e => new { e.LogLevel, e.CreateDate })
			.HasDatabaseName("IX_Logs_LogLevel_CreatedAt");

		builder.HasIndex(e => e.RequestPath)
			.HasDatabaseName("IX_Logs_RequestPath");
	}
}
