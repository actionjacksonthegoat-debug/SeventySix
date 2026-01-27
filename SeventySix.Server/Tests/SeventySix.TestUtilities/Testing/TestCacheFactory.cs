// <copyright file="TestCacheFactory.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.DependencyInjection;
using SeventySix.Shared.Constants;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.TestUtilities.Testing;

/// <summary>
/// Factory for creating in-memory FusionCache instances for testing.
/// Consolidates duplicated cache creation code (DRY).
/// </summary>
public static class TestCacheFactory
{
	/// <summary>
	/// Default cache duration for testing.
	/// </summary>
	public static readonly TimeSpan DefaultDuration =
		TimeSpan.FromMinutes(1);

	/// <summary>
	/// Creates an in-memory FusionCache instance for the Identity domain.
	/// </summary>
	/// <param name="duration">
	/// Optional cache duration. Defaults to 1 minute (matching production Identity cache).
	/// </param>
	/// <returns>
	/// A memory-only FusionCache instance.
	/// </returns>
	public static IFusionCache CreateIdentityCache(TimeSpan? duration = null) =>
		CreateInMemoryCache(
			CacheNames.Identity,
			duration ?? DefaultDuration);

	/// <summary>
	/// Creates an in-memory FusionCache instance for the specified cache name.
	/// </summary>
	/// <param name="cacheName">
	/// The name of the cache to create.
	/// </param>
	/// <param name="duration">
	/// Optional cache duration. Defaults to 1 minute.
	/// </param>
	/// <returns>
	/// A memory-only FusionCache instance.
	/// </returns>
	public static IFusionCache CreateInMemoryCache(
		string cacheName,
		TimeSpan? duration = null)
	{
		TimeSpan cacheDuration =
			duration ?? DefaultDuration;

		ServiceCollection services =
			new();

		services
			.AddFusionCache(cacheName)
			.WithDefaultEntryOptions(
				options => options.Duration = cacheDuration);

		ServiceProvider serviceProvider =
			services.BuildServiceProvider();

		IFusionCacheProvider provider =
			serviceProvider.GetRequiredService<IFusionCacheProvider>();

		return provider.GetCache(cacheName);
	}
}