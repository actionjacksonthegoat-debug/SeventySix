// <copyright file="ClearPendingEmailFlagCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;

namespace SeventySix.Identity;

/// <summary>
/// Handler for <see cref="ClearPendingEmailFlagCommand"/>.
/// </summary>
public static class ClearPendingEmailFlagCommandHandler
{
	/// <summary>
	/// Handles clearing the pending email flag for a user.
	/// </summary>
	/// <param name="command">
	/// The clear pending email flag command.
	/// </param>
	/// <param name="userManager">
	/// Identity <see cref="UserManager{TUser}"/> for user operations.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public static async Task HandleAsync(
		ClearPendingEmailFlagCommand command,
		UserManager<ApplicationUser> userManager,
		CancellationToken cancellationToken)
	{
		ApplicationUser? user =
			await userManager.FindByIdAsync(command.UserId.ToString());

		if (user?.NeedsPendingEmail == true)
		{
			user.NeedsPendingEmail = false;

			await userManager.UpdateAsync(user);
		}
	}
}