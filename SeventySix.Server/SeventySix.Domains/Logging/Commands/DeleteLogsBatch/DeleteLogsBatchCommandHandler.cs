// <copyright file="DeleteLogsBatchCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging;

/// <summary>
/// Handler for deleting multiple log entries in a batch.
/// </summary>
public static class DeleteLogsBatchCommandHandler
{
	/// <summary>
	/// Handles the request to delete multiple log entries by their IDs.
	/// </summary>
	/// <param name="logIds">The array of log IDs to delete.</param>
	/// <param name="repository">The log repository for data access.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The number of logs deleted.</returns>
	public static async Task<int> HandleAsync(
		int[] logIds,
		ILogRepository repository,
		CancellationToken cancellationToken)
	{
		return await repository.DeleteBatchAsync(logIds, cancellationToken);
	}
}