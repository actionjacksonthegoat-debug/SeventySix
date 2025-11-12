// <copyright file="OpenWeatherServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using FluentValidation.Results;
using Microsoft.Extensions.Logging;
using Moq;
using SeventySix.BusinessLogic.Services;
using SeventySix.Core.DTOs.OpenWeather;
using SeventySix.Core.DTOs.OpenWeather.Common;
using SeventySix.Core.DTOs.Requests;
using SeventySix.Core.Exceptions;
using SeventySix.Core.Interfaces;
using Xunit;

namespace SeventySix.BusinessLogic.Tests.Services;

/// <summary>
/// Unit tests for OpenWeatherService.
/// </summary>
public class OpenWeatherServiceTests
{
	private readonly Mock<IOpenWeatherApiClient> MockApiClient;
	private readonly Mock<IValidator<WeatherRequest>> MockWeatherValidator;
	private readonly Mock<IValidator<HistoricalWeatherRequest>> MockHistoricalValidator;
	private readonly Mock<IRateLimitingService> MockRateLimiter;
	private readonly Mock<ILogger<OpenWeatherService>> MockLogger;
	private readonly OpenWeatherService Sut;

	public OpenWeatherServiceTests()
	{
		MockApiClient = new Mock<IOpenWeatherApiClient>();
		MockWeatherValidator = new Mock<IValidator<WeatherRequest>>();
		MockHistoricalValidator = new Mock<IValidator<HistoricalWeatherRequest>>();
		MockRateLimiter = new Mock<IRateLimitingService>();
		MockLogger = new Mock<ILogger<OpenWeatherService>>();

		// Setup default validator behavior (pass validation)
		MockWeatherValidator
			.Setup(v => v.ValidateAsync(It.IsAny<WeatherRequest>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(new ValidationResult());

		MockHistoricalValidator
			.Setup(v => v.ValidateAsync(It.IsAny<HistoricalWeatherRequest>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(new ValidationResult());

		Sut = new OpenWeatherService(
			MockApiClient.Object,
			MockWeatherValidator.Object,
			MockHistoricalValidator.Object,
			MockRateLimiter.Object,
			MockLogger.Object);
	}

	[Fact]
	public async Task GetCurrentWeatherAsync_ValidRequest_ReturnsCurrentWeather()
	{
		// Arrange
		var request = new WeatherRequest
		{
			Latitude = 40.7128,
			Longitude = -74.0060,
			Units = Units.Metric,
		};

		var expectedCurrent = new CurrentWeather
		{
			Temperature = 20.5,
			Humidity = 65,
		};

		var apiResponse = new OneCallResponse
		{
			Current = expectedCurrent,
		};

		MockApiClient
			.Setup(c => c.GetOneCallDataAsync(It.IsAny<WeatherRequest>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(apiResponse);

		// Act
		CurrentWeather? result = await Sut.GetCurrentWeatherAsync(request);

		// Assert
		Assert.NotNull(result);
		Assert.Equal(20.5, result.Temperature);
		Assert.Equal(65, result.Humidity);
	}

	[Fact]
	public async Task GetCurrentWeatherAsync_NullRequest_ThrowsArgumentNullException()
	{
		// Act & Assert
		await Assert.ThrowsAsync<ArgumentNullException>(
			async () => await Sut.GetCurrentWeatherAsync(null!));
	}

	[Fact]
	public async Task GetHourlyForecastAsync_ValidRequest_ReturnsHourlyForecasts()
	{
		// Arrange
		var request = new WeatherRequest
		{
			Latitude = 40.7128,
			Longitude = -74.0060,
		};

		var hourlyForecasts = new List<HourlyForecast>
		{
			new() { Temperature = 20, Timestamp = 1699632000 },
			new() { Temperature = 21, Timestamp = 1699635600 },
		};

		var apiResponse = new OneCallResponse
		{
			Hourly = hourlyForecasts,
		};

		MockApiClient
			.Setup(c => c.GetOneCallDataAsync(It.IsAny<WeatherRequest>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(apiResponse);

		// Act
		IEnumerable<HourlyForecast> result = await Sut.GetHourlyForecastAsync(request);

		// Assert
		Assert.NotNull(result);
		Assert.Equal(2, result.Count());
		Assert.Equal(20, result.First().Temperature);
	}

	[Fact]
	public async Task GetDailyForecastAsync_ValidRequest_ReturnsDailyForecasts()
	{
		// Arrange
		var request = new WeatherRequest
		{
			Latitude = 40.7128,
			Longitude = -74.0060,
		};

		var dailyForecasts = new List<DailyForecast>
		{
			new() { Temperature = new Temperature { Day = 20 } },
			new() { Temperature = new Temperature { Day = 22 } },
		};

		var apiResponse = new OneCallResponse
		{
			Daily = dailyForecasts,
		};

		MockApiClient
			.Setup(c => c.GetOneCallDataAsync(It.IsAny<WeatherRequest>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(apiResponse);

		// Act
		IEnumerable<DailyForecast> result = await Sut.GetDailyForecastAsync(request);

		// Assert
		Assert.NotNull(result);
		Assert.Equal(2, result.Count());
	}

	[Fact]
	public async Task GetWeatherAlertsAsync_ValidRequest_ReturnsAlerts()
	{
		// Arrange
		var request = new WeatherRequest
		{
			Latitude = 40.7128,
			Longitude = -74.0060,
		};

		var alerts = new List<WeatherAlert>
		{
			new() { Event = "Thunderstorm Warning", SenderName = "NWS" },
		};

		var apiResponse = new OneCallResponse
		{
			Alerts = alerts,
		};

		MockApiClient
			.Setup(c => c.GetOneCallDataAsync(It.IsAny<WeatherRequest>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(apiResponse);

		// Act
		IEnumerable<WeatherAlert> result = await Sut.GetWeatherAlertsAsync(request);

		// Assert
		Assert.NotNull(result);
		Assert.Single(result);
		Assert.Equal("Thunderstorm Warning", result.First().Event);
	}

	[Fact]
	public async Task GetCompleteWeatherDataAsync_ApiClientThrows_ThrowsExternalServiceException()
	{
		// Arrange
		var request = new WeatherRequest
		{
			Latitude = 40.7128,
			Longitude = -74.0060,
		};

		MockApiClient
			.Setup(c => c.GetOneCallDataAsync(It.IsAny<WeatherRequest>(), It.IsAny<CancellationToken>()))
			.ThrowsAsync(new HttpRequestException("API error"));

		// Act & Assert
		await Assert.ThrowsAsync<ExternalServiceException>(
			async () => await Sut.GetCompleteWeatherDataAsync(request));
	}

	[Fact]
	public async Task CanMakeApiCall_DelegatesToApiClient()
	{
		// Arrange
		MockApiClient.Setup(c => c.CanMakeRequestAsync(It.IsAny<CancellationToken>())).ReturnsAsync(true);

		// Act
		bool result = await Sut.CanMakeApiCallAsync();

		// Assert
		Assert.True(result);
		MockApiClient.Verify(c => c.CanMakeRequestAsync(It.IsAny<CancellationToken>()), Times.Once);
	}

	[Fact]
	public async Task GetRemainingApiQuota_DelegatesToApiClient()
	{
		// Arrange
		MockApiClient.Setup(c => c.GetRemainingQuotaAsync(It.IsAny<CancellationToken>())).ReturnsAsync(500);

		// Act
		int result = await Sut.GetRemainingApiQuotaAsync();

		// Assert
		Assert.Equal(500, result);
		MockApiClient.Verify(c => c.GetRemainingQuotaAsync(It.IsAny<CancellationToken>()), Times.Once);
	}

	[Fact]
	public void GetTimeUntilReset_DelegatesToRateLimiter()
	{
		// Arrange
		var expectedTime = TimeSpan.FromHours(5);
		MockRateLimiter.Setup(r => r.GetTimeUntilReset()).Returns(expectedTime);

		// Act
		TimeSpan result = Sut.GetTimeUntilReset();

		// Assert
		Assert.Equal(expectedTime, result);
		MockRateLimiter.Verify(r => r.GetTimeUntilReset(), Times.Once);
	}

	[Fact]
	public async Task GetMinutelyForecastAsync_ValidRequest_ReturnsMinutelyForecasts()
	{
		// Arrange
		var request = new WeatherRequest
		{
			Latitude = 40.7128,
			Longitude = -74.0060,
		};

		var minutelyForecasts = new List<MinutelyForecast>
		{
			new() { Timestamp = 1699632000, Precipitation = 0.5 },
			new() { Timestamp = 1699632060, Precipitation = 0.7 },
		};

		var apiResponse = new OneCallResponse
		{
			Minutely = minutelyForecasts,
		};

		MockApiClient
			.Setup(c => c.GetOneCallDataAsync(It.IsAny<WeatherRequest>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(apiResponse);

		// Act
		IEnumerable<MinutelyForecast> result = await Sut.GetMinutelyForecastAsync(request);

		// Assert
		Assert.NotNull(result);
		Assert.Equal(2, result.Count());
		Assert.Equal(0.5, result.First().Precipitation);
	}
}
