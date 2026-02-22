// <copyright file="GetUserRolesQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using SeventySix.Shared.Constants;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.Identity;

/// <summary>
/// Handler for GetUserRolesQuery with cache-aside pattern.
/// </summary>
/// <remarks>
/// Caching Strategy (per Microsoft best practices):
/// - User roles are frequently checked for authorization (high cache hit ratio)
/// - TTL: 1 minute (Identity cache default)
/// - Cache invalidation: On role assignment/removal
/// </remarks>
public static class GetUserRolesQueryHandler
{
	/// <summary>
	/// Returns the role names assigned to a user by identifier with cache-aside pattern.
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
	/// The role names assigned to the user.
	/// </returns>
	public static async Task<IEnumerable<string>> HandleAsync(
		GetUserRolesQuery query,
		UserManager<ApplicationUser> userManager,
		IFusionCacheProvider cacheProvider,
		CancellationToken cancellationToken)
	{
		IFusionCache cache =
			cacheProvider.GetCache(CacheNames.Identity);

		string cacheKey =
			IdentityCacheKeys.UserRoles(query.UserId);

		// Try cache first — TryGetAsync returns MaybeValue<T> (not nullable)
		MaybeValue<List<string>> cached =
			await cache.TryGetAsync<List<string>>(
				cacheKey,
				token: cancellationToken);

		if (cached.HasValue)
		{
			return cached.Value ?? [];
		}

		// Cache miss — fetch with current scoped UserManager (still alive)
		List<string> roles =
			(await FetchUserRolesAsync(
				query.UserId,
				userManager))
				.ToList();

		// Store in cache
		await cache.SetAsync(
			cacheKey,
			roles,
			token: cancellationToken);

		return roles;
	}

	/// <summary>
	/// Fetches user roles from the database.
	/// </summary>
	/// <param name="userId">
	/// The user ID.
	/// </param>
	/// <param name="userManager">
	/// User manager.
	/// </param>
	/// <returns>
	/// The role names assigned to the user.
	/// </returns>
	private static async Task<IEnumerable<string>> FetchUserRolesAsync(
		long userId,
		UserManager<ApplicationUser> userManager)
	{
		ApplicationUser? user =
			await userManager.FindByIdAsync(
				userId.ToString());

		if (user is null)
		{
			return [];
		}

		return await userManager.GetRolesAsync(user);
	}
}