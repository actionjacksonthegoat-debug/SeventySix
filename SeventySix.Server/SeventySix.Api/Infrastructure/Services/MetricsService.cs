// <copyright file="MetricsService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Diagnostics.Metrics;

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Service for recording application metrics using OpenTelemetry.
/// </summary>
/// <remarks>
/// Implements metric recording for database operations, API calls, and queue health.
/// Uses OpenTelemetry instrumentation for Prometheus export.
/// Metrics are exposed via the /metrics endpoint for scraping.
/// Note: Histogram&lt;double&gt; and method parameters use double because the OpenTelemetry
/// .NET SDK does not support decimal — Histogram&lt;decimal&gt; does not exist.
/// </remarks>
public sealed class MetricsService() : IMetricsService
{
	private static readonly Meter ApplicationMeter =
		new(
			"SeventySix.Api",
			"1.0.0");

	// OpenTelemetry SDK requires Histogram<double> — decimal not supported
	private static readonly Histogram<double> DatabaseQueryDuration =
		ApplicationMeter.CreateHistogram<double>(
			"db_query_duration_ms",
			unit: "milliseconds",
			description: "Duration of database queries");

	// OpenTelemetry SDK requires Histogram<double> — decimal not supported
	private static readonly Histogram<double> ApiCallDuration =
		ApplicationMeter.CreateHistogram<double>(
			"api_call_duration_ms",
			unit: "milliseconds",
			description: "Duration of external API calls");

	private static readonly Counter<long> ApiCallCounter =
		ApplicationMeter.CreateCounter<long>(
			"api_call_total",
			description: "Total number of external API calls");

	private static readonly Counter<long> ApiCallFailures =
		ApplicationMeter.CreateCounter<long>(
			"api_call_failures_total",
			description: "Total number of failed external API calls");

	private static readonly ObservableGauge<int> QueuedItemsGauge =
		ApplicationMeter.CreateObservableGauge(
			"queued_items",
			() => QueuedItems,
			description: "Current number of items in the error queue");

	private static readonly ObservableGauge<int> FailedItemsGauge =
		ApplicationMeter.CreateObservableGauge(
			"failed_items",
			() => FailedItems,
			description: "Current number of failed items in the error queue");

	private static volatile int QueuedItems;
	private static volatile int FailedItems;

	/// <inheritdoc/>
	public void RecordDatabaseQuery(double durationMs, string queryType)
	{
		DatabaseQueryDuration.Record(
			durationMs,
			new KeyValuePair<string, object?>("query_type", queryType));
	}

	/// <inheritdoc/>
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
			ApiCallFailures.Add(
				1,
				new KeyValuePair<string, object?>("api_name", apiName));
		}
	}

	/// <inheritdoc/>
	public void RecordQueueStats(int queuedItems, int failedItems) =>
		UpdateQueueStats(queuedItems, failedItems);

	/// <summary>Writes queue stats to static gauge backing fields.</summary>
	/// <remarks>Static method avoids cs/static-field-written-by-instance alert.</remarks>
	private static void UpdateQueueStats(int queuedItems, int failedItems)
	{
		Interlocked.Exchange(ref QueuedItems, queuedItems);
		Interlocked.Exchange(ref FailedItems, failedItems);
	}

	/// <inheritdoc/>
	public (int queuedItems, int failedItems) GetQueueStats()
	{
		return (QueuedItems, FailedItems);
	}
}