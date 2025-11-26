// <copyright file="IMetricsService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Infrastructure;

/// <summary>
/// Service for recording application metrics using OpenTelemetry.
/// </summary>
/// <remarks>
/// Provides methods to record custom metrics for database operations,
/// API calls, queue health, and other application-specific measurements.
/// Metrics are exported to Prometheus via OpenTelemetry.
/// </remarks>
public interface IMetricsService
{
	/// <summary>
	/// Records a database query execution.
	/// </summary>
	/// <param name="durationMs">Query duration in milliseconds.</param>
	/// <param name="queryType">Type of query (e.g., "Select", "Insert", "Update").</param>
	public void RecordDatabaseQuery(double durationMs, string queryType);

	/// <summary>
	/// Records an external API call.
	/// </summary>
	/// <param name="durationMs">API call duration in milliseconds.</param>
	/// <param name="apiName">Name of the external API.</param>
	/// <param name="success">Whether the call was successful.</param>
	public void RecordApiCall(double durationMs, string apiName, bool success);

	/// <summary>
	/// Records queue statistics.
	/// </summary>
	/// <param name="queuedItems">Number of queued items.</param>
	/// <param name="failedItems">Number of failed items.</param>
	public void RecordQueueStats(int queuedItems, int failedItems);

	/// <summary>
	/// Gets the current number of active database connections.
	/// </summary>
	/// <returns>Number of active database connections.</returns>
	public int GetActiveDbConnections();

	/// <summary>
	/// Gets the current queue statistics.
	/// </summary>
	/// <returns>Tuple of (queuedItems, failedItems).</returns>
	public (int queuedItems, int failedItems) GetQueueStats();
}
