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
	/// Handles the command to delete logs older than the specified cutoff date.
	/// </summary>
	/// <param name="command">The command containing the cutoff date.</param>
	/// <param name="repository">The log repository for data access.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The number of logs deleted.</returns>
	public static async Task<int> HandleAsync(
		DeleteLogsOlderThanCommand command,
		ILogRepository repository,
		CancellationToken cancellationToken)
	{
		return await repository.DeleteOlderThanAsync(
			command.CutoffDate,
			cancellationToken);
	}
}