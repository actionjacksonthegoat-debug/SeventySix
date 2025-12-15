// <copyright file="BulkRejectPermissionRequestsCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity.Commands.BulkRejectPermissionRequests;

/// <summary>
/// Handler for rejecting multiple permission requests in bulk.
/// </summary>
public static class BulkRejectPermissionRequestsCommandHandler
{
	/// <summary>
	/// Handles the bulk rejection of permission requests.
	/// </summary>
	/// <param name="command">The bulk reject command.</param>
	/// <param name="repository">The permission request repository.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Count of rejected requests.</returns>
	public static async Task<int> HandleAsync(
		BulkRejectPermissionRequestsCommand command,
		IPermissionRequestRepository repository,
		CancellationToken cancellationToken)
	{
		List<int> idList = command.RequestIds.ToList();

		await repository.DeleteRangeAsync(idList, cancellationToken);

		return idList.Count;
	}
}
