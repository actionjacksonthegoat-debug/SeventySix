// <copyright file="BulkApprovePermissionRequestsCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity.Commands.BulkApprovePermissionRequests;

/// <summary>
/// Handler for approving multiple permission requests in bulk.
/// </summary>
public static class BulkApprovePermissionRequestsCommandHandler
{
	/// <summary>
	/// Handles the bulk approval of permission requests.
	/// </summary>
	/// <param name="command">The bulk approve command.</param>
	/// <param name="repository">The permission request repository.</param>
	/// <param name="userCommandRepository">The user command repository.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Count of approved requests.</returns>
	public static async Task<int> HandleAsync(
		BulkApprovePermissionRequestsCommand command,
		IPermissionRequestRepository repository,
		IUserCommandRepository userCommandRepository,
		CancellationToken cancellationToken)
	{
		List<int> idList =
			command.RequestIds.ToList();

		IEnumerable<PermissionRequest> requests =
			await repository.GetByIdsAsync(
				idList,
				cancellationToken);

		int approvedCount =
			0;

		foreach (PermissionRequest request in requests)
		{
			await userCommandRepository.AddRoleAsync(
				request.UserId,
				request.RequestedRole!.Name,
				cancellationToken);
			approvedCount++;
		}

		await repository.DeleteRangeAsync(
			idList,
			cancellationToken);

		return approvedCount;
	}
}