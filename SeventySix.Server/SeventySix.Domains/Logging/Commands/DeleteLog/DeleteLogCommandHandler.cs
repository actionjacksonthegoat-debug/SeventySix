// <copyright file="DeleteLogCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging;

/// <summary>
/// Handler for <see cref="DeleteLogCommand"/>.
/// </summary>
public static class DeleteLogCommandHandler
{
	/// <summary>
	/// Handles the request to delete a log entry by ID.
	/// </summary>
	/// <param name="command">
	/// The delete log command.
	/// </param>
	/// <param name="repository">
	/// The log repository for data access.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// True if the log was deleted successfully, false otherwise.
	/// </returns>
	public static async Task<bool> HandleAsync(
		DeleteLogCommand command,
		ILogRepository repository,
		CancellationToken cancellationToken)
	{
		return await repository.DeleteByIdAsync(
			command.LogId,
			cancellationToken);
	}
}