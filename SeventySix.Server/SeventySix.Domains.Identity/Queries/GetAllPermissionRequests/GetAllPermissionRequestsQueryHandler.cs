// <copyright file="GetAllPermissionRequestsQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Constants;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.Identity.Queries.GetAllPermissionRequests;

/// <summary>
/// Handler for retrieving all pending permission requests with caching.
/// </summary>
/// <remarks>
/// Uses TryGetAsync + SetAsync instead of GetOrSetAsync to avoid capturing
/// scoped services in a cache factory lambda that may execute after scope disposal.
/// </remarks>
public static class GetAllPermissionRequestsQueryHandler
{
	/// <summary>
	/// Cache duration for permission requests (30 seconds for freshness).
	/// </summary>
	private static readonly TimeSpan CacheDuration =
		TimeSpan.FromSeconds(30);

	/// <summary>
	/// Handles the query to get all permission requests with cache-aside pattern.
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
		IFusionCache cache =
			cacheProvider.GetCache(CacheNames.Identity);

		string cacheKey =
			IdentityCacheKeys.PermissionRequests();

		// Try cache first — TryGetAsync returns MaybeValue<T> (not nullable)
		MaybeValue<List<PermissionRequestDto>> cached =
			await cache.TryGetAsync<List<PermissionRequestDto>>(
				cacheKey,
				token: cancellationToken);

		if (cached.HasValue)
		{
			return cached.Value ?? [];
		}

		// Cache miss — fetch with current scoped DbContext (still alive)
		List<PermissionRequestDto> requests =
			(await repository.GetAllAsync(cancellationToken))
				.ToList();

		// Store in cache
		await cache.SetAsync(
			cacheKey,
			requests,
			options =>
			{
				options.Duration = CacheDuration;
			},
			token: cancellationToken);

		return requests;
	}
}