// <copyright file="BulkApprovePermissionRequestsCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;

namespace SeventySix.Identity.Commands.BulkApprovePermissionRequests;

/// <summary>
/// Handler for approving multiple permission requests in bulk.
/// </summary>
public static class BulkApprovePermissionRequestsCommandHandler
{
	/// <summary>
	/// Handles the bulk approval of permission requests.
	/// </summary>
	/// <param name="command">
	/// The bulk approve command.
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
	/// Count of approved requests.
	/// </returns>
	public static async Task<int> HandleAsync(
		BulkApprovePermissionRequestsCommand command,
		IPermissionRequestRepository repository,
		UserManager<ApplicationUser> userManager,
		CancellationToken cancellationToken)
	{
		List<long> idList = command.RequestIds.ToList();

		IEnumerable<PermissionRequest> requests =
			await repository.GetByIdsAsync(idList, cancellationToken);

		int approvedCount = 0;

		foreach (PermissionRequest request in requests)
		{
			ApplicationUser? user =
				await userManager.FindByIdAsync(request.UserId.ToString());

			if (user is null)
			{
				continue;
			}

			IdentityResult result =
				await userManager.AddToRoleAsync(
					user,
					request.RequestedRole!.Name!);

			if (result.Succeeded)
			{
				approvedCount++;
			}
		}

		await repository.DeleteRangeAsync(idList, cancellationToken);

		return approvedCount;
	}
}