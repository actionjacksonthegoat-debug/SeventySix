// <copyright file="AddUserRoleCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using SeventySix.Identity.Constants;
using SeventySix.Shared.POCOs;

namespace SeventySix.Identity;

/// <summary>
/// Handler for AddUserRoleCommand.
/// </summary>
public static class AddUserRoleCommandHandler
{
	/// <summary>
	/// Handles the AddUserRoleCommand request.
	/// </summary>
	/// <param name="command">
	/// The command containing user ID and role to add.
	/// </param>
	/// <param name="userManager">
	/// The ASP.NET Identity user manager.
	/// </param>
	/// <param name="permissionRequestRepository">
	/// Repository for permission request cleanup.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A Result indicating success or failure with error details.
	/// </returns>
	/// <exception cref="ArgumentException">
	/// Thrown when role is invalid.
	/// </exception>
	/// <exception cref="UserNotFoundException">
	/// Thrown when user is not found.
	/// </exception>
	public static async Task<Result> HandleAsync(
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
			await userManager.FindByIdAsync(
				command.UserId.ToString());

		if (user is null)
		{
			throw new UserNotFoundException(command.UserId);
		}

		IList<string> existingRoles =
			await userManager.GetRolesAsync(user);

		if (existingRoles.Contains(command.Role))
		{
			return Result.Failure(
				$"User {command.UserId} already has role {command.Role}");
		}

		IdentityResult identityResult =
			await userManager.AddToRoleAsync(
				user,
				command.Role);

		if (!identityResult.Succeeded)
		{
			return Result.Failure(
				$"Failed to add role: {string.Join(
					", ",
					identityResult.Errors.Select(
						error => error.Description))}");
		}

		await permissionRequestRepository.DeleteByUserAndRoleAsync(
			command.UserId,
			command.Role,
			cancellationToken);

		return Result.Success();
	}
}