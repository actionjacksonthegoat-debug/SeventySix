// <copyright file="IdentityCacheService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Constants;
using SeventySix.Shared.Interfaces;

namespace SeventySix.Identity;

/// <summary>
/// Identity-specific cache invalidation service.
/// Encapsulates all Identity cache key knowledge within the bounded context.
/// </summary>
/// <param name="cacheProvider">
/// The generic cache provider for cache operations.
/// </param>
public sealed class IdentityCacheService(
	ICacheProvider cacheProvider) : IIdentityCacheService
{
	/// <inheritdoc />
	public async Task InvalidateUserAsync(
		long userId,
		string? email = null,
		string? username = null)
	{
		List<string> keysToInvalidate =
			[
				IdentityCacheKeys.UserById(userId),
				IdentityCacheKeys.UserProfile(userId)
			];

		if (!string.IsNullOrEmpty(email))
		{
			keysToInvalidate.Add(
				IdentityCacheKeys.UserByEmail(email));
		}

		if (!string.IsNullOrEmpty(username))
		{
			keysToInvalidate.Add(
				IdentityCacheKeys.UserByUsername(username));
		}

		await cacheProvider.RemoveManyAsync(
			CacheNames.Identity,
			keysToInvalidate);
	}

	/// <inheritdoc />
	public async Task InvalidateUserRolesAsync(long userId)
	{
		List<string> keysToInvalidate =
			[
				IdentityCacheKeys.UserRoles(userId),
				IdentityCacheKeys.AvailableRoles(userId)
			];

		await cacheProvider.RemoveManyAsync(
			CacheNames.Identity,
			keysToInvalidate);
	}

	/// <inheritdoc />
	public async Task InvalidateUserProfileAsync(long userId)
	{
		await cacheProvider.RemoveAsync(
			CacheNames.Identity,
			IdentityCacheKeys.UserProfile(userId));
	}

	/// <inheritdoc />
	public async Task InvalidateAllUsersAsync()
	{
		await cacheProvider.RemoveAsync(
			CacheNames.Identity,
			IdentityCacheKeys.AllUsers());
	}

	/// <inheritdoc />
	public async Task InvalidatePermissionRequestsAsync()
	{
		await cacheProvider.RemoveAsync(
			CacheNames.Identity,
			IdentityCacheKeys.PermissionRequests());
	}

	/// <inheritdoc />
	public async Task InvalidateUserPasswordAsync(long userId)
	{
		List<string> keysToInvalidate =
			[
				IdentityCacheKeys.UserProfile(userId),
				IdentityCacheKeys.UserById(userId)
			];

		await cacheProvider.RemoveManyAsync(
			CacheNames.Identity,
			keysToInvalidate);
	}

	/// <inheritdoc />
	public async Task InvalidateBulkUsersAsync(IEnumerable<long> userIds)
	{
		List<string> keysToInvalidate =
			userIds
				.SelectMany(
					userId => new[]
					{
						IdentityCacheKeys.UserById(userId),
						IdentityCacheKeys.UserProfile(userId)
					})
				.ToList();

		keysToInvalidate.Add(IdentityCacheKeys.AllUsers());

		await cacheProvider.RemoveManyAsync(
			CacheNames.Identity,
			keysToInvalidate);
	}
}
