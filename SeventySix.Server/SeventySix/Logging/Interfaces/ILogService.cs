// <copyright file="ILogService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared;

namespace SeventySix.Logging;

/// <summary>Log business logic operations.</summary>
public interface ILogService
{
	Task<PagedResult<LogResponse>> GetPagedLogsAsync(LogFilterRequest request, CancellationToken cancellationToken = default);

	Task<int> GetLogsCountAsync(LogFilterRequest request, CancellationToken cancellationToken = default);

	Task<bool> DeleteLogByIdAsync(int id, CancellationToken cancellationToken = default);

	Task<int> DeleteLogsBatchAsync(int[] ids, CancellationToken cancellationToken = default);

	Task<int> DeleteLogsOlderThanAsync(DateTime cutoffDate, CancellationToken cancellationToken = default);

	Task<bool> CheckDatabaseHealthAsync(CancellationToken cancellationToken = default);

	Task CreateClientLogAsync(ClientLogRequest request, CancellationToken cancellationToken = default);

	Task CreateClientLogBatchAsync(ClientLogRequest[] requests, CancellationToken cancellationToken = default);
}

