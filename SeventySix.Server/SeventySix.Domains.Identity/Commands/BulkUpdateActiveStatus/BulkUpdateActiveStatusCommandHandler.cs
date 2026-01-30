// <copyright file="BulkUpdateActiveStatusCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;

namespace SeventySix.Identity;

/// <summary>
/// Handler for <see cref="BulkUpdateActiveStatusCommand"/>.
/// </summary>
public static class BulkUpdateActiveStatusCommandHandler
{
	/// <summary>
	/// Handles bulk update of user active status.
	/// </summary>
	/// <param name="command">
	/// The bulk update command.
	/// </param>
	/// <param name="userManager">
	/// Identity <see cref="UserManager{TUser}"/> for user operations.
	/// </param>
	/// <param name="identityCache">
	/// Identity cache service for clearing user cache.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// The number of users updated.
	/// </returns>
	public static async Task<long> HandleAsync(
		BulkUpdateActiveStatusCommand command,
		UserManager<ApplicationUser> userManager,
		IIdentityCacheService identityCache,
		CancellationToken cancellationToken)
	{
		long updatedCount = 0;
		List<long> updatedUserIds = [];

		foreach (long userId in command.UserIds)
		{
			ApplicationUser? user =
				await userManager.FindByIdAsync(
					userId.ToString());

			if (user is null)
			{
				continue;
			}

			user.IsActive = command.IsActive;

			IdentityResult result =
				await userManager.UpdateAsync(user);

			if (result.Succeeded)
			{
				updatedCount++;
				updatedUserIds.Add(userId);
			}
		}

		// Invalidate cache for all affected users
		if (updatedUserIds.Count > 0)
		{
			await identityCache.InvalidateBulkUsersAsync(updatedUserIds);
		}

		return updatedCount;
	}
}