// <copyright file="IDatabaseMaintenanceService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging.Jobs;

/// <summary>
/// Service for executing PostgreSQL database maintenance operations.
/// Abstraction enables unit testing of job handler scheduling logic.
/// </summary>
public interface IDatabaseMaintenanceService
{
	/// <summary>
	/// Executes VACUUM ANALYZE on all tables in all schemas.
	/// Reclaims storage and updates query planner statistics.
	/// </summary>
	/// <param name="cancellationToken">
	/// The cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the asynchronous operation.
	/// </returns>
	public Task ExecuteVacuumAnalyzeAsync(CancellationToken cancellationToken);
}