// <copyright file="GetAllPermissionRequestsQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Constants;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.Identity.Queries.GetAllPermissionRequests;

/// <summary>
/// Handler for retrieving all pending permission requests with caching.
/// </summary>
public static class GetAllPermissionRequestsQueryHandler
{
	/// <summary>
	/// Cache duration for permission requests (30 seconds for freshness).
	/// </summary>
	private static readonly TimeSpan CacheDuration =
		TimeSpan.FromSeconds(30);

	/// <summary>
	/// Handles the query to get all permission requests.
	/// </summary>
	/// <param name="query">
	/// The query.
	/// </param>
	/// <param name="repository">
	/// The permission request repository.
	/// </param>
	/// <param name="cacheProvider">
	/// The FusionCache provider for named cache access.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// List of all permission requests.
	/// </returns>
	public static async Task<IEnumerable<PermissionRequestDto>> HandleAsync(
		GetAllPermissionRequestsQuery query,
		IPermissionRequestRepository repository,
		IFusionCacheProvider cacheProvider,
		CancellationToken cancellationToken)
	{
		IFusionCache identityCache =
			cacheProvider.GetCache(CacheNames.Identity);

		string cacheKey =
			IdentityCacheKeys.PermissionRequests();

		return await identityCache.GetOrSetAsync(
			cacheKey,
			async cancellation =>
				await repository.GetAllAsync(cancellation),
			options =>
			{
				options.Duration = CacheDuration;
			},
			token: cancellationToken)
			?? [];
	}
}