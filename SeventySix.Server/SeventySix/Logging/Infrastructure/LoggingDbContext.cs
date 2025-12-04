// <copyright file="LoggingDbContext.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Infrastructure;

namespace SeventySix.Logging;

/// <summary>
/// Database context for the Logging bounded context.
/// </summary>
/// <remarks>
/// Manages Log entities and their database operations.
/// Uses PostgreSQL with schema 'Logging' for isolation.
/// Inherits common configuration from BaseDbContext.
///
/// Design Patterns:
/// - Unit of Work: Coordinates changes to multiple entities
/// - Repository: Provides data access abstraction
/// - Template Method: Inherits from BaseDbContext
///
/// SOLID Principles:
/// - SRP: Only responsible for Logging domain data access
/// - OCP: Can be extended with new entity configurations
/// </remarks>
public class LoggingDbContext : BaseDbContext<LoggingDbContext>
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
	/// Gets the schema name for Logging bounded context.
	/// </summary>
	/// <returns>"Logging".</returns>
	protected override string GetSchemaName() => SchemaConstants.Logging;
}