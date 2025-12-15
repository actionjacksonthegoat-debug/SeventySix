// <copyright file="ILogRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging;

/// <summary>Log data access operations.</summary>
public interface ILogRepository
{
	public Task<Log> CreateAsync(Log entity, CancellationToken cancellationToken = default);

	public Task<(IEnumerable<Log> Logs, int TotalCount)> GetPagedAsync(
		LogQueryRequest request,
		CancellationToken cancellationToken = default);

	public Task<int> DeleteOlderThanAsync(DateTime cutoffDate, CancellationToken cancellationToken = default);

	public Task<bool> DeleteByIdAsync(int id, CancellationToken cancellationToken = default);

	public Task<int> DeleteBatchAsync(int[] ids, CancellationToken cancellationToken = default);
}