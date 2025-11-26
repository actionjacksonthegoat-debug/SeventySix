// <copyright file="MetricsService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Diagnostics.Metrics;

namespace SeventySix.Infrastructure;

/// <summary>
/// Service for recording application metrics using OpenTelemetry.
/// </summary>
/// <remarks>
/// Implements metric recording for database operations, API calls, and queue health.
/// Uses OpenTelemetry instrumentation for Prometheus export.
/// Metrics are exposed via the /metrics endpoint for scraping.
/// </remarks>
public class MetricsService : IMetricsService
{
	private static readonly Meter ApplicationMeter = new("SeventySix.Api", "1.0.0");

	private static readonly Histogram<double> DatabaseQueryDuration = ApplicationMeter.CreateHistogram<double>(
		"db_query_duration_ms",
		unit: "milliseconds",
		description: "Duration of database queries");

	private static readonly Histogram<double> ApiCallDuration = ApplicationMeter.CreateHistogram<double>(
		"api_call_duration_ms",
		unit: "milliseconds",
		description: "Duration of external API calls");

	private static readonly Counter<long> ApiCallCounter = ApplicationMeter.CreateCounter<long>(
		"api_call_total",
		description: "Total number of external API calls");

	private static readonly Counter<long> ApiCallFailures = ApplicationMeter.CreateCounter<long>(
		"api_call_failures_total",
		description: "Total number of failed external API calls");

	private static int ActiveDbConnections;
	private static int QueuedItems;
	private static int FailedItems;

	/// <summary>
	/// Initializes a new instance of the <see cref="MetricsService"/> class.
	/// </summary>
	/// <remarks>
	/// Sets up observable gauges for active connections and queue statistics.
	/// These gauges are automatically scraped by Prometheus at regular intervals.
	/// </remarks>
	public MetricsService()
	{
		ApplicationMeter.CreateObservableGauge(
			"active_db_connections",
			() => ActiveDbConnections,
			description: "Current number of active database connections");

		ApplicationMeter.CreateObservableGauge(
			"queued_items",
			() => QueuedItems,
			description: "Current number of items in the error queue");

		ApplicationMeter.CreateObservableGauge(
			"failed_items",
			() => FailedItems,
			description: "Current number of failed items in the error queue");
	}

	/// <summary>
	/// Records a database query execution.
	/// </summary>
	/// <param name="durationMs">Query duration in milliseconds.</param>
	/// <param name="queryType">Type of query (e.g., "Select", "Insert", "Update").</param>
	/// <remarks>
	/// Captured as a histogram metric for duration distribution analysis.
	/// Tagged with query type for filtering in Grafana dashboards.
	/// </remarks>
	public void RecordDatabaseQuery(double durationMs, string queryType)
	{
		DatabaseQueryDuration.Record(
			durationMs,
			new KeyValuePair<string, object?>("query_type", queryType));
	}

	/// <summary>
	/// Records an external API call.
	/// </summary>
	/// <param name="durationMs">API call duration in milliseconds.</param>
	/// <param name="apiName">Name of the external API.</param>
	/// <param name="success">Whether the call was successful.</param>
	/// <remarks>
	/// Records both duration histogram and success/failure counters.
	/// Enables tracking of API reliability and performance trends.
	/// </remarks>
	public void RecordApiCall(double durationMs, string apiName, bool success)
	{
		KeyValuePair<string, object?>[] tags =
		[
			new KeyValuePair<string, object?>("api_name", apiName),
			new KeyValuePair<string, object?>("success", success),
		];

		ApiCallDuration.Record(durationMs, tags);
		ApiCallCounter.Add(1, tags);

		if (!success)
		{
			ApiCallFailures.Add(1, new KeyValuePair<string, object?>("api_name", apiName));
		}
	}

	/// <summary>
	/// Records queue statistics.
	/// </summary>
	/// <param name="queuedItems">Number of queued items.</param>
	/// <param name="failedItems">Number of failed items.</param>
	/// <remarks>
	/// Updates observable gauge values for Prometheus scraping.
	/// Used by health check endpoint to determine system health.
	/// </remarks>
	public void RecordQueueStats(int queuedItems, int failedItems)
	{
		QueuedItems = queuedItems;
		FailedItems = failedItems;
	}

	/// <summary>
	/// Gets the current number of active database connections.
	/// </summary>
	/// <returns>Number of active database connections.</returns>
	/// <remarks>
	/// Value is exposed as an observable gauge for monitoring.
	/// Used to detect connection leaks or pool exhaustion.
	/// </remarks>
	public int GetActiveDbConnections()
	{
		return ActiveDbConnections;
	}

	/// <summary>
	/// Gets the current queue statistics.
	/// </summary>
	/// <returns>Tuple of (queuedItems, failedItems).</returns>
	/// <remarks>
	/// Provides real-time queue health status.
	/// Used by health check endpoint to determine error queue health.
	/// </remarks>
	public (int queuedItems, int failedItems) GetQueueStats()
	{
		return (QueuedItems, FailedItems);
	}
}
