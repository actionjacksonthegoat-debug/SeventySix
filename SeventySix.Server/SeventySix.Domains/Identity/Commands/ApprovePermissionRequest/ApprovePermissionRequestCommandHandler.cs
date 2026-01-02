// <copyright file="ApprovePermissionRequestCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;

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
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// True if approved successfully; false if request not found.
	/// </returns>
	public static async Task<bool> HandleAsync(
		ApprovePermissionRequestCommand command,
		IPermissionRequestRepository repository,
		UserManager<ApplicationUser> userManager,
		CancellationToken cancellationToken)
	{
		PermissionRequest? request =
			await repository.GetByIdAsync(
				command.RequestId,
				cancellationToken);

		if (request == null)
		{
			return false;
		}

		ApplicationUser? user =
			await userManager.FindByIdAsync(request.UserId.ToString());

		if (user is null)
		{
			return false;
		}

		IdentityResult result =
			await userManager.AddToRoleAsync(
				user,
				request.RequestedRole!.Name!);

		if (!result.Succeeded)
		{
			return false;
		}

		await repository.DeleteAsync(command.RequestId, cancellationToken);

		return true;
	}
}