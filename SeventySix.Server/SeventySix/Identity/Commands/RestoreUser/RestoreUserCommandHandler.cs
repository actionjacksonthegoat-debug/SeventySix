// <copyright file="RestoreUserCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Handler for <see cref="RestoreUserCommand"/>.
/// </summary>
public static class RestoreUserCommandHandler
{
	/// <summary>
	/// Handles restoration of a soft-deleted user.
	/// </summary>
	/// <param name="command">The restore user command.</param>
	/// <param name="repository">User repository.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>True if the user was restored; otherwise false.</returns>
	public static async Task<bool> HandleAsync(
		RestoreUserCommand command,
		IUserCommandRepository repository,
		CancellationToken cancellationToken)
	{
		bool result =
			await repository.RestoreAsync(
				command.UserId,
				cancellationToken);

		return result;
	}
}