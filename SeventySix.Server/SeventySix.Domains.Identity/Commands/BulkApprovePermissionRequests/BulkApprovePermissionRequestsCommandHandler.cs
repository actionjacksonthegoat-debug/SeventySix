// <copyright file="BulkApprovePermissionRequestsCommandHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using SeventySix.Shared.Interfaces;

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
	/// <param name="identityCache">
	/// Identity cache service for clearing role and request caches.
	/// </param>
	/// <param name="transactionManager">
	/// Transaction manager for concurrency-safe read-then-write operations.
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
		IIdentityCacheService identityCache,
		ITransactionManager transactionManager,
		CancellationToken cancellationToken)
	{
		// Closure variable for user IDs affected (for cache invalidation outside transaction)
		List<long> affectedUserIds = [];

		List<long> idList = command.RequestIds.ToList();

		int approvedCount =
			await transactionManager.ExecuteInTransactionAsync(
				async ct =>
				{
					// Reset for retries
					affectedUserIds = [];

					IEnumerable<PermissionRequest> requests =
						await repository.GetByIdsAsync(
							idList,
							ct);

					int count = 0;

					foreach (PermissionRequest request in requests)
					{
						ApplicationUser? user =
							await userManager.FindByIdAsync(
								request.UserId.ToString());

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
							count++;
							affectedUserIds.Add(request.UserId);
						}
					}

					await repository.DeleteRangeAsync(
						idList,
						ct);

					return count;
				},
				cancellationToken: cancellationToken);

		// Invalidate caches for all affected users and permission requests (outside transaction)
		foreach (long userId in affectedUserIds)
		{
			await identityCache.InvalidateUserRolesAsync(userId);
		}

		await identityCache.InvalidatePermissionRequestsAsync();

		return approvedCount;
	}
}