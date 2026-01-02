// <copyright file="DeleteUserCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;

namespace SeventySix.Identity;

/// <summary>
/// Handler for <see cref="DeleteUserCommand"/>.
/// </summary>
public static class DeleteUserCommandHandler
{
	/// <summary>
	/// Handles soft deletion of a user.
	/// </summary>
	/// <param name="command">
	/// The delete user command.
	/// </param>
	/// <param name="userManager">
	/// Identity <see cref="UserManager{TUser}"/> for user operations.
	/// </param>
	/// <param name="timeProvider">
	/// Time provider for current time values.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// True if the user was deleted; otherwise false.
	/// </returns>
	public static async Task<bool> HandleAsync(
		DeleteUserCommand command,
		UserManager<ApplicationUser> userManager,
		TimeProvider timeProvider,
		CancellationToken cancellationToken)
	{
		ApplicationUser? user =
			await userManager.FindByIdAsync(command.UserId.ToString());

		if (user == null || user.IsDeleted)
		{
			return false;
		}

		// Soft delete - set flags instead of hard delete
		user.IsDeleted = true;
		user.DeletedAt =
			timeProvider.GetUtcNow().UtcDateTime;
		user.DeletedBy = command.DeletedBy;
		user.IsActive = false;

		IdentityResult result =
			await userManager.UpdateAsync(user);

		return result.Succeeded;
	}
}