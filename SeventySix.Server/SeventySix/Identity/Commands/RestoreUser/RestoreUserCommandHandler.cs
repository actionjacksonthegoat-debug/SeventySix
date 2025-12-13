// <copyright file="RestoreUserCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Handler for restoring a soft-deleted user.
/// </summary>
public static class RestoreUserCommandHandler
{
	/// <summary>
	/// Handles restoration of a soft-deleted user.
	/// </summary>
	/// <param name="userId">The user ID to restore.</param>
	/// <param name="repository">User command repository.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>True if the user was restored; otherwise false.</returns>
	public static async Task<bool> HandleAsync(
		int userId,
		IUserRepository repository,
		CancellationToken cancellationToken)
	{
		bool result =
			await repository.RestoreAsync(
				userId,
				cancellationToken);

		return result;
	}
}