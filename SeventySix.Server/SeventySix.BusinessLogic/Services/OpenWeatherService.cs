// <copyright file="OpenWeatherService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentValidation;
using Microsoft.Extensions.Logging;
using SeventySix.BusinessLogic.Interfaces;
using SeventySix.Core.DTOs.OpenWeather;
using SeventySix.Core.DTOs.Requests;
using SeventySix.Core.Exceptions;
using SeventySix.Core.Interfaces;

namespace SeventySix.BusinessLogic.Services;

/// <summary>
/// OpenWeather business logic service implementation.
/// </summary>
/// <remarks>
/// Orchestrates weather data operations with validation, error handling, and business rules.
///
/// Design Patterns:
/// - Facade: Simplifies complex OpenWeather API operations
/// - Service Layer: Encapsulates business logic
///
/// SOLID Principles:
/// - SRP: Only responsible for weather business logic
/// - DIP: Depends on abstractions (IOpenWeatherApiClient, IValidator)
/// - OCP: Open for extension (new weather operations)
///
/// Business Rules:
/// - All requests are validated before API calls
/// - Rate limiting is enforced (1000 calls/day)
/// - Responses are cached for 5 minutes
/// - Stale cached data is returned on API failures
/// </remarks>
public class OpenWeatherService : IOpenWeatherService
{
	private readonly IOpenWeatherApiClient ApiClient;
	private readonly IValidator<WeatherRequest> WeatherRequestValidator;
	private readonly IValidator<HistoricalWeatherRequest> HistoricalRequestValidator;
	private readonly IRateLimitingService RateLimitingService;
	private readonly ILogger<OpenWeatherService> Logger;

	/// <summary>
	/// Initializes a new instance of the <see cref="OpenWeatherService"/> class.
	/// </summary>
	/// <param name="apiClient">OpenWeather API client.</param>
	/// <param name="weatherRequestValidator">Weather request validator.</param>
	/// <param name="historicalRequestValidator">Historical request validator.</param>
	/// <param name="rateLimitingService">Rate limiting service.</param>
	/// <param name="logger">Logger instance.</param>
	public OpenWeatherService(
		IOpenWeatherApiClient apiClient,
		IValidator<WeatherRequest> weatherRequestValidator,
		IValidator<HistoricalWeatherRequest> historicalRequestValidator,
		IRateLimitingService rateLimitingService,
		ILogger<OpenWeatherService> logger)
	{
		ApiClient = apiClient ?? throw new ArgumentNullException(nameof(apiClient));
		WeatherRequestValidator = weatherRequestValidator ?? throw new ArgumentNullException(nameof(weatherRequestValidator));
		HistoricalRequestValidator = historicalRequestValidator ?? throw new ArgumentNullException(nameof(historicalRequestValidator));
		RateLimitingService = rateLimitingService ?? throw new ArgumentNullException(nameof(rateLimitingService));
		Logger = logger ?? throw new ArgumentNullException(nameof(logger));
	}

