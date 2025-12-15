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
/// </remarks>
public class MetricsService : IMetricsService
{
	private static readonly Meter ApplicationMeter =
		new(
			"SeventySix.Api",
			"1.0.0");

	private static readonly Histogram<double> DatabaseQueryDuration =
		ApplicationMeter.CreateHistogram<double>(
			"db_query_duration_ms",
			unit: "milliseconds",
			description: "Duration of database queries");

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

	private static int QueuedItems;
	private static int FailedItems;

	/// <summary>
	/// Initializes a new instance of the <see cref="MetricsService"/> class.
	/// </summary>
	public MetricsService()
	{
		ApplicationMeter.CreateObservableGauge(
			"queued_items",
			() => QueuedItems,
			description: "Current number of items in the error queue");

		ApplicationMeter.CreateObservableGauge(
			"failed_items",
			() => FailedItems,
			description: "Current number of failed items in the error queue");
	}

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
	public void RecordQueueStats(int queuedItems, int failedItems)
	{
		QueuedItems = queuedItems;
		FailedItems = failedItems;
	}

	/// <inheritdoc/>
	public (int queuedItems, int failedItems) GetQueueStats()
	{
		return (QueuedItems, FailedItems);
	}
}
