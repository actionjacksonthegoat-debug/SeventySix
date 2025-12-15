// <copyright file="ThirdPartyApiRequestServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using NSubstitute;
using SeventySix.ApiTracking;

namespace SeventySix.Domains.Tests.ApiTracking;

/// <summary>
/// Unit tests for ThirdPartyApiRequestService.
/// </summary>
public class ThirdPartyApiRequestServiceTests
{
	private readonly IThirdPartyApiRequestRepository Repository;
	private readonly ThirdPartyApiRequestService Service;

	public ThirdPartyApiRequestServiceTests()
	{
		Repository = Substitute.For<IThirdPartyApiRequestRepository>();
		Service = new ThirdPartyApiRequestService(Repository);
	}

	[Fact]
	public async Task GetAllAsync_ReturnsAllRequests_MappedToResponseAsync()
	{
		// Arrange
		List<ThirdPartyApiRequest> entities =
		[
			new ThirdPartyApiRequest
			{
				Id = 1,
				ApiName = "ExternalAPI",
				BaseUrl = "https://api.ExternalAPImap.org",
				CallCount = 150,
				LastCalledAt = DateTime.UtcNow.AddMinutes(-5),
				ResetDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
			},
			new ThirdPartyApiRequest
			{
				Id = 2,
				ApiName = "GoogleMaps",
				BaseUrl = "https://maps.googleapis.com",
				CallCount = 75,
				LastCalledAt = DateTime.UtcNow.AddMinutes(-10),
				ResetDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
			},
		];

		Repository.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns(entities);

		// Act
		IEnumerable<ThirdPartyApiRequestResponse> result = await Service.GetAllAsync(CancellationToken.None);

		// Assert
		Assert.NotNull(result);
		List<ThirdPartyApiRequestResponse> resultList = [.. result];
		Assert.Equal(2, resultList.Count);
		Assert.Equal("ExternalAPI", resultList[0].ApiName);
		Assert.Equal(150, resultList[0].CallCount);
		Assert.Equal("GoogleMaps", resultList[1].ApiName);
		await Repository.Received(1).GetAllAsync(Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task GetAllAsync_ReturnsEmptyList_WhenNoRequestsAsync()
	{
		// Arrange
		Repository.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns([]);

		// Act
		IEnumerable<ThirdPartyApiRequestResponse> result = await Service.GetAllAsync(CancellationToken.None);

		// Assert
		Assert.NotNull(result);
		Assert.Empty(result);
	}

	[Fact]
	public async Task GetStatisticsAsync_ReturnsAggregatedStatisticsAsync()
	{
		// Arrange
		DateTime now = DateTime.UtcNow;
		List<ThirdPartyApiRequest> entities =
		[
			new ThirdPartyApiRequest
			{
				Id = 1,
				ApiName = "ExternalAPI",
				BaseUrl = "https://api.ExternalAPImap.org",
				CallCount = 150,
				LastCalledAt = now.AddMinutes(-5),
				ResetDate = DateOnly.FromDateTime(now.Date.AddDays(1)),
			},
			new ThirdPartyApiRequest
			{
				Id = 2,
				ApiName = "GoogleMaps",
				BaseUrl = "https://maps.googleapis.com",
				CallCount = 75,
				LastCalledAt = now.AddMinutes(-10),
				ResetDate = DateOnly.FromDateTime(now.Date.AddDays(1)),
			},
		];

		Repository.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns(entities);

		// Act
		ThirdPartyApiStatisticsResponse result = await Service.GetStatisticsAsync(CancellationToken.None);

		// Assert
		Assert.NotNull(result);
		Assert.Equal(225, result.TotalCallsToday);
		Assert.Equal(2, result.TotalApisTracked);
		Assert.Equal(2, result.CallsByApi.Count);
		Assert.Equal(150, result.CallsByApi["ExternalAPI"]);
		Assert.Equal(75, result.CallsByApi["GoogleMaps"]);
		Assert.Equal(2, result.LastCalledByApi.Count);
		Assert.NotNull(result.LastCalledByApi["ExternalAPI"]);
		Assert.NotNull(result.LastCalledByApi["GoogleMaps"]);
	}

	[Fact]
	public async Task GetStatisticsAsync_ReturnsZeroStats_WhenNoRequestsAsync()
	{
		// Arrange
		Repository.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns([]);

		// Act
		ThirdPartyApiStatisticsResponse result = await Service.GetStatisticsAsync(CancellationToken.None);

		// Assert
		Assert.NotNull(result);
		Assert.Equal(0, result.TotalCallsToday);
		Assert.Equal(0, result.TotalApisTracked);
		Assert.Empty(result.CallsByApi);
		Assert.Empty(result.LastCalledByApi);
	}

	[Fact]
	public async Task GetStatisticsAsync_HandlesNullLastCalledAtAsync()
	{
		// Arrange
		List<ThirdPartyApiRequest> entities =
		[
			new ThirdPartyApiRequest
			{
				Id = 1,
				ApiName = "ExternalAPI",
				BaseUrl = "https://api.ExternalAPImap.org",
				CallCount = 150,
				LastCalledAt = null,
				ResetDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
			},
		];

		Repository.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns(entities);

		// Act
		ThirdPartyApiStatisticsResponse result = await Service.GetStatisticsAsync(CancellationToken.None);

		// Assert
		Assert.NotNull(result);
		Assert.Equal(150, result.TotalCallsToday);
		Assert.Single(result.CallsByApi);
		Assert.Null(result.LastCalledByApi["ExternalAPI"]);
	}
}