// <copyright file="ILogService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared;

namespace SeventySix.Logging;

/// <summary>Log business logic operations.</summary>
public interface ILogService
{
	public Task<PagedResult<LogResponse>> GetPagedLogsAsync(LogFilterRequest request, CancellationToken cancellationToken = default);

	public Task<int> GetLogsCountAsync(LogFilterRequest request, CancellationToken cancellationToken = default);

	public Task<bool> DeleteLogByIdAsync(int id, CancellationToken cancellationToken = default);

	public Task<int> DeleteLogsBatchAsync(int[] ids, CancellationToken cancellationToken = default);

	public Task<int> DeleteLogsOlderThanAsync(DateTime cutoffDate, CancellationToken cancellationToken = default);

	public Task<bool> CheckDatabaseHealthAsync(CancellationToken cancellationToken = default);

	public Task CreateClientLogAsync(ClientLogRequest request, CancellationToken cancellationToken = default);

	public Task CreateClientLogBatchAsync(ClientLogRequest[] requests, CancellationToken cancellationToken = default);
}