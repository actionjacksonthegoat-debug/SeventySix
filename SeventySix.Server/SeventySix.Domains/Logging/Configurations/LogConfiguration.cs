// <copyright file="LogConfiguration.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SeventySix.Shared.Constants;

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
	/// <param name="builder">
	/// The builder to be used to configure the entity type.
	/// </param>
	public void Configure(EntityTypeBuilder<Log> builder)
	{
		ArgumentNullException.ThrowIfNull(builder);

		// Table name (PascalCase to match other tables)
		builder.ToTable("Logs");

		// Primary key
		builder.HasKey(logEntry => logEntry.Id);
		builder
			.Property(logEntry => logEntry.Id)
			.UseIdentityColumn() // PostgreSQL SERIAL
			.IsRequired();

		// LogLevel - Required, max length 20
		builder.Property(logEntry => logEntry.LogLevel).IsRequired().HasMaxLength(ValidationConstants.LogLevelMaxLength);

		// Message - Required, max length 4000
		builder.Property(logEntry => logEntry.Message).IsRequired().HasMaxLength(ValidationConstants.MessageMaxLength);

		// ExceptionMessage - Optional, max length 2000
		builder.Property(logEntry => logEntry.ExceptionMessage).HasMaxLength(ValidationConstants.ExceptionMessageMaxLength);

		// BaseExceptionMessage - Optional, max length 2000
		builder.Property(logEntry => logEntry.BaseExceptionMessage).HasMaxLength(ValidationConstants.ExceptionMessageMaxLength);

		// StackTrace - Optional, unlimited text
		builder.Property(logEntry => logEntry.StackTrace).HasColumnType("text");

		// SourceContext - Optional, max length 500
		builder.Property(logEntry => logEntry.SourceContext).HasMaxLength(ValidationConstants.LongTextMaxLength);

		// RequestMethod - Optional, max length 10
		builder.Property(logEntry => logEntry.RequestMethod).HasMaxLength(ValidationConstants.RequestMethodMaxLength);

		// RequestPath - Optional, max length 2000
		builder.Property(logEntry => logEntry.RequestPath).HasMaxLength(ValidationConstants.RequestPathMaxLength);

		// StatusCode - Optional
		builder.Property(logEntry => logEntry.StatusCode);

		// DurationMs - Optional
		builder.Property(logEntry => logEntry.DurationMs);

		// Properties - Optional, JSON text
		builder.Property(logEntry => logEntry.Properties).HasColumnType("text");

		// CreateDate - Required, default NOW()
		// Maps to CreateDate column in database
		// ValueGeneratedOnAdd allows explicit values to override the database default
		builder
			.Property(logEntry => logEntry.CreateDate)
			.IsRequired()
			.HasColumnName("CreateDate")
			.ValueGeneratedOnAdd()
			.HasDefaultValueSql("NOW()")
			.HasColumnType("timestamp with time zone");

		// MachineName - Optional, max length 100
		builder.Property(logEntry => logEntry.MachineName).HasMaxLength(ValidationConstants.MachineNameMaxLength);

		// Environment - Optional, max length 50
		builder.Property(logEntry => logEntry.Environment).HasMaxLength(ValidationConstants.EnvironmentMaxLength);

		// Tracing fields - OpenTelemetry standard lengths
		// TraceId: 32 hex chars, SpanId: 16 hex chars
		builder.Property(logEntry => logEntry.CorrelationId).HasMaxLength(ValidationConstants.CorrelationIdMaxLength);
		builder.Property(logEntry => logEntry.SpanId).HasMaxLength(ValidationConstants.SpanIdMaxLength);
		builder.Property(logEntry => logEntry.ParentSpanId).HasMaxLength(ValidationConstants.SpanIdMaxLength);

		// Indexes for common queries
		builder
			.HasIndex(logEntry => logEntry.CreateDate)
			.HasDatabaseName("IX_Logs_CreateDate");

		builder
			.HasIndex(logEntry => logEntry.LogLevel)
			.HasDatabaseName("IX_Logs_LogLevel");

		builder
			.HasIndex(logEntry => logEntry.SourceContext)
			.HasDatabaseName("IX_Logs_SourceContext");

		builder
			.HasIndex(logEntry => new { logEntry.LogLevel, logEntry.CreateDate })
			.HasDatabaseName("IX_Logs_LogLevel_CreateDate");

		builder
			.HasIndex(logEntry => logEntry.RequestPath)
			.HasDatabaseName("IX_Logs_RequestPath");

		// Index for distributed tracing queries
		builder
			.HasIndex(logEntry => logEntry.CorrelationId)
			.HasDatabaseName("IX_Logs_CorrelationId");
	}
}