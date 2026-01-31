// <copyright file="FusionCacheProvider.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Interfaces;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.Api.Infrastructure.Services;

/// <summary>
/// FusionCache implementation of <see cref="ICacheProvider"/>.
/// This is an infrastructure adapter that domains use through the port.
/// </summary>
/// <param name="fusionCacheProvider">
/// The FusionCache provider for named cache access.
/// </param>
public sealed class FusionCacheProvider(
	IFusionCacheProvider fusionCacheProvider) : ICacheProvider
{
	/// <inheritdoc />
	public async Task RemoveAsync(
		string cacheName,
		string cacheKey)
	{
		IFusionCache cache =
			fusionCacheProvider.GetCache(cacheName);

		await cache.RemoveAsync(cacheKey);
	}

	/// <inheritdoc />
	public async Task RemoveManyAsync(
		string cacheName,
		IEnumerable<string> cacheKeys)
	{
		IFusionCache cache =
			fusionCacheProvider.GetCache(cacheName);

		foreach (string cacheKey in cacheKeys)
		{
			await cache.RemoveAsync(cacheKey);
		}
	}
}
