// <copyright file="LogsControllerLogChartTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.Extensions.Logging;
using Moq;
using SeventySix.Api.Controllers;
using SeventySix.Application.DTOs.LogCharts;
using SeventySix.Application.Interfaces;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Unit tests for LogsController log chart endpoints.
/// </summary>
public class LogsControllerLogChartTests
{
	private readonly Mock<ILogRepository> MockLogRepository;
	private readonly Mock<ILogChartService> MockLogChartService;
	private readonly Mock<ILogger<LogsController>> MockLogger;
	private readonly Mock<IOutputCacheStore> MockOutputCacheStore;
	private readonly LogsController Controller;

	public LogsControllerLogChartTests()
	{
		MockLogRepository = new Mock<ILogRepository>();
		MockLogChartService = new Mock<ILogChartService>();
		MockLogger = new Mock<ILogger<LogsController>>();
		MockOutputCacheStore = new Mock<IOutputCacheStore>();
		Controller = new LogsController(
			MockLogRepository.Object,
			MockLogChartService.Object,
			MockLogger.Object,
			MockOutputCacheStore.Object);
	}

	[Fact]
	public async Task GetLogsByLevel_ReturnsOkResult_WithLogCountsAsync()
	{
		// Arrange
		LogsByLevelResponse expectedResponse = new()
		{
			LogCounts = new Dictionary<string, int>
			{
				{ "Information", 150 },
				{ "Warning", 25 },
				{ "Error", 5 },
				{ "Critical", 1 },
			},
		};

		MockLogChartService
			.Setup(s => s.GetLogsByLevelAsync(
				It.IsAny<DateTime?>(),
				It.IsAny<DateTime?>(),
				It.IsAny<CancellationToken>()))
			.ReturnsAsync(expectedResponse);

		// Act
		ActionResult<LogsByLevelResponse> result = await Controller.GetLogsByLevelAsync(null, null, CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		LogsByLevelResponse returnedData = Assert.IsType<LogsByLevelResponse>(okResult.Value);
		Assert.Equal(4, returnedData.LogCounts.Count);
		Assert.Equal(150, returnedData.LogCounts["Information"]);
		Assert.Equal(5, returnedData.LogCounts["Error"]);
	}

	[Fact]
	public async Task GetLogsByHour_ReturnsOkResult_WithHourlyDataAsync()
	{
		// Arrange
		DateTime now = DateTime.UtcNow;
		LogsByHourResponse expectedResponse = new()
		{
			HourlyData =
			[
				new() { Hour = now.AddHours(-2), Count = 100 },
				new() { Hour = now.AddHours(-1), Count = 150 },
				new() { Hour = now, Count = 75 },
			],
		};

		MockLogChartService
			.Setup(s => s.GetLogsByHourAsync(24, It.IsAny<CancellationToken>()))
			.ReturnsAsync(expectedResponse);

		// Act
		ActionResult<LogsByHourResponse> result = await Controller.GetLogsByHourAsync(24, CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		LogsByHourResponse returnedData = Assert.IsType<LogsByHourResponse>(okResult.Value);
		Assert.Equal(3, returnedData.HourlyData.Count);
		Assert.Equal(100, returnedData.HourlyData[0].Count);
	}

	[Fact]
	public async Task GetLogsBySource_ReturnsOkResult_WithSourceCountsAsync()
	{
		// Arrange
		LogsBySourceResponse expectedResponse = new()
		{
			SourceCounts = new Dictionary<string, int>
			{
				{ "WeatherController", 500 },
				{ "UserService", 300 },
				{ "ErrorQueueService", 50 },
			},
		};

		MockLogChartService
			.Setup(s => s.GetLogsBySourceAsync(10, It.IsAny<CancellationToken>()))
			.ReturnsAsync(expectedResponse);

		// Act
		ActionResult<LogsBySourceResponse> result = await Controller.GetLogsBySourceAsync(10, CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		LogsBySourceResponse returnedData = Assert.IsType<LogsBySourceResponse>(okResult.Value);
		Assert.Equal(3, returnedData.SourceCounts.Count);
		Assert.Equal(500, returnedData.SourceCounts["WeatherController"]);
	}

	[Fact]
	public async Task GetRecentErrors_ReturnsOkResult_WithRecentErrorsAsync()
	{
		// Arrange
		DateTime now = DateTime.UtcNow;
		RecentErrorsResponse expectedResponse = new()
		{
			Errors =
			[
				new() {
					Timestamp = now.AddMinutes(-5),
					Level = "Error",
					Message = "Database connection failed",
					Source = "DatabaseService",
				},
				new() {
					Timestamp = now.AddMinutes(-2),
					Level = "Critical",
					Message = "API rate limit exceeded",
					Source = "OpenWeatherService",
				},
			],
		};

		MockLogChartService
			.Setup(s => s.GetRecentErrorsAsync(50, It.IsAny<CancellationToken>()))
			.ReturnsAsync(expectedResponse);

		// Act
		ActionResult<RecentErrorsResponse> result = await Controller.GetRecentErrorsAsync(50, CancellationToken.None);

		// Assert
		OkObjectResult okResult = Assert.IsType<OkObjectResult>(result.Result);
		RecentErrorsResponse returnedData = Assert.IsType<RecentErrorsResponse>(okResult.Value);
		Assert.Equal(2, returnedData.Errors.Count);
		Assert.Equal("Error", returnedData.Errors[0].Level);
		Assert.Equal("Critical", returnedData.Errors[1].Level);
	}

	[Fact]
	public async Task GetLogsByLevel_UsesDefaultDates_WhenNotProvidedAsync()
	{
		// Arrange
		LogsByLevelResponse expectedResponse = new()
		{
			LogCounts = [],
		};

		MockLogChartService
			.Setup(s => s.GetLogsByLevelAsync(null, null, It.IsAny<CancellationToken>()))
			.ReturnsAsync(expectedResponse);

		// Act
		await Controller.GetLogsByLevelAsync(null, null, CancellationToken.None);

		// Assert
		MockLogChartService.Verify(
			s => s.GetLogsByLevelAsync(null, null, It.IsAny<CancellationToken>()),
			Times.Once);
	}

	[Fact]
	public async Task GetLogsByHour_UsesDefaultHoursBack_WhenNotProvidedAsync()
	{
		// Arrange
		LogsByHourResponse expectedResponse = new() { HourlyData = [] };

		MockLogChartService
			.Setup(s => s.GetLogsByHourAsync(24, It.IsAny<CancellationToken>()))
			.ReturnsAsync(expectedResponse);

		// Act
		await Controller.GetLogsByHourAsync(null, CancellationToken.None);

		// Assert
		MockLogChartService.Verify(
			s => s.GetLogsByHourAsync(24, It.IsAny<CancellationToken>()),
			Times.Once);
	}
}