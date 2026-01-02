// <copyright file="RestoreUserCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;

namespace SeventySix.Identity;

/// <summary>
/// Handler for <see cref="RestoreUserCommand"/>.
/// </summary>
public static class RestoreUserCommandHandler
{
	/// <summary>
	/// Handles restoration of a soft-deleted user.
	/// </summary>
	/// <param name="command">
	/// The restore user command.
	/// </param>
	/// <param name="userManager">
	/// Identity <see cref="UserManager{TUser}"/> for user operations.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// True if the user was restored; otherwise false.
	/// </returns>
	public static async Task<bool> HandleAsync(
		RestoreUserCommand command,
		UserManager<ApplicationUser> userManager,
		CancellationToken cancellationToken)
	{
		ApplicationUser? user =
			await userManager.FindByIdAsync(command.UserId.ToString());

		if (user == null || !user.IsDeleted)
		{
			return false;
		}

		// Restore user - clear soft delete flags
		user.IsDeleted = false;
		user.DeletedAt = null;
		user.DeletedBy = null;
		user.IsActive = true;

		IdentityResult result =
			await userManager.UpdateAsync(user);

		return result.Succeeded;
	}
}