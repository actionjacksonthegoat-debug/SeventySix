// <copyright file="RejectPermissionRequestCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity.Commands.RejectPermissionRequest;

/// <summary>
/// Handler for rejecting a single permission request.
/// </summary>
public static class RejectPermissionRequestCommandHandler
{
	/// <summary>
	/// Handles the rejection of a permission request.
	/// </summary>
	/// <param name="command">
	/// The reject command.
	/// </param>
	/// <param name="repository">
	/// The permission request repository.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// True if rejected successfully; false if request not found.
	/// </returns>
	public static async Task<bool> HandleAsync(
		RejectPermissionRequestCommand command,
		IPermissionRequestRepository repository,
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

		await repository.DeleteAsync(command.RequestId, cancellationToken);

		return true;
	}
}