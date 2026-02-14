// <copyright file="GetUserByIdQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using SeventySix.Shared.Constants;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.Identity;

/// <summary>
/// Handler for retrieving a user by ID with cache-aside pattern.
/// </summary>
/// <remarks>
/// Caching Strategy (per Microsoft best practices):
/// - Users are frequently read, rarely modified (high cache hit ratio)
/// - TTL: 1 minute (Identity cache default)
/// - Cache invalidation: On user update/delete operations
/// </remarks>
public static class GetUserByIdQueryHandler
{
	/// <summary>
	/// Retrieves a user by its identifier with cache-aside pattern.
	/// </summary>
	/// <remarks>
	/// Uses TryGetAsync + SetAsync instead of GetOrSetAsync to avoid capturing
	/// scoped services (UserManager) in a cache factory lambda.
	/// </remarks>
	/// <param name="query">
	/// The query containing the user ID.
	/// </param>
	/// <param name="userManager">
	/// The ASP.NET Identity user manager.
	/// </param>
	/// <param name="cacheProvider">
	/// The FusionCache provider for named cache access.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// The user DTO if found; otherwise null.
	/// </returns>
	public static async Task<UserDto?> HandleAsync(
		GetUserByIdQuery query,
		UserManager<ApplicationUser> userManager,
		IFusionCacheProvider cacheProvider,
		CancellationToken cancellationToken)
	{
		IFusionCache cache =
			cacheProvider.GetCache(CacheNames.Identity);

		string cacheKey =
			IdentityCacheKeys.UserById(query.Id);

		// Try cache first — TryGetAsync returns MaybeValue<T> (not nullable)
		MaybeValue<UserDto?> cached =
			await cache.TryGetAsync<UserDto?>(
				cacheKey,
				token: cancellationToken);

		if (cached.HasValue)
		{
			return cached.Value;
		}

		// Cache miss — fetch with current scoped UserManager (still alive)
		ApplicationUser? user =
			await userManager.FindByIdAsync(
				query.Id.ToString());

		UserDto? result =
			user?.ToDto();

		// Store in cache (including null — prevents cache stampede for missing users)
		await cache.SetAsync(
			cacheKey,
			result,
			token: cancellationToken);

		return result;
	}
}