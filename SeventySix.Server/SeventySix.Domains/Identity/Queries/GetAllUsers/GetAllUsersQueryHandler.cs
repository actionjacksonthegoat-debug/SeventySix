// <copyright file="GetAllUsersQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SeventySix.Shared.Constants;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.Identity;

/// <summary>
/// Handler for retrieving all users with cache-aside pattern.
/// </summary>
/// <remarks>
/// Caching Strategy (per Microsoft best practices):
/// - User list is frequently read for admin dashboards
/// - TTL: 1 minute (Identity cache default)
/// - Cache invalidation: On user create/update/delete operations
/// </remarks>
public static class GetAllUsersQueryHandler
{
	/// <summary>
	/// Retrieves all users with cache-aside pattern.
	/// </summary>
	/// <param name="query">
	/// The query request.
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
	/// Collection of user DTOs.
	/// </returns>
	public static async Task<IEnumerable<UserDto>> HandleAsync(
		GetAllUsersQuery query,
		UserManager<ApplicationUser> userManager,
		IFusionCacheProvider cacheProvider,
		CancellationToken cancellationToken)
	{
		IFusionCache cache =
			cacheProvider.GetCache(CacheNames.Identity);

		string cacheKey =
			IdentityCacheKeys.AllUsers();

		// Must use List<T> (not IEnumerable<T>) for MemoryPack serialization
		return await cache.GetOrSetAsync<List<UserDto>>(
			cacheKey,
			async token =>
			{
				List<ApplicationUser> users =
					await userManager
						.Users
						.AsNoTracking()
						.ToListAsync(token);

				return users.ToDto().ToList();
			},
			token: cancellationToken);
	}
}