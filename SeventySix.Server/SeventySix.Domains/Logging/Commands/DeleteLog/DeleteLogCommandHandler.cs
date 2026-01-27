// <copyright file="DeleteLogCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.POCOs;

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
	/// A Result indicating success or failure with error details.
	/// </returns>
	public static async Task<Result> HandleAsync(
		DeleteLogCommand command,
		ILogRepository repository,
		CancellationToken cancellationToken)
	{
		bool deleted =
			await repository.DeleteByIdAsync(
				command.LogId,
				cancellationToken);

		return deleted
			? Result.Success()
			: Result.Failure($"Log {command.LogId} not found");
	}
}