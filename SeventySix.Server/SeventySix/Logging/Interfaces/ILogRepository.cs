// <copyright file="ILogRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging;

/// <summary>Log data access operations.</summary>
public interface ILogRepository
{
	Task<Log> CreateAsync(Log entity, CancellationToken cancellationToken = default);

	Task<(IEnumerable<Log> Logs, int TotalCount)> GetPagedAsync(
		LogFilterRequest request,
		CancellationToken cancellationToken = default);

	Task<int> DeleteOlderThanAsync(DateTime cutoffDate, CancellationToken cancellationToken = default);

	Task<bool> DeleteByIdAsync(int id, CancellationToken cancellationToken = default);

	Task<int> DeleteBatchAsync(int[] ids, CancellationToken cancellationToken = default);
}

