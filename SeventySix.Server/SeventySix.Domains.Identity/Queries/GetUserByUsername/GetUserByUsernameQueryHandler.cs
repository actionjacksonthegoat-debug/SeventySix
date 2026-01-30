// <copyright file="GetUserByUsernameQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using SeventySix.Shared.Constants;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.Identity;

/// <summary>
/// Handler for retrieving a user by username with cache-aside pattern.
/// </summary>
/// <remarks>
/// Caching Strategy (per Microsoft best practices):
/// - Users are frequently read during login flows (high cache hit ratio)
/// - TTL: 1 minute (Identity cache default)
/// - Cache invalidation: On user update/delete operations
/// </remarks>
public static class GetUserByUsernameQueryHandler
{
	/// <summary>
	/// Retrieves a user by username with cache-aside pattern.
	/// </summary>
	/// <param name="query">
	/// The query containing the username.
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
		GetUserByUsernameQuery query,
		UserManager<ApplicationUser> userManager,
		IFusionCacheProvider cacheProvider,
		CancellationToken cancellationToken)
	{
		IFusionCache identityCache =
			cacheProvider.GetCache(CacheNames.Identity);

		string cacheKey =
			IdentityCacheKeys.UserByUsername(query.Username);

		return await identityCache.GetOrSetAsync(
			cacheKey,
			async cancellation =>
			{
				ApplicationUser? user =
					await userManager.FindByNameAsync(query.Username);

				return user?.ToDto();
			},
			token: cancellationToken);
	}
}