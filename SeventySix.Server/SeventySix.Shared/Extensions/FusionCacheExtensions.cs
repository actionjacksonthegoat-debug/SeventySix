// <copyright file="FusionCacheExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.Shared.Extensions;

/// <summary>
/// Extension methods for FusionCache operations.
/// </summary>
public static class FusionCacheExtensions
{
	/// <summary>
	/// Gets a named cache from the provider with null-safety.
	/// </summary>
	/// <param name="provider">
	/// The cache provider.
	/// </param>
	/// <param name="cacheName">
	/// The cache name constant.
	/// </param>
	/// <returns>
	/// The named cache instance.
	/// </returns>
	/// <exception cref="InvalidOperationException">
	/// Thrown when cache is not registered.
	/// </exception>
	public static IFusionCache GetRequiredCache(
		this IFusionCacheProvider provider,
		string cacheName)
	{
		IFusionCache? namedCache =
			provider.GetCacheOrNull(cacheName);

		return namedCache
			?? throw new InvalidOperationException(
				$"Cache '{cacheName}' is not registered. " +
				$"Ensure AddFusionCacheWithValkey is called during startup.");
	}
}
