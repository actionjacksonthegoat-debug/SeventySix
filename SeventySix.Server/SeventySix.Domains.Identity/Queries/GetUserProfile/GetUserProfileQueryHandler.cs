// <copyright file="GetUserProfileQueryHandler.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Identity;
using SeventySix.Shared.Constants;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.Identity;

/// <summary>
/// Handler for <see cref="GetUserProfileQuery"/> with cache-aside pattern.
/// </summary>
/// <remarks>
/// Caching Strategy (per Microsoft best practices):
/// - User profiles are frequently read during session (high cache hit ratio)
/// - TTL: 1 minute (Identity cache default)
/// - Cache invalidation: On profile update, password change, provider link/unlink
/// </remarks>
public static class GetUserProfileQueryHandler
{
	/// <summary>
	/// Handles retrieval of a user's profile with cache-aside pattern.
	/// </summary>
	/// <remarks>
	/// Uses TryGetAsync + SetAsync instead of GetOrSetAsync to avoid capturing
	/// scoped services (UserManager) in a cache factory lambda.
	/// </remarks>
	/// <param name="query">
	/// The query containing the user ID.
	/// </param>
	/// <param name="userManager">
	/// User manager.
	/// </param>
	/// <param name="cacheProvider">
	/// The FusionCache provider for named cache access.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// The user profile or null if not found.
	/// </returns>
	public static async Task<UserProfileDto?> HandleAsync(
		GetUserProfileQuery query,
		UserManager<ApplicationUser> userManager,
		IFusionCacheProvider cacheProvider,
		CancellationToken cancellationToken)
	{
		IFusionCache cache =
			cacheProvider.GetCache(CacheNames.Identity);

		string cacheKey =
			IdentityCacheKeys.UserProfile(query.UserId);

		// Try cache first — TryGetAsync returns MaybeValue<T> (not nullable)
		MaybeValue<UserProfileDto?> cached =
			await cache.TryGetAsync<UserProfileDto?>(
				cacheKey,
				token: cancellationToken);

		if (cached.HasValue)
		{
			return cached.Value;
		}

		// Cache miss — fetch with current scoped UserManager (still alive)
		UserProfileDto? result =
			await FetchUserProfileAsync(
				query.UserId,
				userManager);

		// Store in cache
		await cache.SetAsync(
			cacheKey,
			result,
			token: cancellationToken);

		return result;
	}

	/// <summary>
	/// Fetches user profile from the database.
	/// </summary>
	/// <param name="userId">
	/// The user ID.
	/// </param>
	/// <param name="userManager">
	/// User manager.
	/// </param>
	/// <returns>
	/// The user profile or null if not found.
	/// </returns>
	private static async Task<UserProfileDto?> FetchUserProfileAsync(
		long userId,
		UserManager<ApplicationUser> userManager)
	{
		ApplicationUser? user =
			await userManager.FindByIdAsync(
				userId.ToString());

		if (user is null)
		{
			return null;
		}

		IList<string> roles =
			await userManager.GetRolesAsync(user);

		IList<UserLoginInfo> logins =
			await userManager.GetLoginsAsync(user);

		bool hasPassword =
			await userManager.HasPasswordAsync(user);

		return new UserProfileDto(
			user.Id,
			user.UserName ?? string.Empty,
			user.Email ?? string.Empty,
			user.FullName,
			roles.ToList(),
			hasPassword,
			logins.Select(login => login.LoginProvider).ToList(),
			user.LastLoginAt);
	}
}