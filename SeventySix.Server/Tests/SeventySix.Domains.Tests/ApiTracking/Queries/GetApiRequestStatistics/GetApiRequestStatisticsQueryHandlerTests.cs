// <copyright file="GetApiRequestStatisticsQueryHandlerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using SeventySix.ApiTracking;
using Shouldly;

namespace SeventySix.Domains.Tests.ApiTracking.Queries.GetApiRequestStatistics;

/// <summary>
/// Unit tests for <see cref="GetApiRequestStatisticsQueryHandler"/>.
/// </summary>
/// <remarks>
/// Tests the aggregation logic for API request statistics.
/// Uses mocked repository since data access is tested in repository tests.
/// </remarks>
public class GetApiRequestStatisticsQueryHandlerTests
{
	private readonly IThirdPartyApiRequestRepository Repository;

	/// <summary>
	/// Initializes a new instance of the <see cref="GetApiRequestStatisticsQueryHandlerTests"/> class.
	/// </summary>
	public GetApiRequestStatisticsQueryHandlerTests()
	{
		Repository =
			Substitute.For<IThirdPartyApiRequestRepository>();
	}

	/// <summary>
	/// Tests that statistics are correctly aggregated from multiple APIs.
	/// </summary>
	[Fact]
	public async Task HandleAsync_MultipleApis_AggregatesCorrectlyAsync()
	{
		// Arrange
		DateTime weatherLastCalled =
			new(2024, 1, 15, 10, 30, 0, DateTimeKind.Utc);
		DateTime mapsLastCalled =
			new(2024, 1, 15, 9, 0, 0, DateTimeKind.Utc);

		List<ThirdPartyApiRequest> requests =
			[
				new()
				{
					Id = 1,
					ApiName = "WeatherApi",
					BaseUrl = "https://api.weather.com",
					CallCount = 100,
					LastCalledAt = weatherLastCalled,
				},
				new()
				{
					Id = 2,
					ApiName = "MapsApi",
					BaseUrl = "https://api.maps.com",
					CallCount = 50,
					LastCalledAt = mapsLastCalled,
				},
			];

		GetApiRequestStatisticsQuery query =
			new();

		Repository
			.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns(requests);

		// Act
		ThirdPartyApiStatisticsDto result =
			await GetApiRequestStatisticsQueryHandler.HandleAsync(
				query,
				Repository,
				CancellationToken.None);

		// Assert
		result.TotalCallsToday.ShouldBe(150);
		result.TotalApisTracked.ShouldBe(2);
		result.CallsByApi.ShouldContainKey("WeatherApi");
		result.CallsByApi["WeatherApi"].ShouldBe(100);
		result.CallsByApi["MapsApi"].ShouldBe(50);
		result.LastCalledByApi["WeatherApi"].ShouldBe(weatherLastCalled);
		result.LastCalledByApi["MapsApi"].ShouldBe(mapsLastCalled);
	}

	/// <summary>
	/// Tests that empty database returns zero statistics.
	/// </summary>
	[Fact]
	public async Task HandleAsync_NoApis_ReturnsZeroStatisticsAsync()
	{
		// Arrange
		GetApiRequestStatisticsQuery query =
			new();

		Repository
			.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns([]);

		// Act
		ThirdPartyApiStatisticsDto result =
			await GetApiRequestStatisticsQueryHandler.HandleAsync(
				query,
				Repository,
				CancellationToken.None);

		// Assert
		result.TotalCallsToday.ShouldBe(0);
		result.TotalApisTracked.ShouldBe(0);
		result.CallsByApi.ShouldBeEmpty();
		result.LastCalledByApi.ShouldBeEmpty();
	}

	/// <summary>
	/// Tests that single API statistics are calculated correctly.
	/// </summary>
	[Fact]
	public async Task HandleAsync_SingleApi_ReturnsCorrectStatisticsAsync()
	{
		// Arrange
		DateTime lastCalled =
			new(2024, 1, 15, 14, 0, 0, DateTimeKind.Utc);

		List<ThirdPartyApiRequest> requests =
			[
				new()
				{
					Id = 1,
					ApiName = "SingleApi",
					BaseUrl = "https://api.single.com",
					CallCount = 25,
					LastCalledAt = lastCalled,
				},
			];

		GetApiRequestStatisticsQuery query =
			new();

		Repository
			.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns(requests);

		// Act
		ThirdPartyApiStatisticsDto result =
			await GetApiRequestStatisticsQueryHandler.HandleAsync(
				query,
				Repository,
				CancellationToken.None);

		// Assert
		result.TotalCallsToday.ShouldBe(25);
		result.TotalApisTracked.ShouldBe(1);
		result.CallsByApi.Count.ShouldBe(1);
		result.CallsByApi["SingleApi"].ShouldBe(25);
	}
}