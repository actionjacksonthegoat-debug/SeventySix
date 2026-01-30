// <copyright file="CacheInvalidationService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.ApiTracking;
using SeventySix.Identity;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Interfaces;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.Api.Infrastructure.Services;

/// <summary>
/// Implementation of cache invalidation service using primary constructor.
/// </summary>
/// <param name="cacheProvider">
/// The FusionCache provider for named cache access.
/// </param>
public sealed class CacheInvalidationService(
	IFusionCacheProvider cacheProvider) : ICacheInvalidationService
{
	/// <inheritdoc />
	public async Task InvalidateUserCacheAsync(
		long userId,
		string? email = null,
		string? username = null)
	{
		IFusionCache identityCache =
			cacheProvider.GetCache(CacheNames.Identity);

		// Always invalidate user-by-id cache
		await identityCache.RemoveAsync(
			IdentityCacheKeys.UserById(userId));

		await identityCache.RemoveAsync(
			IdentityCacheKeys.UserProfile(userId));

		// Invalidate email-keyed cache if provided
		if (!string.IsNullOrEmpty(email))
		{
			await identityCache.RemoveAsync(
				IdentityCacheKeys.UserByEmail(email));
		}

		// Invalidate username-keyed cache if provided
		if (!string.IsNullOrEmpty(username))
		{
			await identityCache.RemoveAsync(
				IdentityCacheKeys.UserByUsername(username));
		}
	}

	/// <inheritdoc />
	public async Task InvalidateUserRolesCacheAsync(long userId)
	{
		IFusionCache identityCache =
			cacheProvider.GetCache(CacheNames.Identity);

		await identityCache.RemoveAsync(
			IdentityCacheKeys.UserRoles(userId));

		await identityCache.RemoveAsync(
			IdentityCacheKeys.AvailableRoles(userId));
	}

	/// <inheritdoc />
	public async Task InvalidateApiStatisticsCacheAsync(DateOnly date)
	{
		IFusionCache apiTrackingCache =
			cacheProvider.GetCache(CacheNames.ApiTracking);

		await apiTrackingCache.RemoveAsync(
			ApiTrackingCacheKeys.DailyStatistics(date));
	}

	/// <inheritdoc />
	public async Task InvalidatePermissionRequestsCacheAsync()
	{
		IFusionCache identityCache =
			cacheProvider.GetCache(CacheNames.Identity);

		await identityCache.RemoveAsync(
			IdentityCacheKeys.PermissionRequests());
	}

	/// <inheritdoc />
	public async Task InvalidateAllUsersCacheAsync()
	{
		IFusionCache identityCache =
			cacheProvider.GetCache(CacheNames.Identity);

		await identityCache.RemoveAsync(
			IdentityCacheKeys.AllUsers());
	}

	/// <inheritdoc />
	public async Task InvalidateUserProfileCacheAsync(long userId)
	{
		IFusionCache identityCache =
			cacheProvider.GetCache(CacheNames.Identity);

		await identityCache.RemoveAsync(
			IdentityCacheKeys.UserProfile(userId));
	}

	/// <inheritdoc />
	public async Task InvalidateUserPasswordCacheAsync(long userId)
	{
		IFusionCache identityCache =
			cacheProvider.GetCache(CacheNames.Identity);

		// Profile contains hasPassword flag
		await identityCache.RemoveAsync(
			IdentityCacheKeys.UserProfile(userId));

		await identityCache.RemoveAsync(
			IdentityCacheKeys.UserById(userId));
	}

	/// <inheritdoc />
	public async Task InvalidateBulkUsersCacheAsync(IEnumerable<long> userIds)
	{
		IFusionCache identityCache =
			cacheProvider.GetCache(CacheNames.Identity);

		foreach (long userId in userIds)
		{
			await identityCache.RemoveAsync(
				IdentityCacheKeys.UserById(userId));

			await identityCache.RemoveAsync(
				IdentityCacheKeys.UserProfile(userId));
		}

		// Invalidate all users list once after bulk operation
		await identityCache.RemoveAsync(
			IdentityCacheKeys.AllUsers());
	}
}