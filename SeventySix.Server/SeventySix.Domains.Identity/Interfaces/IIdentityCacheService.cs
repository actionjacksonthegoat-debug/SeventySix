// <copyright file="IIdentityCacheService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Identity;

/// <summary>
/// Cache operations specific to Identity bounded context.
/// </summary>
/// <remarks>
/// Encapsulates all Identity cache key knowledge within the bounded context.
/// Handlers use this service to invalidate cache without knowing key patterns.
/// </remarks>
public interface IIdentityCacheService
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
	public Task InvalidateUserAsync(
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
	public Task InvalidateUserRolesAsync(long userId);

	/// <summary>
	/// Invalidates cache for user profile changes only.
	/// </summary>
	/// <param name="userId">
	/// The user ID whose profile changed.
	/// </param>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public Task InvalidateUserProfileAsync(long userId);

	/// <summary>
	/// Invalidates all users list cache.
	/// </summary>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public Task InvalidateAllUsersAsync();

	/// <summary>
	/// Invalidates permission requests list cache.
	/// </summary>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public Task InvalidatePermissionRequestsAsync();

	/// <summary>
	/// Invalidates cache for password changes.
	/// </summary>
	/// <param name="userId">
	/// The user ID whose password changed.
	/// </param>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public Task InvalidateUserPasswordAsync(long userId);

	/// <summary>
	/// Invalidates cache for multiple users (bulk operations).
	/// </summary>
	/// <param name="userIds">
	/// The user IDs to invalidate.
	/// </param>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public Task InvalidateBulkUsersAsync(IEnumerable<long> userIds);
}
