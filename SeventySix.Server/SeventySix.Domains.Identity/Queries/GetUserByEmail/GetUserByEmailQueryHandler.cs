// <copyright file="GetUserByEmailQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using SeventySix.Shared.Constants;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.Identity;

/// <summary>
/// Handler for retrieving a user by email address with cache-aside pattern.
/// </summary>
/// <remarks>
/// Caching Strategy (per Microsoft best practices):
/// - Users are frequently read during login/OAuth flows (high cache hit ratio)
/// - TTL: 1 minute (Identity cache default)
/// - Cache invalidation: On user update/delete operations
/// </remarks>
public static class GetUserByEmailQueryHandler
{
	/// <summary>
	/// Retrieves a user by email address with cache-aside pattern.
	/// </summary>
	/// <param name="query">
	/// The query containing the email address.
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
		GetUserByEmailQuery query,
		UserManager<ApplicationUser> userManager,
		IFusionCacheProvider cacheProvider,
		CancellationToken cancellationToken)
	{
		IFusionCache identityCache =
			cacheProvider.GetCache(CacheNames.Identity);

		string cacheKey =
			IdentityCacheKeys.UserByEmail(query.Email);

		return await identityCache.GetOrSetAsync(
			cacheKey,
			async cancellation =>
			{
				ApplicationUser? user =
					await userManager.FindByEmailAsync(query.Email);

				return user?.ToDto();
			},
			token: cancellationToken);
	}
}