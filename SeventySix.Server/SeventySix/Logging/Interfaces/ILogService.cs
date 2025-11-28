// <copyright file="ILogService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared;

namespace SeventySix.Logging;

/// <summary>Log business logic operations.</summary>
public interface ILogService
{
	public Task<PagedResult<LogDto>> GetPagedLogsAsync(LogQueryRequest request, CancellationToken cancellationToken = default);

	public Task<bool> DeleteLogByIdAsync(int id, CancellationToken cancellationToken = default);

	public Task<int> DeleteLogsBatchAsync(int[] ids, CancellationToken cancellationToken = default);

	public Task<int> DeleteLogsOlderThanAsync(DateTime cutoffDate, CancellationToken cancellationToken = default);

	public Task<bool> CheckDatabaseHealthAsync(CancellationToken cancellationToken = default);

	public Task CreateClientLogAsync(CreateLogRequest request, CancellationToken cancellationToken = default);

	public Task CreateClientLogBatchAsync(CreateLogRequest[] requests, CancellationToken cancellationToken = default);
}