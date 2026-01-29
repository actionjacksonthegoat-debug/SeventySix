// <copyright file="ICacheInvalidationService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Interfaces;

/// <summary>
/// Centralized service for FusionCache invalidation across domains.
/// </summary>
/// <remarks>
/// Provides consistent cache invalidation patterns:
/// - Single-key removal for specific entities
/// - Multi-key removal for related cache entries
/// - Domain-isolated invalidation via named caches
/// </remarks>
public interface ICacheInvalidationService
{
	/// <summary>
	/// Invalidates all cache entries for a specific user.
	/// </summary>
	/// <param name="userId">
	/// The user ID to invalidate.
	/// </param>
	/// <param name="email">
	/// Optional email to invalidate email-keyed cache.
	/// </param>
	/// <param name="username">
	/// Optional username to invalidate username-keyed cache.
	/// </param>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public Task InvalidateUserCacheAsync(
		long userId,
		string? email = null,
		string? username = null);

	/// <summary>
	/// Invalidates cache entries for user role changes.
	/// </summary>
	/// <param name="userId">
	/// The user ID whose roles changed.
	/// </param>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public Task InvalidateUserRolesCacheAsync(long userId);

	/// <summary>
	/// Invalidates daily statistics cache.
	/// </summary>
	/// <param name="date">
	/// The date to invalidate.
	/// </param>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public Task InvalidateApiStatisticsCacheAsync(DateOnly date);

	/// <summary>
	/// Invalidates permission requests list cache.
	/// </summary>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public Task InvalidatePermissionRequestsCacheAsync();

	/// <summary>
	/// Invalidates all users list cache.
	/// </summary>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public Task InvalidateAllUsersCacheAsync();

	/// <summary>
	/// Invalidates cache for user profile changes only.
	/// </summary>
	/// <param name="userId">
	/// The user ID whose profile changed.
	/// </param>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public Task InvalidateUserProfileCacheAsync(long userId);

	/// <summary>
	/// Invalidates cache for password changes (user profile contains hasPassword flag).
	/// </summary>
	/// <param name="userId">
	/// The user ID whose password changed.
	/// </param>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public Task InvalidateUserPasswordCacheAsync(long userId);

	/// <summary>
	/// Invalidates cache for multiple users (bulk operations).
	/// </summary>
	/// <param name="userIds">
	/// The user IDs to invalidate.
	/// </param>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public Task InvalidateBulkUsersCacheAsync(IEnumerable<long> userIds);
}
