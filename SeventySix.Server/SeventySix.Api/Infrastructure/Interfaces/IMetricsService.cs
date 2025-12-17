// <copyright file="IMetricsService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Infrastructure;

/// <summary>Application metrics recording via OpenTelemetry.</summary>
public interface IMetricsService
{
	public void RecordDatabaseQuery(double durationMs, string queryType);

	public void RecordApiCall(double durationMs, string apiName, bool success);

	public void RecordQueueStats(int queuedItems, int failedItems);

	public (int queuedItems, int failedItems) GetQueueStats();
}