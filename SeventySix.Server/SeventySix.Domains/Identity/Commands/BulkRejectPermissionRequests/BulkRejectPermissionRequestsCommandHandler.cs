// <copyright file="BulkRejectPermissionRequestsCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Interfaces;

namespace SeventySix.Identity.Commands.BulkRejectPermissionRequests;

/// <summary>
/// Handler for rejecting multiple permission requests in bulk.
/// </summary>
public static class BulkRejectPermissionRequestsCommandHandler
{
	/// <summary>
	/// Handles the bulk rejection of permission requests.
	/// </summary>
	/// <param name="command">
	/// The bulk reject command.
	/// </param>
	/// <param name="repository">
	/// The permission request repository.
	/// </param>
	/// <param name="cacheInvalidation">
	/// Cache invalidation service for clearing request cache.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Count of rejected requests.
	/// </returns>
	public static async Task<int> HandleAsync(
		BulkRejectPermissionRequestsCommand command,
		IPermissionRequestRepository repository,
		ICacheInvalidationService cacheInvalidation,
		CancellationToken cancellationToken)
	{
		List<long> idList =
			command.RequestIds.ToList();

		await repository.DeleteRangeAsync(idList, cancellationToken);

		// Invalidate permission requests cache
		await cacheInvalidation.InvalidatePermissionRequestsCacheAsync();

		return idList.Count;
	}
}