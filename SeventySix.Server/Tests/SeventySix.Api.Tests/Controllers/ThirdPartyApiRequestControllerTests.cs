// <copyright file="ThirdPartyApiRequestsControllerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using NSubstitute;
using SeventySix.Api.Controllers;
using SeventySix.ApiTracking;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Unit tests for ThirdPartyApiRequestsController.
/// </summary>
public class ThirdPartyApiRequestsControllerTests
{
	private readonly IThirdPartyApiRequestService Service;
	private readonly ThirdPartyApiRequestsController Controller;

	public ThirdPartyApiRequestsControllerTests()
	{
		Service = Substitute.For<IThirdPartyApiRequestService>();
		Controller = new ThirdPartyApiRequestsController(Service);
	}

	[Fact]
	public async Task GetAll_ReturnsOkResult_WithListOfApiRequestsAsync()
	{
		// Arrange
		List<ThirdPartyApiRequestResponse> expectedRequests =
		[
			new ThirdPartyApiRequestResponse
			{
				Id = 1,
				ApiName = "OpenWeather",
				BaseUrl = "https://api.openweathermap.org",
				CallCount = 150,
				LastCalledAt = DateTime.UtcNow.AddMinutes(-5),
				ResetDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
			},
			new ThirdPartyApiRequestResponse
			{
				Id = 2,
				ApiName = "GoogleMaps",
				BaseUrl = "https://maps.googleapis.com",
				CallCount = 75,
				LastCalledAt = DateTime.UtcNow.AddMinutes(-10),
				ResetDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(1)),
			},
		];

		Service.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns(expectedRequests);

		// Act
		ActionResult<IEnumerable<ThirdPartyApiRequestResponse>> result = await Controller.GetAllAsync(CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		IEnumerable<ThirdPartyApiRequestResponse> returnedRequests = Assert.IsAssignableFrom<IEnumerable<ThirdPartyApiRequestResponse>>(okResult.Value);
		Assert.Equal(2, returnedRequests.Count());
		await Service.Received(1).GetAllAsync(Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task GetAll_ReturnsEmptyList_WhenNoApiRequestsAsync()
	{
		// Arrange
		Service.GetAllAsync(Arg.Any<CancellationToken>())
			.Returns([]);

		// Act
		ActionResult<IEnumerable<ThirdPartyApiRequestResponse>> result = await Controller.GetAllAsync(CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		IEnumerable<ThirdPartyApiRequestResponse> returnedRequests = Assert.IsAssignableFrom<IEnumerable<ThirdPartyApiRequestResponse>>(okResult.Value);
		Assert.Empty(returnedRequests);
	}

	[Fact]
	public async Task GetStatistics_ReturnsOkResult_WithStatisticsAsync()
	{
		// Arrange
		ThirdPartyApiStatisticsResponse expectedStats = new()
		{
			TotalCallsToday = 225,
			TotalApisTracked = 2,
			CallsByApi = new Dictionary<string, int>
			{
				{ "OpenWeather", 150 },
				{ "GoogleMaps", 75 },
			},
			LastCalledByApi = new Dictionary<string, DateTime?>
			{
				{ "OpenWeather", DateTime.UtcNow.AddMinutes(-5) },
				{ "GoogleMaps", DateTime.UtcNow.AddMinutes(-10) },
			},
		};

		Service.GetStatisticsAsync(Arg.Any<CancellationToken>())
			.Returns(expectedStats);

		// Act
		ActionResult<ThirdPartyApiStatisticsResponse> result = await Controller.GetStatisticsAsync(CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		ThirdPartyApiStatisticsResponse returnedStats = Assert.IsType<ThirdPartyApiStatisticsResponse>(okResult.Value);
		Assert.Equal(225, returnedStats.TotalCallsToday);
		Assert.Equal(2, returnedStats.TotalApisTracked);
		Assert.Equal(2, returnedStats.CallsByApi.Count);
		await Service.Received(1).GetStatisticsAsync(Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task GetStatistics_ReturnsEmptyStatistics_WhenNoDataAsync()
	{
		// Arrange
		ThirdPartyApiStatisticsResponse expectedStats = new()
		{
			TotalCallsToday = 0,
			TotalApisTracked = 0,
			CallsByApi = [],
			LastCalledByApi = [],
		};

		Service.GetStatisticsAsync(Arg.Any<CancellationToken>())
			.Returns(expectedStats);

		// Act
		ActionResult<ThirdPartyApiStatisticsResponse> result = await Controller.GetStatisticsAsync(CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		ThirdPartyApiStatisticsResponse returnedStats = Assert.IsType<ThirdPartyApiStatisticsResponse>(okResult.Value);
		Assert.Equal(0, returnedStats.TotalCallsToday);
		Assert.Empty(returnedStats.CallsByApi);
	}
}