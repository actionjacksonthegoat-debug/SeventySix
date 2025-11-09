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
	private readonly Mock<IWeatherForecastService> _mockService;
	private readonly Mock<ILogger<WeatherForecastController>> _mockLogger;
	private readonly WeatherForecastController _controller;

	/// <summary>
	/// Initializes a new instance of the <see cref="WeatherForecastControllerTests"/> class.
	/// Sets up mocks and controller instance for each test.
	/// </summary>
	public WeatherForecastControllerTests()
	{
		_mockService = new Mock<IWeatherForecastService>();
		_mockLogger = new Mock<ILogger<WeatherForecastController>>();
		_controller = new WeatherForecastController(_mockService.Object, _mockLogger.Object);
	}

	[Fact]
	public void Constructor_WithNullService_ThrowsArgumentNullException()
	{
		// Act & Assert
		var exception = Assert.Throws<ArgumentNullException>(
			() => new WeatherForecastController(null!, _mockLogger.Object));
		exception.ParamName.Should().Be("weatherService");
	}

	[Fact]
	public void Constructor_WithNullLogger_ThrowsArgumentNullException()
	{
		// Act & Assert
		var exception = Assert.Throws<ArgumentNullException>(
			() => new WeatherForecastController(_mockService.Object, null!));
		exception.ParamName.Should().Be("logger");
	}

	[Fact]
	public async Task GetAll_ReturnsOkResult_WithForecasts()
	{
		// Arrange
		var forecasts = new List<WeatherForecastDto>
		{
			new() { Date = new DateOnly(2025, 11, 10), TemperatureC = 20, Summary = "Warm" },
			new() { Date = new DateOnly(2025, 11, 11), TemperatureC = 22, Summary = "Hot" }
		};
		_mockService.Setup(s => s.GetAllForecastsAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(forecasts);

		// Act
		var result = await _controller.GetAll(CancellationToken.None);

		// Assert
		result.Result.Should().BeOfType<OkObjectResult>();
		var okResult = result.Result as OkObjectResult;
		okResult!.Value.Should().BeEquivalentTo(forecasts);
		_mockService.Verify(s => s.GetAllForecastsAsync(It.IsAny<CancellationToken>()), Times.Once);
	}

	[Fact]
	public async Task GetAll_ReturnsOkResult_WithEmptyList_WhenNoForecasts()
	{
		// Arrange
		_mockService.Setup(s => s.GetAllForecastsAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(new List<WeatherForecastDto>());

		// Act
		var result = await _controller.GetAll(CancellationToken.None);

		// Assert
		result.Result.Should().BeOfType<OkObjectResult>();
		var okResult = result.Result as OkObjectResult;
		okResult!.Value.Should().BeEquivalentTo(new List<WeatherForecastDto>());
	}

	[Fact]
	public async Task GetAll_LogsInformation()
	{
		// Arrange
		_mockService.Setup(s => s.GetAllForecastsAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(new List<WeatherForecastDto>());

		// Act
		await _controller.GetAll(CancellationToken.None);

		// Assert
		_mockLogger.Verify(
			x => x.Log(
				LogLevel.Information,
				It.IsAny<EventId>(),
				It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Getting all weather forecasts")),
				It.IsAny<Exception>(),
				It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
			Times.Once);
	}

	[Fact]
	public async Task GetById_WithValidId_ReturnsOkResult_WithForecast()
	{
		// Arrange
		var forecast = new WeatherForecastDto { Date = new DateOnly(2025, 11, 10), TemperatureC = 20, Summary = "Warm" };
		_mockService.Setup(s => s.GetForecastByIdAsync(1, It.IsAny<CancellationToken>()))
			.ReturnsAsync(forecast);

		// Act
		var result = await _controller.GetById(1, CancellationToken.None);

		// Assert
		result.Result.Should().BeOfType<OkObjectResult>();
		var okResult = result.Result as OkObjectResult;
		okResult!.Value.Should().BeEquivalentTo(forecast);
		_mockService.Verify(s => s.GetForecastByIdAsync(1, It.IsAny<CancellationToken>()), Times.Once);
	}

	[Fact]
	public async Task GetById_WithInvalidId_ReturnsNotFoundResult()
	{
		// Arrange
		_mockService.Setup(s => s.GetForecastByIdAsync(999, It.IsAny<CancellationToken>()))
			.ReturnsAsync((WeatherForecastDto?)null);

		// Act
		var result = await _controller.GetById(999, CancellationToken.None);

		// Assert
		result.Result.Should().BeOfType<NotFoundResult>();
		_mockService.Verify(s => s.GetForecastByIdAsync(999, It.IsAny<CancellationToken>()), Times.Once);
	}

	[Fact]
	public async Task GetById_WithInvalidId_LogsWarning()
	{
		// Arrange
		_mockService.Setup(s => s.GetForecastByIdAsync(999, It.IsAny<CancellationToken>()))
			.ReturnsAsync((WeatherForecastDto?)null);

		// Act
		await _controller.GetById(999, CancellationToken.None);

		// Assert
		_mockLogger.Verify(
			x => x.Log(
				LogLevel.Warning,
				It.IsAny<EventId>(),
				It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("not found")),
				It.IsAny<Exception>(),
				It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
			Times.Once);
	}

	[Fact]
	public async Task Create_WithValidRequest_ReturnsCreatedAtRoute()
	{
		// Arrange
		var request = new CreateWeatherForecastRequest
		{
			Date = new DateOnly(2025, 11, 10),
			TemperatureC = 20,
			Summary = "Warm"
		};
		var forecast = new WeatherForecastDto { Date = request.Date, TemperatureC = request.TemperatureC, Summary = request.Summary };
		_mockService.Setup(s => s.CreateForecastAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(forecast);

		// Act
		var result = await _controller.Create(request, CancellationToken.None);

		// Assert
		result.Result.Should().BeOfType<CreatedAtRouteResult>();
		var createdResult = result.Result as CreatedAtRouteResult;
		createdResult!.RouteName.Should().Be("GetWeatherForecastById");
		createdResult.RouteValues.Should().ContainKey("id");
		createdResult.Value.Should().BeEquivalentTo(forecast);
		_mockService.Verify(s => s.CreateForecastAsync(request, It.IsAny<CancellationToken>()), Times.Once);
	}

	[Fact]
	public async Task Create_LogsInformation()
	{
		// Arrange
		var request = new CreateWeatherForecastRequest
		{
			Date = new DateOnly(2025, 11, 10),
			TemperatureC = 20,
			Summary = "Warm"
		};
		var forecast = new WeatherForecastDto { Date = request.Date, TemperatureC = request.TemperatureC, Summary = request.Summary };
		_mockService.Setup(s => s.CreateForecastAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(forecast);

		// Act
		await _controller.Create(request, CancellationToken.None);

		// Assert
		_mockLogger.Verify(
			x => x.Log(
				LogLevel.Information,
				It.IsAny<EventId>(),
				It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Creating new weather forecast")),
				It.IsAny<Exception>(),
				It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
			Times.Once);
	}

	[Fact]
	public async Task GetAll_RespectsCancellationToken()
	{
		// Arrange
		var cts = new CancellationTokenSource();
		_mockService.Setup(s => s.GetAllForecastsAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(new List<WeatherForecastDto>());

		// Act
		await _controller.GetAll(cts.Token);

		// Assert
		_mockService.Verify(s => s.GetAllForecastsAsync(cts.Token), Times.Once);
	}

	[Fact]
	public async Task GetById_RespectsCancellationToken()
	{
		// Arrange
		var cts = new CancellationTokenSource();
		_mockService.Setup(s => s.GetForecastByIdAsync(1, It.IsAny<CancellationToken>()))
			.ReturnsAsync((WeatherForecastDto?)null);

		// Act
		await _controller.GetById(1, cts.Token);

		// Assert
		_mockService.Verify(s => s.GetForecastByIdAsync(1, cts.Token), Times.Once);
	}

	[Fact]
	public async Task Create_RespectsCancellationToken()
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
		_mockService.Setup(s => s.CreateForecastAsync(request, It.IsAny<CancellationToken>()))
			.ReturnsAsync(forecast);

		// Act
		await _controller.Create(request, cts.Token);

		// Assert
		_mockService.Verify(s => s.CreateForecastAsync(request, cts.Token), Times.Once);
	}
}
