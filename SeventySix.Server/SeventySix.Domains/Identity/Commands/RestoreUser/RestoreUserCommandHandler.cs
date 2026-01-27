// <copyright file="RestoreUserCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using SeventySix.Shared.POCOs;

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
	/// A Result indicating success or failure with error details.
	/// </returns>
	public static async Task<Result> HandleAsync(
		RestoreUserCommand command,
		UserManager<ApplicationUser> userManager,
		CancellationToken cancellationToken)
	{
		ApplicationUser? user =
			await userManager.FindByIdAsync(
				command.UserId.ToString());

		if (user is null)
		{
			return Result.Failure($"User {command.UserId} not found");
		}

		if (!user.IsDeleted)
		{
			return Result.Failure($"User {command.UserId} is not deleted");
		}

		user.IsDeleted = false;
		user.DeletedAt = null;
		user.DeletedBy = null;
		user.IsActive = true;

		IdentityResult identityResult =
			await userManager.UpdateAsync(user);

		return identityResult.Succeeded
			? Result.Success()
			: Result.Failure(
				string.Join(
					", ",
					identityResult.Errors.Select(
						error => error.Description)));
	}
}