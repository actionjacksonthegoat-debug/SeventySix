// <copyright file="MetricsService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Diagnostics.Metrics;
using SeventySix.Core.Interfaces;

namespace SeventySix.BusinessLogic.Services;

/// <summary>
/// Service for recording application metrics using OpenTelemetry.
/// </summary>
/// <remarks>
/// Implements custom metrics collection for database operations, API calls,
/// and queue health monitoring. Metrics are exposed via Prometheus endpoint.
/// Follows SRP by handling only metrics recording concerns.
/// </remarks>
public class MetricsService : IMetricsService
{
	private static readonly Meter ApplicationMeter = new("SeventySix.Api", "1.0.0");

	// Histograms for measuring durations
	private static readonly Histogram<double> DatabaseQueryDuration = ApplicationMeter.CreateHistogram<double>(
		name: "seventysix.database.query.duration",
		unit: "ms",
		description: "Duration of database queries in milliseconds");

	private static readonly Histogram<double> ApiCallDuration = ApplicationMeter.CreateHistogram<double>(
		name: "seventysix.api.call.duration",
		unit: "ms",
		description: "Duration of external API calls in milliseconds");

	// Counters for tracking totals
	private static readonly Counter<long> ApiCallCounter = ApplicationMeter.CreateCounter<long>(
		name: "seventysix.api.call.total",
		unit: "{calls}",
		description: "Total number of external API calls");

	private static readonly Counter<long> ApiCallFailures = ApplicationMeter.CreateCounter<long>(
		name: "seventysix.api.call.failures",
		unit: "{calls}",
		description: "Total number of failed external API calls");

	// Observable gauges for current state
	private static int ActiveDbConnections = 0;
	private static int QueuedItems = 0;
	private static int FailedItems = 0;

	static MetricsService()
	{
		// Register observable gauges
		_ = ApplicationMeter.CreateObservableGauge(
			name: "seventysix.database.connections.active",
			observeValue: () => ActiveDbConnections,
			unit: "{connections}",
			description: "Number of active database connections");

		_ = ApplicationMeter.CreateObservableGauge(
			name: "seventysix.queue.items.queued",
			observeValue: () => QueuedItems,
			unit: "{items}",
			description: "Number of items in the error queue");

		_ = ApplicationMeter.CreateObservableGauge(
			name: "seventysix.queue.items.failed",
			observeValue: () => FailedItems,
			unit: "{items}",
			description: "Number of failed items in the error queue");
	}

	/// <inheritdoc/>
	public void RecordDatabaseQuery(double durationMs, string queryType)
	{
		DatabaseQueryDuration.Record(
			durationMs,
			new KeyValuePair<string, object?>("query.type", queryType));
	}

	/// <inheritdoc/>
	public void RecordApiCall(double durationMs, string apiName, bool success)
	{
		ApiCallDuration.Record(
			durationMs,
			new KeyValuePair<string, object?>("api.name", apiName),
			new KeyValuePair<string, object?>("success", success));

		ApiCallCounter.Add(
			1,
			new KeyValuePair<string, object?>("api.name", apiName));

		if (!success)
		{
			ApiCallFailures.Add(
				1,
				new KeyValuePair<string, object?>("api.name", apiName));
		}
	}

	/// <inheritdoc/>
	public void RecordQueueStats(int queuedItems, int failedItems)
	{
		QueuedItems = queuedItems;
		FailedItems = failedItems;
	}

	/// <inheritdoc/>
	public int GetActiveDbConnections()
	{
		return ActiveDbConnections;
	}

	/// <inheritdoc/>
	public (int queuedItems, int failedItems) GetQueueStats()
	{
		return (QueuedItems, FailedItems);
	}

	/// <summary>
	/// Sets the number of active database connections (for internal use).
	/// </summary>
	/// <param name="count">Number of active connections.</param>
	internal static void SetActiveDbConnections(int count)
	{
		ActiveDbConnections = count;
	}
}
