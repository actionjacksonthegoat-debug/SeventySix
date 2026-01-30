// <copyright file="ApprovePermissionRequestCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using SeventySix.Shared.POCOs;

namespace SeventySix.Identity.Commands.ApprovePermissionRequest;

/// <summary>
/// Handler for approving a single permission request.
/// </summary>
public static class ApprovePermissionRequestCommandHandler
{
	/// <summary>
	/// Handles the approval of a permission request.
	/// </summary>
	/// <param name="command">
	/// The approve command.
	/// </param>
	/// <param name="repository">
	/// The permission request repository.
	/// </param>
	/// <param name="userManager">
	/// Identity <see cref="UserManager{TUser}"/> for role operations.
	/// </param>
	/// <param name="identityCache">
	/// Identity cache service for clearing role and request caches.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// A Result indicating success or failure with error details.
	/// </returns>
	public static async Task<Result> HandleAsync(
		ApprovePermissionRequestCommand command,
		IPermissionRequestRepository repository,
		UserManager<ApplicationUser> userManager,
		IIdentityCacheService identityCache,
		CancellationToken cancellationToken)
	{
		PermissionRequest? request =
			await repository.GetByIdAsync(
				command.RequestId,
				cancellationToken);

		if (request is null)
		{
			return Result.Failure(
				$"Permission request {command.RequestId} not found");
		}

		ApplicationUser? user =
			await userManager.FindByIdAsync(
				request.UserId.ToString());

		if (user is null)
		{
			return Result.Failure(
				$"User {request.UserId} not found");
		}

		IdentityResult identityResult =
			await userManager.AddToRoleAsync(
				user,
				request.RequestedRole!.Name!);

		if (!identityResult.Succeeded)
		{
			return Result.Failure(
				$"Failed to add role: {string.Join(
					", ",
					identityResult.Errors.Select(
						error => error.Description))}");
		}

		await repository.DeleteAsync(
			command.RequestId,
			cancellationToken);

		// Invalidate caches for roles and permission requests
		await identityCache.InvalidateUserRolesAsync(request.UserId);
		await identityCache.InvalidatePermissionRequestsAsync();

		return Result.Success();
	}
}