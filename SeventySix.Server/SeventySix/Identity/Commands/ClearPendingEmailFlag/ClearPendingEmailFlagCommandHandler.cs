// <copyright file="ClearPendingEmailFlagCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Handler for <see cref="ClearPendingEmailFlagCommand"/>.
/// </summary>
public static class ClearPendingEmailFlagCommandHandler
{
	/// <summary>
	/// Handles clearing the pending email flag for a user.
	/// </summary>
	/// <param name="command">The command.</param>
	/// <param name="repository">User repository.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>A task representing the async operation.</returns>
	public static async Task HandleAsync(
		ClearPendingEmailFlagCommand command,
		IUserRepository repository,
		CancellationToken cancellationToken)
	{
		User? user =
			await repository.GetByIdAsync(
				command.UserId,
				cancellationToken);

		if (user?.NeedsPendingEmail == true)
		{
			user.NeedsPendingEmail = false;

			await repository.UpdateAsync(
				user,
				cancellationToken);
		}
	}
}
