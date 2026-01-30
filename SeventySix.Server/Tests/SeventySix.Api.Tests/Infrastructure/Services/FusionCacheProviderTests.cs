// <copyright file="FusionCacheProviderTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using SeventySix.Api.Infrastructure.Services;
using SeventySix.Shared.Interfaces;
using Shouldly;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.Api.Tests.Infrastructure.Services;

/// <summary>
/// Unit tests for <see cref="FusionCacheProvider"/>.
/// </summary>
/// <remarks>
/// Follows 80/20 rule: tests critical paths for cache operations.
/// Verifies correct delegation to FusionCache.
/// </remarks>
public sealed class FusionCacheProviderTests
{
	private readonly IFusionCacheProvider FusionCacheProvider;
	private readonly IFusionCache FusionCache;
	private readonly FusionCacheProvider ServiceUnderTest;

	/// <summary>
	/// Initializes a new instance of the <see cref="FusionCacheProviderTests"/> class.
	/// </summary>
	public FusionCacheProviderTests()
	{
		FusionCacheProvider =
			Substitute.For<IFusionCacheProvider>();

		FusionCache =
			Substitute.For<IFusionCache>();

		FusionCacheProvider
			.GetCache(Arg.Any<string>())
			.Returns(FusionCache);

		ServiceUnderTest =
			new FusionCacheProvider(FusionCacheProvider);
	}

	/// <summary>
	/// Verifies RemoveAsync gets the correct named cache and removes the key.
	/// </summary>
	[Fact]
	public async Task RemoveAsync_WithCacheNameAndKey_GetsCacheAndRemovesKeyAsync()
	{
		// Arrange
		const string CacheName = "TestCache";
		const string CacheKey = "test:key:1";

		// Act
		await ServiceUnderTest.RemoveAsync(
			CacheName,
			CacheKey);

		// Assert
		FusionCacheProvider.Received(1)
			.GetCache(CacheName);

		await FusionCache.Received(1)
			.RemoveAsync(CacheKey);
	}

	/// <summary>
	/// Verifies RemoveManyAsync removes all provided keys.
	/// </summary>
	[Fact]
	public async Task RemoveManyAsync_WithMultipleKeys_RemovesAllKeysAsync()
	{
		// Arrange
		const string CacheName = "TestCache";
		List<string> cacheKeys =
			["key:1", "key:2", "key:3"];

		// Act
		await ServiceUnderTest.RemoveManyAsync(
			CacheName,
			cacheKeys);

		// Assert
		foreach (string cacheKey in cacheKeys)
		{
			await FusionCache.Received(1)
				.RemoveAsync(cacheKey);
		}
	}

	/// <summary>
	/// Verifies RemoveManyAsync handles empty collection gracefully.
	/// </summary>
	[Fact]
	public async Task RemoveManyAsync_WithEmptyCollection_DoesNotCallRemoveAsync()
	{
		// Arrange
		const string CacheName = "TestCache";
		List<string> cacheKeys = [];

		// Act
		await ServiceUnderTest.RemoveManyAsync(
			CacheName,
			cacheKeys);

		// Assert
		await FusionCache.DidNotReceive()
			.RemoveAsync(Arg.Any<string>());
	}
}
