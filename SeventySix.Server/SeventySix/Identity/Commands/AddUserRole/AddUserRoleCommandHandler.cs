// <copyright file="AddUserRoleCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

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
	/// <returns>True if role was added, false if user already has the role.</returns>
	/// <exception cref="ArgumentException">Thrown when role is invalid.</exception>
	public static async Task<bool> HandleAsync(
		AddUserRoleCommand command,
		IUserRepository userRepository,
		IPermissionRequestRepository permissionRequestRepository,
		CancellationToken cancellationToken)
	{
		if (!RoleConstants.ValidRoleNames.Contains(command.Role))
		{
			throw new ArgumentException(
				$"Invalid role: {command.Role}",
				nameof(command));
		}

		if (await userRepository.HasRoleAsync(
			command.UserId,
			command.Role,
			cancellationToken))
		{
			return false;
		}

		// Audit fields (CreatedBy, CreateDate) set by AuditInterceptor
		await userRepository.AddRoleAsync(
			command.UserId,
			command.Role,
			cancellationToken);

		// Cleanup pending permission request for this role
		await permissionRequestRepository.DeleteByUserAndRoleAsync(
			command.UserId,
			command.Role,
			cancellationToken);

		return true;
	}
}