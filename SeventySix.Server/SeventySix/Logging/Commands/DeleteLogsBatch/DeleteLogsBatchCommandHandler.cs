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
	/// Handles the command to delete multiple log entries by their IDs.
	/// </summary>
	/// <param name="command">The command containing the log IDs to delete.</param>
	/// <param name="repository">The log repository for data access.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The number of logs deleted.</returns>
	public static async Task<int> HandleAsync(
		DeleteLogsBatchCommand command,
		ILogRepository repository,
		CancellationToken cancellationToken)
	{
		return await repository.DeleteBatchAsync(
			command.Ids,
			cancellationToken);
	}
}