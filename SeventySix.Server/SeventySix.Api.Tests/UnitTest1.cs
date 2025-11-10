// <copyright file="WeatherForecastControllerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using SeventySix.Api.Controllers;
using SeventySix.Application.DTOs;
using SeventySix.Application.DTOs.Requests;
using SeventySix.Application.Interfaces;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Unit tests for WeatherForecastController.
/// </summary>
public class WeatherForecastControllerTests
{
	private readonly Mock<IWeatherForecastService> MockService;
	private readonly Mock<ILogger<WeatherForecastController>> MockLogger;
	private readonly WeatherForecastController Controller;

	/// <summary>
	/// Initializes a new instance of the <see cref="WeatherForecastControllerTests"/> class.
	/// Sets up mocks and controller instance for each test.
	/// </summary>
	public WeatherForecastControllerTests()
	{
		MockService = new Mock<IWeatherForecastService>();
		MockLogger = new Mock<ILogger<WeatherForecastController>>();
		Controller = new WeatherForecastController(MockService.Object, MockLogger.Object);
	}

	[Fact]
	public void Constructor_WithNullService_ThrowsArgumentNullException()
	{
		// Act & Assert
		var exception = Assert.Throws<ArgumentNullException>(
			() => new WeatherForecastController(null!, MockLogger.Object));
		exception.ParamName.Should().Be("weatherService");
	}

	[Fact]
	public void Constructor_WithNullLogger_ThrowsArgumentNullException()
	{
		// Act & Assert
		var exception = Assert.Throws<ArgumentNullException>(
			() => new WeatherForecastController(MockService.Object, null!));
		exception.ParamName.Should().Be("logger");
	}

