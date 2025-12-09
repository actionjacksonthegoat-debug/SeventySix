// <copyright file="BulkUpdateActiveStatusCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Handler for <see cref="BulkUpdateActiveStatusCommand"/>.
/// </summary>
public static class BulkUpdateActiveStatusCommandHandler
{
	/// <summary>
	/// Handles bulk update of user active status.
	/// </summary>
	/// <param name="command">The bulk update command.</param>
	/// <param name="repository">User repository.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The number of users updated.</returns>
	/// <remarks>
	/// Repository call is already atomic via EF Core's SaveChangesAsync.
	/// No explicit transaction needed for single operation.
	/// </remarks>
	public static async Task<int> HandleAsync(
		BulkUpdateActiveStatusCommand command,
		IUserRepository repository,
		CancellationToken cancellationToken)
	{
		int count =
			await repository.BulkUpdateActiveStatusAsync(
				command.UserIds,
				command.IsActive,
				cancellationToken);

		return count;
	}
}
