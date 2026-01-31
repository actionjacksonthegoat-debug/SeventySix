// <copyright file="DatabaseMaintenanceService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;

namespace SeventySix.Logging.Jobs;

/// <summary>
/// Executes PostgreSQL database maintenance operations using EF Core.
/// </summary>
/// <param name="loggingDbContext">
/// Database context for executing maintenance commands.
/// </param>
public sealed class DatabaseMaintenanceService(LoggingDbContext loggingDbContext) : IDatabaseMaintenanceService
{
	/// <inheritdoc/>
	public async Task ExecuteVacuumAnalyzeAsync(CancellationToken cancellationToken)
	{
		// VACUUM ANALYZE reclaims storage and updates query planner statistics.
		// Running without table name affects all tables in all schemas.
		// This is safe during operation - does not acquire exclusive locks.
		await loggingDbContext.Database.ExecuteSqlRawAsync(
			"VACUUM ANALYZE",
			cancellationToken);
	}
}