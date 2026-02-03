// <copyright file="ICacheProvider.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Interfaces;

/// <summary>
/// Generic cache operations abstraction.
/// Bounded contexts implement domain-specific wrappers using this provider.
/// </summary>
/// <remarks>
/// This interface provides low-level cache operations that are domain-agnostic.
/// Domain-specific cache services (e.g., IIdentityCacheService) wrap this provider
/// to encapsulate cache key generation within their bounded context.
/// </remarks>
public interface ICacheProvider
{
	/// <summary>
	/// Removes a cache entry by key.
	/// </summary>
	/// <param name="cacheName">
	/// The named cache instance (e.g., "Identity", "ApiTracking").
	/// </param>
	/// <param name="cacheKey">
	/// The cache key to remove.
	/// </param>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public Task RemoveAsync(
		string cacheName,
		string cacheKey);

	/// <summary>
	/// Removes multiple cache entries by keys.
	/// </summary>
	/// <param name="cacheName">
	/// The named cache instance (e.g., "Identity", "ApiTracking").
	/// </param>
	/// <param name="cacheKeys">
	/// The cache keys to remove.
	/// </param>
	/// <returns>
	/// A task representing the async operation.
	/// </returns>
	public Task RemoveManyAsync(
		string cacheName,
		IEnumerable<string> cacheKeys);
}