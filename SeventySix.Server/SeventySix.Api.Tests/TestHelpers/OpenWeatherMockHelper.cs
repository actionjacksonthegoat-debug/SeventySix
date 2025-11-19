// <copyright file="OpenWeatherMockHelper.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Moq;
using SeventySix.BusinessLogic.DTOs.OpenWeather;
using SeventySix.BusinessLogic.DTOs.OpenWeather.Common;
using SeventySix.BusinessLogic.DTOs.Requests;
using SeventySix.BusinessLogic.Interfaces;

namespace SeventySix.Api.Tests.TestHelpers;

/// <summary>
/// Helper class for creating mock IOpenWeatherApiClient instances with common configurations.
/// Centralizes mock setup to avoid duplication across test files.
/// </summary>
public static class OpenWeatherMockHelper
{
	/// <summary>
	/// Creates a mock IOpenWeatherApiClient with default successful responses.
	/// All methods return valid data and allow requests.
	/// </summary>
	/// <returns>Configured mock client.</returns>
	public static Mock<IOpenWeatherApiClient> CreateMockClient()
	{
		Mock<IOpenWeatherApiClient> mock = new();

		// Setup default: requests are allowed
		mock.Setup(c => c.CanMakeRequestAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(true);

		// Setup default: plenty of quota remaining
		mock.Setup(c => c.GetRemainingQuotaAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(1000);

		// Setup default: successful OneCall response
		mock.Setup(c => c.GetOneCallDataAsync(It.IsAny<WeatherRequest>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(CreateDefaultOneCallResponse());

		// Setup default: successful historical data response
		mock.Setup(c => c.GetHistoricalDataAsync(It.IsAny<HistoricalWeatherRequest>(), It.IsAny<CancellationToken>()))
			.ReturnsAsync(CreateDefaultOneCallResponse());

		return mock;
	}

	/// <summary>
	/// Creates a mock IOpenWeatherApiClient that simulates rate limit exceeded.
	/// CanMakeRequestAsync returns false, GetRemainingQuotaAsync returns 0.
	/// </summary>
	/// <returns>Configured mock client with rate limit exceeded.</returns>
	public static Mock<IOpenWeatherApiClient> CreateRateLimitedMockClient()
	{
		Mock<IOpenWeatherApiClient> mock = new();

		// Setup: requests are blocked due to rate limit
		mock.Setup(c => c.CanMakeRequestAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(false);

		// Setup: no quota remaining
		mock.Setup(c => c.GetRemainingQuotaAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(0);

		return mock;
	}

	/// <summary>
	/// Creates a mock IOpenWeatherApiClient that simulates API failures.
	/// All data retrieval methods throw exceptions.
	/// </summary>
	/// <returns>Configured mock client that throws exceptions.</returns>
	public static Mock<IOpenWeatherApiClient> CreateFailingMockClient()
	{
		Mock<IOpenWeatherApiClient> mock = new();

		// Setup: requests fail
		mock.Setup(c => c.GetOneCallDataAsync(It.IsAny<WeatherRequest>(), It.IsAny<CancellationToken>()))
			.ThrowsAsync(new HttpRequestException("Simulated API failure"));

		mock.Setup(c => c.GetHistoricalDataAsync(It.IsAny<HistoricalWeatherRequest>(), It.IsAny<CancellationToken>()))
			.ThrowsAsync(new HttpRequestException("Simulated API failure"));

		// Setup: can still check rate limiting
		mock.Setup(c => c.CanMakeRequestAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(true);

		mock.Setup(c => c.GetRemainingQuotaAsync(It.IsAny<CancellationToken>()))
			.ReturnsAsync(1000);

		return mock;
	}

	/// <summary>
	/// Creates a default OneCallResponse with typical weather data.
	/// Used for successful response scenarios.
	/// </summary>
	/// <returns>Populated OneCallResponse object.</returns>
	private static OneCallResponse CreateDefaultOneCallResponse()
	{
		return new OneCallResponse
		{
			Latitude = 40.7128,
			Longitude = -74.0060,
			Timezone = "America/New_York",
			TimezoneOffset = -18000,
			Current = new CurrentWeather
			{
				Temperature = 20.5,
				FeelsLike = 19.8,
				Pressure = 1013,
				Humidity = 65,
				DewPoint = 14.2,
				UvIndex = 5.2,
				Clouds = 40,
				Visibility = 10000,
				WindSpeed = 3.5,
				WindDegrees = 180,
				Weather =
				[
					new WeatherCondition
					{
						Id = 800,
						Main = "Clear",
						Description = "clear sky",
						Icon = "01d"
					}
				]
			},
			Minutely = [],
			Hourly = [],
			Daily = [],
			Alerts = []
		};
	}
}