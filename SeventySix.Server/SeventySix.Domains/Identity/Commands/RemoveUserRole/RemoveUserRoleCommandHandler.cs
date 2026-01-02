// <copyright file="RemoveUserRoleCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;

namespace SeventySix.Identity;

/// <summary>
/// Handler for RemoveUserRoleCommand.
/// </summary>
public static class RemoveUserRoleCommandHandler
{
	/// <summary>
	/// Handles the RemoveUserRoleCommand request.
	/// </summary>
	/// <returns>
	/// True if role was removed, false if role not found on user.
	/// </returns>
	public static async Task<bool> HandleAsync(
		RemoveUserRoleCommand command,
		UserManager<ApplicationUser> userManager,
		CancellationToken cancellationToken)
	{
		ApplicationUser? user =
			await userManager.FindByIdAsync(command.UserId.ToString());

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

		IdentityResult result =
			await userManager.RemoveFromRoleAsync(user, command.Role);

		return result.Succeeded;
	}
}