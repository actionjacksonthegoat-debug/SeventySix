// <copyright file="OpenWeatherServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using FluentValidation.Results;
using Microsoft.Extensions.Logging;
using Moq;
using SeventySix.BusinessLogic.DTOs.OpenWeather;
using SeventySix.BusinessLogic.DTOs.OpenWeather.Common;
using SeventySix.BusinessLogic.DTOs.Requests;
using SeventySix.BusinessLogic.Exceptions;
using SeventySix.BusinessLogic.Interfaces;
using SeventySix.BusinessLogic.Services;

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
		WeatherRequest request = new()
		{
			Latitude = 40.7128,
			Longitude = -74.0060,
			Units = Units.Metric,
		};

		CurrentWeather expectedCurrent = new()
		{
			Temperature = 20.5,
			Humidity = 65,
		};

		OneCallResponse apiResponse = new()
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
		WeatherRequest request = new()
		{
			Latitude = 40.7128,
			Longitude = -74.0060,
		};

		List<HourlyForecast> hourlyForecasts =
		[
			new() { Temperature = 20 },
			new() { Temperature = 21 },
		];

		OneCallResponse apiResponse = new()
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
		WeatherRequest request = new()
		{
			Latitude = 40.7128,
			Longitude = -74.0060,
		};

		List<DailyForecast> dailyForecasts =
		[
			new() { Temperature = new Temperature { Day = 20 } },
			new() { Temperature = new Temperature { Day = 22 } },
		];

		OneCallResponse apiResponse = new()
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
		WeatherRequest request = new()
		{
			Latitude = 40.7128,
			Longitude = -74.0060,
		};

		List<WeatherAlert> alerts =
		[
			new() { Event = "Thunderstorm Warning", SenderName = "NWS" },
		];

		OneCallResponse apiResponse = new()
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
		WeatherRequest request = new()
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
		TimeSpan expectedTime = TimeSpan.FromHours(5);
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
		WeatherRequest request = new()
		{
			Latitude = 40.7128,
			Longitude = -74.0060,
		};

		List<MinutelyForecast> minutelyForecasts =
		[
			new() { Precipitation = 0.5 },
			new() { Precipitation = 0.7 },
		];

		OneCallResponse apiResponse = new()
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