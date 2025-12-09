// <copyright file="DeleteUserCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Handler for <see cref="DeleteUserCommand"/>.
/// </summary>
public static class DeleteUserCommandHandler
{
	/// <summary>
	/// Handles soft deletion of a user.
	/// </summary>
	/// <param name="command">The delete user command.</param>
	/// <param name="repository">User repository.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>True if the user was deleted; otherwise false.</returns>
	public static async Task<bool> HandleAsync(
		DeleteUserCommand command,
		IUserRepository repository,
		CancellationToken cancellationToken)
	{
		bool result =
			await repository.SoftDeleteAsync(
				command.UserId,
				command.DeletedBy,
				cancellationToken);

		return result;
	}
}