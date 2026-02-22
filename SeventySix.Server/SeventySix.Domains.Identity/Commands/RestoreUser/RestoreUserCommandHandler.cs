// <copyright file="RestoreUserCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SeventySix.Shared.Interfaces;
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
	/// <param name="identityCache">
	/// Identity cache service for clearing user cache.
	/// </param>
	/// <param name="transactionManager">
	/// Transaction manager for concurrency-safe read-then-write operations.
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
		IIdentityCacheService identityCache,
		ITransactionManager transactionManager,
		CancellationToken cancellationToken)
	{
		string? userEmail = null;
		string? userName = null;

		Result txResult =
			await transactionManager.ExecuteInTransactionAsync(
				async ct =>
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

					// Capture values for cache invalidation outside transaction
					userEmail = user.Email;
					userName = user.UserName;

					user.IsDeleted = false;
					user.DeletedAt = null;
					user.DeletedBy = null;
					user.IsActive = true;

					IdentityResult identityResult =
						await userManager.UpdateAsync(user);

					if (!identityResult.Succeeded)
					{
						if (identityResult.Errors.Any(
							error => error.Code == "ConcurrencyFailure"))
						{
							throw new DbUpdateConcurrencyException(
								"Concurrency conflict restoring user. Will retry.");
						}

						return Result.Failure(
							string.Join(
								", ",
								identityResult.Errors.Select(
									error => error.Description)));
					}

					return Result.Success();
				},
				cancellationToken: cancellationToken);

		if (!txResult.IsSuccess)
		{
			return txResult;
		}

		// Invalidate all user cache entries (outside transaction — after commit)
		await identityCache.InvalidateUserAsync(
			command.UserId,
			email: userEmail,
			username: userName);

		await identityCache.InvalidateAllUsersAsync();

		return txResult;
	}
}