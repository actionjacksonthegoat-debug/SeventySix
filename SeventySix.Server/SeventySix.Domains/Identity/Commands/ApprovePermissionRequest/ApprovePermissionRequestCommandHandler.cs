// <copyright file="ApprovePermissionRequestCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity.Commands.ApprovePermissionRequest;

/// <summary>
/// Handler for approving a single permission request.
/// </summary>
public static class ApprovePermissionRequestCommandHandler
{
	/// <summary>
	/// Handles the approval of a permission request.
	/// </summary>
	/// <param name="command">The approve command.</param>
	/// <param name="repository">The permission request repository.</param>
	/// <param name="userCommandRepository">The user command repository.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>True if approved successfully; false if request not found.</returns>
	public static async Task<bool> HandleAsync(
		ApprovePermissionRequestCommand command,
		IPermissionRequestRepository repository,
		IUserCommandRepository userCommandRepository,
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

		await userCommandRepository.AddRoleAsync(
			request.UserId,
			request.RequestedRole!.Name,
			cancellationToken);

		await repository.DeleteAsync(command.RequestId, cancellationToken);

		return true;
	}
}