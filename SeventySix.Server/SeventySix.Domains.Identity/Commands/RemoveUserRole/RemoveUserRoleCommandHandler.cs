// <copyright file="RemoveUserRoleCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SeventySix.Identity.Constants;
using SeventySix.Shared.Interfaces;
using SeventySix.Shared.POCOs;

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
	/// <param name="identityCache">
	/// Identity cache service for clearing role cache.
	/// </param>
	/// <param name="transactionManager">
	/// Transaction manager for concurrency-safe read-then-write operations.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token for async operation.
	/// </param>
	/// <returns>
	/// A Result indicating success or failure with error details.
	/// </returns>
	/// <exception cref="LastAdminException">
	/// Thrown when attempting to remove Admin role from the last admin user.
	/// </exception>
	public static async Task<Result> HandleAsync(
		RemoveUserRoleCommand command,
		UserManager<ApplicationUser> userManager,
		IIdentityCacheService identityCache,
		ITransactionManager transactionManager,
		CancellationToken cancellationToken)
	{
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

					IList<string> existingRoles =
						await userManager.GetRolesAsync(user);

					if (!existingRoles.Contains(command.Role))
					{
						return Result.Failure(
							$"User {command.UserId} does not have role {command.Role}");
					}

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

					IdentityResult identityResult =
						await userManager.RemoveFromRoleAsync(
							user,
							command.Role);

					if (!identityResult.Succeeded)
					{
						if (identityResult.Errors.Any(
							error => error.Code == "ConcurrencyFailure"))
						{
							throw new DbUpdateConcurrencyException(
								"Concurrency conflict removing role. Will retry.");
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

		// Invalidate role caches (outside transaction — after commit)
		await identityCache.InvalidateUserRolesAsync(command.UserId);

		return txResult;
	}
}