// <copyright file="DeleteLogCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging;

/// <summary>
/// Handler for deleting a single log entry.
/// </summary>
public static class DeleteLogCommandHandler
{
	/// <summary>
	/// Handles the command to delete a log entry by ID.
	/// </summary>
	/// <param name="command">The command containing the log ID to delete.</param>
	/// <param name="repository">The log repository for data access.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>True if the log was deleted successfully, false otherwise.</returns>
	public static async Task<bool> HandleAsync(
		DeleteLogCommand command,
		ILogRepository repository,
		CancellationToken cancellationToken)
	{
		return await repository.DeleteByIdAsync(
			command.Id,
			cancellationToken);
	}
}