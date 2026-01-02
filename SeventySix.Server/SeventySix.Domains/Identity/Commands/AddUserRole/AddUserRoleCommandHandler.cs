// <copyright file="AddUserRoleCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using SeventySix.Identity.Constants;

namespace SeventySix.Identity;

/// <summary>
/// Handler for AddUserRoleCommand.
/// </summary>
public static class AddUserRoleCommandHandler
{
	/// <summary>
	/// Handles the AddUserRoleCommand request.
	/// </summary>
	/// <returns>
	/// True if role was added, false if user already has the role.
	/// </returns>
	/// <exception cref="ArgumentException">Thrown when role is invalid.</exception>
	public static async Task<bool> HandleAsync(
		AddUserRoleCommand command,
		UserManager<ApplicationUser> userManager,
		IPermissionRequestRepository permissionRequestRepository,
		CancellationToken cancellationToken)
	{
		if (!RoleConstants.ValidRoleNames.Contains(command.Role))
		{
			throw new ArgumentException(
				$"Invalid role: {command.Role}",
				nameof(command));
		}

		ApplicationUser? user =
			await userManager.FindByIdAsync(command.UserId.ToString());

		if (user is null)
		{
			throw new UserNotFoundException(command.UserId);
		}

		IList<string> existingRoles =
			await userManager.GetRolesAsync(user);

		if (existingRoles.Contains(command.Role))
		{
			return false;
		}

		// Add role using Identity's UserManager
		IdentityResult result =
			await userManager.AddToRoleAsync(user, command.Role);

		if (!result.Succeeded)
		{
			throw new InvalidOperationException(
				$"Failed to add role: {string.Join(", ", result.Errors.Select(error => error.Description))}");
		}

		// Cleanup pending permission request for this role
		await permissionRequestRepository.DeleteByUserAndRoleAsync(
			command.UserId,
			command.Role,
			cancellationToken);

		return true;
	}
}