// <copyright file="DeleteLogsOlderThanCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging;

/// <summary>
/// Handler for deleting log entries older than a specified date.
/// </summary>
public static class DeleteLogsOlderThanCommandHandler
{
	/// <summary>
	/// Handles the request to delete logs older than the specified cutoff date.
	/// </summary>
	/// <param name="cutoffDate">The cutoff date - logs older than this will be deleted.</param>
	/// <param name="repository">The log repository for data access.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The number of logs deleted.</returns>
	public static async Task<int> HandleAsync(
		DateTime cutoffDate,
		ILogRepository repository,
		CancellationToken cancellationToken)
	{
		return await repository.DeleteOlderThanAsync(
			cutoffDate,
			cancellationToken);
	}
}