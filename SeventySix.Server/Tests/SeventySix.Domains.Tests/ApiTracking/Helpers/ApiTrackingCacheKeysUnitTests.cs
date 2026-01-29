// <copyright file="ApiTrackingCacheKeysUnitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Shouldly;
using Xunit;

namespace SeventySix.Domains.Tests.ApiTracking.Helpers;

/// <summary>
/// Unit tests for <see cref="SeventySix.ApiTracking.ApiTrackingCacheKeys"/>.
/// </summary>
public sealed class ApiTrackingCacheKeysUnitTests
{
	/// <summary>
	/// Verifies DailyStatistics generates correct key format.
	/// </summary>
	[Fact]
	public void DailyStatistics_ValidDate_ReturnsExpectedFormat()
	{
		// Arrange
		DateOnly testDate =
			new(2026, 1, 29);

		// Act
		string cacheKey =
			SeventySix.ApiTracking.ApiTrackingCacheKeys.DailyStatistics(testDate);

		// Assert
		cacheKey.ShouldBe("apitracking:stats:2026-01-29");
	}

	/// <summary>
	/// Verifies AllRequests generates correct key format.
	/// </summary>
	[Fact]
	public void AllRequests_ReturnsExpectedFormat()
	{
		// Act
		string cacheKey =
			SeventySix.ApiTracking.ApiTrackingCacheKeys.AllRequests();

		// Assert
		cacheKey.ShouldBe("apitracking:all-requests");
	}
}
