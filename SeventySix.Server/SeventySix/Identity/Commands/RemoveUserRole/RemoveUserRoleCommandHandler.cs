// <copyright file="RemoveUserRoleCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Handler for RemoveUserRoleCommand.
/// </summary>
public static class RemoveUserRoleCommandHandler
{
	/// <summary>
	/// Handles the RemoveUserRoleCommand request.
	/// </summary>
	/// <returns>True if role was removed, false if role not found on user.</returns>
	public static async Task<bool> HandleAsync(
		RemoveUserRoleCommand command,
		IUserRoleRepository userRoleRepository,
		CancellationToken cancellationToken)
	{
		return await userRoleRepository.RemoveRoleAsync(
			command.UserId,
			command.Role,
			cancellationToken);
	}
}