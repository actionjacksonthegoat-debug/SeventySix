// <copyright file="FusionCacheExtensionsTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using SeventySix.Shared.Extensions;
using Shouldly;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.Shared.Tests.Extensions;

/// <summary>
/// Unit tests for <see cref="FusionCacheExtensions"/>.
/// </summary>
public sealed class FusionCacheExtensionsTests
{
	private const string RegisteredCacheName = "registered-cache";
	private const string UnregisteredCacheName = "unregistered-cache";

	/// <summary>
	/// Returns the cache instance when the named cache is registered.
	/// </summary>
	[Fact]
	public void GetRequiredCache_RegisteredCache_ReturnsCacheInstance()
	{
		IFusionCacheProvider provider =
			Substitute.For<IFusionCacheProvider>();
		IFusionCache expectedCache =
			Substitute.For<IFusionCache>();
		provider.GetCacheOrNull(RegisteredCacheName).Returns(expectedCache);

		IFusionCache result =
			provider.GetRequiredCache(RegisteredCacheName);

		result.ShouldBeSameAs(expectedCache);
	}

	/// <summary>
	/// Throws InvalidOperationException when the named cache is not registered.
	/// </summary>
	[Fact]
	public void GetRequiredCache_UnregisteredCache_ThrowsInvalidOperationException()
	{
		IFusionCacheProvider provider =
			Substitute.For<IFusionCacheProvider>();
		provider.GetCacheOrNull(Arg.Any<string>()).Returns((IFusionCache?)null);

		InvalidOperationException exception =
			Should.Throw<InvalidOperationException>(
				() => provider.GetRequiredCache(UnregisteredCacheName));

		exception.Message.ShouldContain(UnregisteredCacheName);
	}
}