	[Fact]
	public async Task GetAllAsync_ReturnsOkResult_WithForecastsAsync()
	{
		// Arrange
		var forecasts = new List<WeatherForecastDto>
		{
			new() { Date = new DateOnly(2025, 11, 10), TemperatureC = 20, Summary = "Warm" },
			new() { Date = new DateOnly(2025, 11, 11), TemperatureC = 22, Summary = "Hot" }
		};
		MockService.Setup(s => s.GetAllForecastsAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(forecasts);

		// Act
		var result = await Controller.GetAllAsync(CancellationToken.None);

		// Assert
		result.Result.Should().BeOfType<OkObjectResult>();
		var okResult = result.Result as OkObjectResult;
		okResult!.Value.Should().BeEquivalentTo(forecasts);
		MockService.Verify(s => s.GetAllForecastsAsync(It.IsAny<CancellationToken>()), Times.Once);
	}

	[Fact]
	public async Task GetAllAsync_ReturnsOkResult_WithEmptyList_WhenNoForecastsAsync()
	{
		// Arrange
		MockService.Setup(s => s.GetAllForecastsAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(new List<WeatherForecastDto>());

		// Act
		var result = await Controller.GetAllAsync(CancellationToken.None);

		// Assert
		result.Result.Should().BeOfType<OkObjectResult>();
		var okResult = result.Result as OkObjectResult;
		okResult!.Value.Should().BeEquivalentTo(new List<WeatherForecastDto>());
	}

	[Fact]
	public async Task GetAllAsync_LogsInformationAsync()
	{
		// Arrange
		MockService.Setup(s => s.GetAllForecastsAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(new List<WeatherForecastDto>());

		// Act
		await Controller.GetAllAsync(CancellationToken.None);

		// Assert
		MockLogger.Verify(
			x => x.Log(
				LogLevel.Information,
				It.IsAny<EventId>(),
				It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Getting all weather forecasts")),
				It.IsAny<Exception>(),
				It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
			Times.Once);
	}

	[Fact]
	public async Task GetByIdAsync_WithValidId_ReturnsOkResult_WithForecastAsync()
	{
		// Arrange
		var forecast = new WeatherForecastDto { Date = new DateOnly(2025, 11, 10), TemperatureC = 20, Summary = "Warm" };
		MockService.Setup(s => s.GetForecastByIdAsync(1, It.IsAny<CancellationToken>()))
			.ReturnsAsync(forecast);

		// Act
		var result = await Controller.GetByIdAsync(1, CancellationToken.None);

		// Assert
		result.Result.Should().BeOfType<OkObjectResult>();
		var okResult = result.Result as OkObjectResult;
		okResult!.Value.Should().BeEquivalentTo(forecast);
		MockService.Verify(s => s.GetForecastByIdAsync(1, It.IsAny<CancellationToken>()), Times.Once);
	}

	[Fact]
	public async Task GetByIdAsync_WithInvalidId_ReturnsNotFoundResultAsync()
	{
		// Arrange
		MockService.Setup(s => s.GetForecastByIdAsync(999, It.IsAny<CancellationToken>()))
			.ReturnsAsync((WeatherForecastDto?)null);

		// Act
		var result = await Controller.GetByIdAsync(999, CancellationToken.None);

		// Assert
		result.Result.Should().BeOfType<NotFoundResult>();
		MockService.Verify(s => s.GetForecastByIdAsync(999, It.IsAny<CancellationToken>()), Times.Once);
	}

	[Fact]
	public async Task GetByIdAsync_WithInvalidId_LogsWarningAsync()
	{
		// Arrange
		MockService.Setup(s => s.GetForecastByIdAsync(999, It.IsAny<CancellationToken>()))
			.ReturnsAsync((WeatherForecastDto?)null);

		// Act
		await Controller.GetByIdAsync(999, CancellationToken.None);

		// Assert
		MockLogger.Verify(
			x => x.Log(
				LogLevel.Warning,
				It.IsAny<EventId>(),
				It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("not found")),
				It.IsAny<Exception>(),
				It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
			Times.Once);
	}

	[Fact]
	public async Task CreateAsync_WithValidRequest_ReturnsCreatedAtRouteAsync()
	{
		// Arrange
		var request = new CreateWeatherForecastRequest
		{
			Date = new DateOnly(2025, 11, 10),
			TemperatureC = 20,
			Summary = "Warm"
		};
		var forecast = new WeatherForecastDto { Date = request.Date, TemperatureC = request.TemperatureC, Summary = request.Summary };
		MockService.Setup(s => s.CreateForecastAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(forecast);

		// Act
		var result = await Controller.CreateAsync(request, CancellationToken.None);

		// Assert
		result.Result.Should().BeOfType<CreatedAtRouteResult>();
		var createdResult = result.Result as CreatedAtRouteResult;
		createdResult!.RouteName.Should().Be("GetWeatherForecastById");
		createdResult.RouteValues.Should().ContainKey("id");
		createdResult.Value.Should().BeEquivalentTo(forecast);
		MockService.Verify(s => s.CreateForecastAsync(request, It.IsAny<CancellationToken>()), Times.Once);
	}

	[Fact]
	public async Task CreateAsync_LogsInformationAsync()
	{
		// Arrange
		var request = new CreateWeatherForecastRequest
		{
			Date = new DateOnly(2025, 11, 10),
			TemperatureC = 20,
			Summary = "Warm"
		};
		var forecast = new WeatherForecastDto { Date = request.Date, TemperatureC = request.TemperatureC, Summary = request.Summary };
		MockService.Setup(s => s.CreateForecastAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(forecast);

		// Act
		await Controller.CreateAsync(request, CancellationToken.None);

		// Assert
		MockLogger.Verify(
			x => x.Log(
				LogLevel.Information,
				It.IsAny<EventId>(),
				It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Creating new weather forecast")),
				It.IsAny<Exception>(),
				It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
			Times.Once);
	}

	[Fact]
	public async Task GetAllAsync_RespectsCancellationTokenAsync()
	{
		// Arrange
		var cts = new CancellationTokenSource();
		MockService.Setup(s => s.GetAllForecastsAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(new List<WeatherForecastDto>());

		// Act
		await Controller.GetAllAsync(cts.Token);

		// Assert
		MockService.Verify(s => s.GetAllForecastsAsync(cts.Token), Times.Once);
	}

	[Fact]
	public async Task GetByIdAsync_RespectsCancellationTokenAsync()
	{
		// Arrange
		var cts = new CancellationTokenSource();
		MockService.Setup(s => s.GetForecastByIdAsync(1, It.IsAny<CancellationToken>()))
			.ReturnsAsync((WeatherForecastDto?)null);

		// Act
		await Controller.GetByIdAsync(1, cts.Token);

		// Assert
		MockService.Verify(s => s.GetForecastByIdAsync(1, cts.Token), Times.Once);
	}

	[Fact]
	public async Task CreateAsync_RespectsCancellationTokenAsync()
	{
		// Arrange
		var cts = new CancellationTokenSource();
		var request = new CreateWeatherForecastRequest
		{
			Date = new DateOnly(2025, 11, 10),
			TemperatureC = 20,
			Summary = "Warm"
		};
		var forecast = new WeatherForecastDto { Date = request.Date, TemperatureC = request.TemperatureC, Summary = request.Summary };
		MockService.Setup(s => s.CreateForecastAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(forecast);

		// Act
		await Controller.CreateAsync(request, cts.Token);

		// Assert
		MockService.Verify(s => s.CreateForecastAsync(request, cts.Token), Times.Once);
	}
}