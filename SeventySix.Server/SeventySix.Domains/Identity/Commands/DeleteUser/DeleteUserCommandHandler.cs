// <copyright file="DeleteUserCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using SeventySix.Shared.Interfaces;
using SeventySix.Shared.POCOs;

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
	/// <param name="cacheInvalidation">
	/// Cache invalidation service for clearing user cache.
	/// </param>
	/// <param name="timeProvider">
	/// Time provider for current time values.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A Result indicating success or failure with error details.
	/// </returns>
	public static async Task<Result> HandleAsync(
		DeleteUserCommand command,
		UserManager<ApplicationUser> userManager,
		ICacheInvalidationService cacheInvalidation,
		TimeProvider timeProvider,
		CancellationToken cancellationToken)
	{
		ApplicationUser? user =
			await userManager.FindByIdAsync(
				command.UserId.ToString());

		if (user is null)
		{
			return Result.Failure($"User {command.UserId} not found");
		}

		if (user.IsDeleted)
		{
			return Result.Failure($"User {command.UserId} is already deleted");
		}

		// Capture values for cache invalidation
		string? userEmail =
			user.Email;
		string? userName =
			user.UserName;

		user.IsDeleted = true;
		user.DeletedAt =
			timeProvider.GetUtcNow().UtcDateTime;
		user.DeletedBy = command.DeletedBy;
		user.IsActive = false;

		IdentityResult identityResult =
			await userManager.UpdateAsync(user);

		if (identityResult.Succeeded)
		{
			// Invalidate all user cache entries
			await cacheInvalidation.InvalidateUserCacheAsync(
				command.UserId,
				email: userEmail,
				username: userName);

			await cacheInvalidation.InvalidateUserRolesCacheAsync(command.UserId);
			await cacheInvalidation.InvalidateAllUsersCacheAsync();

			return Result.Success();
		}

		return Result.Failure(
			string.Join(
				", ",
				identityResult.Errors.Select(
					error => error.Description)));
	}
}