	/// <inheritdoc/>
	public async Task<CurrentWeather?> GetCurrentWeatherAsync(
		WeatherRequest request,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(request);

		// Validate request
		await WeatherRequestValidator.ValidateAndThrowAsync(request, cancellationToken);

		Logger.LogInformation(
			"Getting current weather for coordinates: ({Latitude}, {Longitude})",
			request.Latitude,
			request.Longitude);

		try
		{
			// Set exclude to only get current weather
			var modifiedRequest = new WeatherRequest
			{
				Latitude = request.Latitude,
				Longitude = request.Longitude,
				Units = request.Units,
				Language = request.Language,
				Exclude = "minutely,hourly,daily,alerts",
			};
			OneCallResponse? response = await ApiClient.GetOneCallDataAsync(modifiedRequest, cancellationToken);

			return response?.Current;
		}
		catch (Exception ex)
		{
			Logger.LogError(ex, "Failed to get current weather for ({Latitude}, {Longitude})", request.Latitude, request.Longitude);
			throw new ExternalServiceException("Failed to retrieve current weather data", ex);
		}
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<HourlyForecast>> GetHourlyForecastAsync(
		WeatherRequest request,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(request);

		await WeatherRequestValidator.ValidateAndThrowAsync(request, cancellationToken);

		Logger.LogInformation(
			"Getting hourly forecast for coordinates: ({Latitude}, {Longitude})",
			request.Latitude,
			request.Longitude);

		try
		{
			// Set exclude to only get hourly forecast
			var modifiedRequest = new WeatherRequest
			{
				Latitude = request.Latitude,
				Longitude = request.Longitude,
				Units = request.Units,
				Language = request.Language,
				Exclude = "current,minutely,daily,alerts",
			};
			OneCallResponse? response = await ApiClient.GetOneCallDataAsync(modifiedRequest, cancellationToken);

			return response?.Hourly ?? Enumerable.Empty<HourlyForecast>();
		}
		catch (Exception ex)
		{
			Logger.LogError(ex, "Failed to get hourly forecast for ({Latitude}, {Longitude})", request.Latitude, request.Longitude);
			throw new ExternalServiceException("Failed to retrieve hourly forecast data", ex);
		}
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<DailyForecast>> GetDailyForecastAsync(
		WeatherRequest request,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(request);

		await WeatherRequestValidator.ValidateAndThrowAsync(request, cancellationToken);

		Logger.LogInformation(
			"Getting daily forecast for coordinates: ({Latitude}, {Longitude})",
			request.Latitude,
			request.Longitude);

		try
		{
			// Set exclude to only get daily forecast
			var modifiedRequest = new WeatherRequest
			{
				Latitude = request.Latitude,
				Longitude = request.Longitude,
				Units = request.Units,
				Language = request.Language,
				Exclude = "current,minutely,hourly,alerts",
			};
			OneCallResponse? response = await ApiClient.GetOneCallDataAsync(modifiedRequest, cancellationToken);

			return response?.Daily ?? Enumerable.Empty<DailyForecast>();
		}
		catch (Exception ex)
		{
			Logger.LogError(ex, "Failed to get daily forecast for ({Latitude}, {Longitude})", request.Latitude, request.Longitude);
			throw new ExternalServiceException("Failed to retrieve daily forecast data", ex);
		}
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<WeatherAlert>> GetWeatherAlertsAsync(
		WeatherRequest request,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(request);

		await WeatherRequestValidator.ValidateAndThrowAsync(request, cancellationToken);

		Logger.LogInformation(
			"Getting weather alerts for coordinates: ({Latitude}, {Longitude})",
			request.Latitude,
			request.Longitude);

		try
		{
			// Set exclude to only get alerts
			var modifiedRequest = new WeatherRequest
			{
				Latitude = request.Latitude,
				Longitude = request.Longitude,
				Units = request.Units,
				Language = request.Language,
				Exclude = "current,minutely,hourly,daily",
			};
			OneCallResponse? response = await ApiClient.GetOneCallDataAsync(modifiedRequest, cancellationToken);

			return response?.Alerts ?? Enumerable.Empty<WeatherAlert>();
		}
		catch (Exception ex)
		{
			Logger.LogError(ex, "Failed to get weather alerts for ({Latitude}, {Longitude})", request.Latitude, request.Longitude);
			throw new ExternalServiceException("Failed to retrieve weather alerts", ex);
		}
	}

	/// <inheritdoc/>
	public async Task<OneCallResponse?> GetCompleteWeatherDataAsync(
		WeatherRequest request,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(request);

		await WeatherRequestValidator.ValidateAndThrowAsync(request, cancellationToken);

		Logger.LogInformation(
			"Getting complete weather data for coordinates: ({Latitude}, {Longitude})",
			request.Latitude,
			request.Longitude);

		try
		{
			return await ApiClient.GetOneCallDataAsync(request, cancellationToken);
		}
		catch (Exception ex)
		{
			Logger.LogError(ex, "Failed to get complete weather data for ({Latitude}, {Longitude})", request.Latitude, request.Longitude);
			throw new ExternalServiceException("Failed to retrieve complete weather data", ex);
		}
	}

	/// <inheritdoc/>
	public async Task<OneCallResponse?> GetHistoricalWeatherAsync(
		HistoricalWeatherRequest request,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(request);

		await HistoricalRequestValidator.ValidateAndThrowAsync(request, cancellationToken);

		var requestedDate = DateTimeOffset.FromUnixTimeSeconds(request.Timestamp).UtcDateTime;
		Logger.LogInformation(
			"Getting historical weather for coordinates: ({Latitude}, {Longitude}) at {Date:yyyy-MM-dd HH:mm:ss} UTC",
			request.Latitude,
			request.Longitude,
			requestedDate);

		try
		{
			return await ApiClient.GetHistoricalDataAsync(request, cancellationToken);
		}
		catch (Exception ex)
		{
			Logger.LogError(
				ex,
				"Failed to get historical weather for ({Latitude}, {Longitude}) at {Date}",
				request.Latitude,
				request.Longitude,
				requestedDate);
			throw new ExternalServiceException("Failed to retrieve historical weather data", ex);
		}
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<MinutelyForecast>> GetMinutelyForecastAsync(
		WeatherRequest request,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(request);

		await WeatherRequestValidator.ValidateAndThrowAsync(request, cancellationToken);

		Logger.LogInformation(
			"Getting minutely forecast for coordinates: ({Latitude}, {Longitude})",
			request.Latitude,
			request.Longitude);

		try
		{
			// Set exclude to only get minutely forecast
			var modifiedRequest = new WeatherRequest
			{
				Latitude = request.Latitude,
				Longitude = request.Longitude,
				Units = request.Units,
				Language = request.Language,
				Exclude = "current,hourly,daily,alerts",
			};
			OneCallResponse? response = await ApiClient.GetOneCallDataAsync(modifiedRequest, cancellationToken);

			return response?.Minutely ?? Enumerable.Empty<MinutelyForecast>();
		}
		catch (Exception ex)
		{
			Logger.LogError(ex, "Failed to get minutely forecast for ({Latitude}, {Longitude})", request.Latitude, request.Longitude);
			throw new ExternalServiceException("Failed to retrieve minutely forecast data", ex);
		}
	}

	/// <inheritdoc/>
	public bool CanMakeApiCall()
	{
		return ApiClient.CanMakeRequest();
	}

	/// <inheritdoc/>
	public int GetRemainingApiQuota()
	{
		return ApiClient.GetRemainingQuota();
	}

	/// <inheritdoc/>
	public TimeSpan GetTimeUntilReset()
	{
		return RateLimitingService.GetTimeUntilReset();
	}
}
