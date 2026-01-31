// <copyright file="GetAllPermissionRequestsQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.DependencyInjection;
using SeventySix.Shared.Constants;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.Identity.Queries.GetAllPermissionRequests;

/// <summary>
/// Handler for retrieving all pending permission requests with caching.
/// </summary>
/// <remarks>
/// Uses <see cref="IServiceScopeFactory"/> to create a fresh scope inside the cache factory.
/// This prevents ObjectDisposedException when FusionCache runs background refresh
/// (eager refresh) after the original HTTP request scope has been disposed.
/// </remarks>
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
	/// <param name="serviceScopeFactory">
	/// Factory to create new service scopes for background cache refresh.
	/// Required because FusionCache may call the factory after the original
	/// request scope is disposed (eager refresh at 80% TTL threshold).
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
		IServiceScopeFactory serviceScopeFactory,
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
			{
				// Create a new scope for each factory execution.
				// This ensures the repository and DbContext are fresh,
				// even when called from FusionCache's background refresh.
				await using AsyncServiceScope scope =
					serviceScopeFactory.CreateAsyncScope();

				IPermissionRequestRepository repository =
					scope.ServiceProvider
						.GetRequiredService<IPermissionRequestRepository>();

				return await repository.GetAllAsync(cancellation);
			},
			options =>
			{
				options.Duration = CacheDuration;
			},
			token: cancellationToken)
			?? [];
	}
}