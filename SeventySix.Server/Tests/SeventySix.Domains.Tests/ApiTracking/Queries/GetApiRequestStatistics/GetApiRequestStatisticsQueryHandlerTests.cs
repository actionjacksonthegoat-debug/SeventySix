// <copyright file="GetApiRequestStatisticsQueryHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.ApiTracking;
using SeventySix.Shared.Constants;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.Testing;
using Shouldly;
using ZiggyCreatures.Caching.Fusion;

namespace SeventySix.Domains.Tests.ApiTracking.Queries.GetApiRequestStatistics;

/// <summary>
/// Unit tests for <see cref="GetApiRequestStatisticsQueryHandler"/>.
/// </summary>
/// <remarks>
/// Tests handler delegation to repository with correct date filtering.
/// Aggregation logic is tested in repository integration tests.
/// </remarks>
public class GetApiRequestStatisticsQueryHandlerTests
{
	private readonly IThirdPartyApiRequestRepository Repository;
	private readonly FakeTimeProvider TimeProvider;
	private readonly IFusionCacheProvider CacheProvider;
	private readonly IFusionCache ApiTrackingCache;

	/// <summary>
	/// Initializes a new instance of the <see cref="GetApiRequestStatisticsQueryHandlerTests"/> class.
	/// </summary>
	public GetApiRequestStatisticsQueryHandlerTests()
	{
		Repository =
			Substitute.For<IThirdPartyApiRequestRepository>();
		TimeProvider =
			TestDates.CreateHistoricalTimeProvider();
		ApiTrackingCache =
			TestCacheFactory.CreateApiTrackingCache();
		CacheProvider =
			Substitute.For<IFusionCacheProvider>();
		CacheProvider
			.GetCache(CacheNames.ApiTracking)
			.Returns(ApiTrackingCache);
	}

	/// <summary>
	/// Tests that handler delegates to repository GetStatisticsAsync with today's date.
	/// </summary>
	[Fact]
	public async Task HandleAsync_DelegatesToRepository_WithTodaysDateAsync()
	{
		// Arrange
		DateTimeOffset weatherLastCalled =
			new(2024, 1, 15, 10, 30, 0, TimeSpan.Zero);
		DateTimeOffset mapsLastCalled =
			new(2024, 1, 15, 9, 0, 0, TimeSpan.Zero);

		ThirdPartyApiStatisticsDto expectedStatistics =
			new()
			{
				TotalCallsToday = 150,
				TotalApisTracked = 2,
				CallsByApi =
					new Dictionary<string, int>
					{
						["WeatherApi"] = 100,
						["MapsApi"] = 50,
					},
				LastCalledByApi =
					new Dictionary<string, DateTimeOffset?>
					{
						["WeatherApi"] = weatherLastCalled,
						["MapsApi"] = mapsLastCalled,
					},
			};

		GetApiRequestStatisticsQuery query =
			new();

		DateOnly expectedDate =
			new(2024, 1, 15);

		Repository
			.GetStatisticsAsync(
				expectedDate,
				Arg.Any<CancellationToken>())
			.Returns(expectedStatistics);

		// Act
		ThirdPartyApiStatisticsDto result =
			await GetApiRequestStatisticsQueryHandler.HandleAsync(
				query,
				Repository,
				CacheProvider,
				TimeProvider,
				CancellationToken.None);

		// Assert
		result.ShouldBe(expectedStatistics);
		await Repository
			.Received(1)
			.GetStatisticsAsync(
				expectedDate,
				Arg.Any<CancellationToken>());
	}

	/// <summary>
	/// Tests that empty statistics are returned when repository returns empty statistics.
	/// </summary>
	[Fact]
	public async Task HandleAsync_EmptyStatistics_ReturnsEmptyStatisticsAsync()
	{
		// Arrange
		ThirdPartyApiStatisticsDto emptyStatistics =
			new()
			{
				TotalCallsToday = 0,
				TotalApisTracked = 0,
				CallsByApi = [],
				LastCalledByApi = [],
			};

		GetApiRequestStatisticsQuery query =
			new();

		Repository
			.GetStatisticsAsync(
				Arg.Any<DateOnly>(),
				Arg.Any<CancellationToken>())
			.Returns(emptyStatistics);

		// Act
		ThirdPartyApiStatisticsDto result =
			await GetApiRequestStatisticsQueryHandler.HandleAsync(
				query,
				Repository,
				CacheProvider,
				TimeProvider,
				CancellationToken.None);

		// Assert
		result.TotalCallsToday.ShouldBe(0);
		result.TotalApisTracked.ShouldBe(0);
		result.CallsByApi.ShouldBeEmpty();
		result.LastCalledByApi.ShouldBeEmpty();
	}
}