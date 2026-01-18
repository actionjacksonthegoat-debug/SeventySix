// <copyright file="RemoveUserRoleCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using SeventySix.Identity.Constants;

namespace SeventySix.Identity;

/// <summary>
/// Handler for RemoveUserRoleCommand.
/// </summary>
/// <remarks>
/// This handler enforces the business rule that at least one admin must exist
/// in the system. Attempting to remove the Admin role from the last admin
/// will throw a <see cref="LastAdminException"/>.
/// </remarks>
public static class RemoveUserRoleCommandHandler
{
	/// <summary>
	/// Handles the RemoveUserRoleCommand request.
	/// </summary>
	/// <param name="command">
	/// The command containing the user ID and role to remove.
	/// </param>
	/// <param name="userManager">
	/// The ASP.NET Identity user manager.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// True if role was removed, false if role not found on user.
	/// </returns>
	/// <exception cref="LastAdminException">
	/// Thrown when attempting to remove Admin role from the last admin user.
	/// </exception>
	public static async Task<bool> HandleAsync(
		RemoveUserRoleCommand command,
		UserManager<ApplicationUser> userManager,
		CancellationToken cancellationToken)
	{
		ApplicationUser? user =
			await userManager.FindByIdAsync(
				command.UserId.ToString());

		if (user is null)
		{
			return false;
		}

		IList<string> existingRoles =
			await userManager.GetRolesAsync(user);

		if (!existingRoles.Contains(command.Role))
		{
			return false;
		}

		// Protect against removing Admin role from the last admin
		if (command.Role == RoleConstants.Admin)
		{
			IList<ApplicationUser> adminUsers =
				await userManager.GetUsersInRoleAsync(RoleConstants.Admin);

			bool isLastAdmin =
				adminUsers.Count <= 1
					&& adminUsers.Any(
						adminUser => adminUser.Id == command.UserId);

			if (isLastAdmin)
			{
				throw new LastAdminException();
			}
		}

		IdentityResult result =
			await userManager.RemoveFromRoleAsync(
				user,
				command.Role);

		return result.Succeeded;
	}
}