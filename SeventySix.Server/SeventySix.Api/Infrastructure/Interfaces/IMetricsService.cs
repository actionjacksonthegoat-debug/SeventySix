// <copyright file="IMetricsService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Application metrics recording service via OpenTelemetry.
/// </summary>
/// <remarks>
/// <para>
/// Provides instrumentation for database operations, external API calls, and queue health.
/// Metrics are exported to Prometheus via the OpenTelemetry SDK and scraped from /metrics.
/// </para>
/// <para>
/// Duration parameters use <c>double</c> throughout this interface because the OpenTelemetry
/// .NET SDK requires <c>Histogram&lt;double&gt;</c>. <c>Histogram&lt;decimal&gt;</c> does not
/// exist — <c>decimal</c> is not a supported instrument type in the OpenTelemetry .NET API.
/// </para>
/// </remarks>
public interface IMetricsService
{
	/// <summary>
	/// Records the duration of a completed database query.
	/// </summary>
	/// <param name="durationMs">
	/// The query execution time in milliseconds.
	/// </param>
	/// <param name="queryType">
	/// A label identifying the type of query (e.g., "read", "write", "migration").
	/// </param>
	public void RecordDatabaseQuery(double durationMs, string queryType);

	/// <summary>
	/// Records the duration and outcome of a completed external API call.
	/// </summary>
	/// <param name="durationMs">
	/// The round-trip call duration in milliseconds.
	/// </param>
	/// <param name="apiName">
	/// The name of the external API (e.g., "GitHub", "HIBP").
	/// </param>
	/// <param name="success">
	/// <see langword="true"/> if the call completed successfully; <see langword="false"/> if it failed.
	/// </param>
	public void RecordApiCall(double durationMs, string apiName, bool success);

	/// <summary>
	/// Updates the observable gauge values for current email queue health.
	/// </summary>
	/// <remarks>
	/// Sets the in-memory counters that are read by the OpenTelemetry
	/// <c>ObservableGauge</c> callbacks on each scrape cycle.
	/// </remarks>
	/// <param name="queuedItems">
	/// The current number of items waiting to be processed in the queue.
	/// </param>
	/// <param name="failedItems">
	/// The current number of items that have permanently failed processing.
	/// </param>
	public void RecordQueueStats(int queuedItems, int failedItems);

	/// <summary>
	/// Returns the most recently recorded email queue statistics.
	/// </summary>
	/// <returns>
	/// A tuple containing the queued item count and failed item count,
	/// as last set by <see cref="RecordQueueStats"/>.
	/// </returns>
	public (int queuedItems, int failedItems) GetQueueStats();
}