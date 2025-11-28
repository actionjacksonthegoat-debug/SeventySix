// <copyright file="IMetricsService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Infrastructure;

/// <summary>Application metrics recording via OpenTelemetry.</summary>
public interface IMetricsService
{
	void RecordDatabaseQuery(double durationMs, string queryType);

	void RecordApiCall(double durationMs, string apiName, bool success);

	void RecordQueueStats(int queuedItems, int failedItems);

	int GetActiveDbConnections();

	(int queuedItems, int failedItems) GetQueueStats();
}
