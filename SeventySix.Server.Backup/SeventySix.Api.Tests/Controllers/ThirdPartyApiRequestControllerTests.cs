// <copyright file="ThirdPartyApiRequestsControllerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using Moq;
using SeventySix.Api.Controllers;
using SeventySix.Core.DTOs.ThirdPartyRequests;
using SeventySix.Core.Interfaces;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Unit tests for ThirdPartyApiRequestsController.
/// </summary>
public class ThirdPartyApiRequestsControllerTests
{
	private readonly Mock<IThirdPartyApiRequestService> MockService;
	private readonly ThirdPartyApiRequestsController Controller;

	public ThirdPartyApiRequestsControllerTests()
	{
		MockService = new Mock<IThirdPartyApiRequestService>();
		Controller = new ThirdPartyApiRequestsController(MockService.Object);
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

		MockService.Setup(s => s.GetAllAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(expectedRequests);

		// Act
		ActionResult<IEnumerable<ThirdPartyApiRequestResponse>> result = await Controller.GetAllAsync(CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		IEnumerable<ThirdPartyApiRequestResponse> returnedRequests = Assert.IsAssignableFrom<IEnumerable<ThirdPartyApiRequestResponse>>(okResult.Value);
		Assert.Equal(2, returnedRequests.Count());
		MockService.Verify(s => s.GetAllAsync(It.IsAny<CancellationToken>()), Times.Once);
	}

	[Fact]
	public async Task GetAll_ReturnsEmptyList_WhenNoApiRequestsAsync()
	{
		// Arrange
		MockService.Setup(s => s.GetAllAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(new List<ThirdPartyApiRequestResponse>());

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

		MockService.Setup(s => s.GetStatisticsAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(expectedStats);

		// Act
		ActionResult<ThirdPartyApiStatisticsResponse> result = await Controller.GetStatisticsAsync(CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		ThirdPartyApiStatisticsResponse returnedStats = Assert.IsType<ThirdPartyApiStatisticsResponse>(okResult.Value);
		Assert.Equal(225, returnedStats.TotalCallsToday);
		Assert.Equal(2, returnedStats.TotalApisTracked);
		Assert.Equal(2, returnedStats.CallsByApi.Count);
		MockService.Verify(s => s.GetStatisticsAsync(It.IsAny<CancellationToken>()), Times.Once);
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

		MockService.Setup(s => s.GetStatisticsAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(expectedStats);

		// Act
		ActionResult<ThirdPartyApiStatisticsResponse> result = await Controller.GetStatisticsAsync(CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		ThirdPartyApiStatisticsResponse returnedStats = Assert.IsType<ThirdPartyApiStatisticsResponse>(okResult.Value);
		Assert.Equal(0, returnedStats.TotalCallsToday);
		Assert.Empty(returnedStats.CallsByApi);
	}
}