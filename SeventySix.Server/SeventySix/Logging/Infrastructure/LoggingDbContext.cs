// <copyright file="LoggingDbContext.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;

namespace SeventySix.Logging;

/// <summary>
/// Database context for the Logging bounded context.
/// </summary>
/// <remarks>
/// Manages Log entities and their database operations.
/// Uses PostgreSQL with schema 'logging' for isolation.
///
/// Design Patterns:
/// - Unit of Work: Coordinates changes to multiple entities
/// - Repository: Provides data access abstraction
///
/// SOLID Principles:
/// - SRP: Only responsible for Logging domain data access
/// - OCP: Can be extended with new entity configurations
/// </remarks>
public class LoggingDbContext : DbContext
{
	/// <summary>
	/// Initializes a new instance of the <see cref="LoggingDbContext"/> class.
	/// </summary>
	/// <param name="options">The options for this context.</param>
	public LoggingDbContext(DbContextOptions<LoggingDbContext> options)
		: base(options)
	{
	}

	/// <summary>
	/// Gets or sets the Logs DbSet.
	/// </summary>
	public DbSet<Log> Logs => Set<Log>();

	/// <summary>
	/// Configures the model for this context.
	/// </summary>
	/// <param name="modelBuilder">The builder being used to construct the model for this context.</param>
	protected override void OnModelCreating(ModelBuilder modelBuilder)
	{
		ArgumentNullException.ThrowIfNull(modelBuilder);

		// Set default schema for Logging bounded context
		modelBuilder.HasDefaultSchema("Logging");

		// ONLY apply configurations from Logging namespace (bounded context isolation)
		modelBuilder.ApplyConfigurationsFromAssembly(
			typeof(LoggingDbContext).Assembly,
			t => t.Namespace != null && t.Namespace.StartsWith("SeventySix.Logging"));

		base.OnModelCreating(modelBuilder);
	}
}
