// <copyright file="ClearPendingEmailFlagCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Handler for clearing the pending email flag for a user.
/// </summary>
public static class ClearPendingEmailFlagCommandHandler
{
	/// <summary>
	/// Handles clearing the pending email flag for a user.
	/// </summary>
	/// <param name="userId">The user ID to clear the pending email flag for.</param>
	/// <param name="userQueryRepository">User query repository.</param>
	/// <param name="userCommandRepository">User command repository.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>A task representing the async operation.</returns>
	public static async Task HandleAsync(
		int userId,
		IUserRepository userRepository,
		CancellationToken cancellationToken)
	{
		User? user =
			await userRepository.GetByIdAsync(
				userId,
				cancellationToken);

		if (user?.NeedsPendingEmail == true)
		{
			user.NeedsPendingEmail = false;

			await userRepository.UpdateAsync(
				user,
				cancellationToken);
		}
	}
}