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
/// - DIP: Depends on abstractions (IOpenWeatherapiClient, IValidator)
/// - OCP: Open for extension (new weather operations)
///
/// Business Rules:
/// - All requests are validated before API calls
/// - Rate limiting is enforced (1000 calls/day)
/// - Responses are cached for 5 minutes
/// - Stale cached data is returned on API failures
/// </remarks>
/// <remarks>
/// Initializes a new instance of the <see cref="OpenWeatherService"/> class.
/// </remarks>
/// <param name="apiClient">OpenWeather API client.</param>
/// <param name="weatherRequestValidator">Weather request validator.</param>
/// <param name="historicalRequestValidator">Historical request validator.</param>
/// <param name="rateLimitingService">Rate limiting service.</param>
/// <param name="logger">Logger instance.</param>
public class OpenWeatherService(
	IOpenWeatherApiClient apiClient,
	IValidator<WeatherRequest> weatherRequestValidator,
	IValidator<HistoricalWeatherRequest> historicalRequestValidator,
	IRateLimitingService rateLimitingService,
	ILogger<OpenWeatherService> logger) : IOpenWeatherService
{
	/// <inheritdoc/>
	public async Task<CurrentWeather?> GetCurrentWeatherAsync(
		WeatherRequest request,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(request);

		// Validate request
		await weatherRequestValidator.ValidateAndThrowAsync(request, cancellationToken);

		try
		{
			// Set exclude to only get current weather
			WeatherRequest modifiedRequest = new()
			{
				Latitude = request.Latitude,
				Longitude = request.Longitude,
				Units = request.Units,
				Language = request.Language,
				Exclude = "minutely,hourly,daily,alerts",
			};
			OneCallResponse? response = await apiClient.GetOneCallDataAsync(modifiedRequest, cancellationToken);

			return response?.Current;
		}
		catch (Exception ex)
		{
			logger.LogError(ex,
				"Failed to retrieve current weather data for Lat: {Latitude}, Lon: {Longitude}, Units: {Units}",
				request.Latitude, request.Longitude, request.Units);
			throw new ExternalServiceException("Failed to retrieve current weather data", ex);
		}
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<HourlyForecast>> GetHourlyForecastAsync(
		WeatherRequest request,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(request);

		await weatherRequestValidator.ValidateAndThrowAsync(request, cancellationToken);

		try
		{
			// Set exclude to only get hourly forecast
			WeatherRequest modifiedRequest = new()
			{
				Latitude = request.Latitude,
				Longitude = request.Longitude,
				Units = request.Units,
				Language = request.Language,
				Exclude = "current,minutely,daily,alerts",
			};
			OneCallResponse? response = await apiClient.GetOneCallDataAsync(modifiedRequest, cancellationToken);

			return response?.Hourly ?? Enumerable.Empty<HourlyForecast>();
		}
		catch (Exception ex)
		{
			logger.LogError(ex,
				"Failed to retrieve hourly forecast for Lat: {Latitude}, Lon: {Longitude}",
				request.Latitude, request.Longitude);
			throw new ExternalServiceException("Failed to retrieve hourly forecast data", ex);
		}
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<DailyForecast>> GetDailyForecastAsync(
		WeatherRequest request,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(request);

		await weatherRequestValidator.ValidateAndThrowAsync(request, cancellationToken);

		try
		{
			// Set exclude to only get daily forecast
			WeatherRequest modifiedRequest = new()
			{
				Latitude = request.Latitude,
				Longitude = request.Longitude,
				Units = request.Units,
				Language = request.Language,
				Exclude = "current,minutely,hourly,alerts",
			};
			OneCallResponse? response = await apiClient.GetOneCallDataAsync(modifiedRequest, cancellationToken);

			return response?.Daily ?? Enumerable.Empty<DailyForecast>();
		}
		catch (Exception ex)
		{
			logger.LogError(ex,
				"Failed to retrieve daily forecast for Lat: {Latitude}, Lon: {Longitude}",
				request.Latitude, request.Longitude);
			throw new ExternalServiceException("Failed to retrieve daily forecast data", ex);
		}
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<WeatherAlert>> GetWeatherAlertsAsync(
		WeatherRequest request,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(request);

		await weatherRequestValidator.ValidateAndThrowAsync(request, cancellationToken);

		try
		{
			// Set exclude to only get alerts
			WeatherRequest modifiedRequest = new()
			{
				Latitude = request.Latitude,
				Longitude = request.Longitude,
				Units = request.Units,
				Language = request.Language,
				Exclude = "current,minutely,hourly,daily",
			};
			OneCallResponse? response = await apiClient.GetOneCallDataAsync(modifiedRequest, cancellationToken);

			return response?.Alerts ?? Enumerable.Empty<WeatherAlert>();
		}
		catch (Exception ex)
		{
			logger.LogError(ex,
				"Failed to retrieve weather alerts for Lat: {Latitude}, Lon: {Longitude}",
				request.Latitude, request.Longitude);
			throw new ExternalServiceException("Failed to retrieve weather alerts", ex);
		}
	}

	/// <inheritdoc/>
	public async Task<OneCallResponse?> GetCompleteWeatherDataAsync(
		WeatherRequest request,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(request);

		await weatherRequestValidator.ValidateAndThrowAsync(request, cancellationToken);

		try
		{
			return await apiClient.GetOneCallDataAsync(request, cancellationToken);
		}
		catch (Exception ex)
		{
			logger.LogError(ex,
				"Failed to retrieve complete weather data for Lat: {Latitude}, Lon: {Longitude}, Exclude: {Exclude}",
				request.Latitude, request.Longitude, request.Exclude ?? "none");
			throw new ExternalServiceException("Failed to retrieve complete weather data", ex);
		}
	}

	/// <inheritdoc/>
	public async Task<OneCallResponse?> GetHistoricalWeatherAsync(
		HistoricalWeatherRequest request,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(request);

		await historicalRequestValidator.ValidateAndThrowAsync(request, cancellationToken);

		try
		{
			return await apiClient.GetHistoricalDataAsync(request, cancellationToken);
		}
		catch (Exception ex)
		{
			logger.LogError(ex,
				"Failed to retrieve historical weather for Lat: {Latitude}, Lon: {Longitude}, Timestamp: {Timestamp}",
				request.Latitude, request.Longitude, request.Timestamp);
			throw new ExternalServiceException("Failed to retrieve historical weather data", ex);
		}
	}

	/// <inheritdoc/>
	public async Task<IEnumerable<MinutelyForecast>> GetMinutelyForecastAsync(
		WeatherRequest request,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(request);

		await weatherRequestValidator.ValidateAndThrowAsync(request, cancellationToken);

		try
		{
			// Set exclude to only get minutely forecast
			WeatherRequest modifiedRequest = new()
			{
				Latitude = request.Latitude,
				Longitude = request.Longitude,
				Units = request.Units,
				Language = request.Language,
				Exclude = "current,hourly,daily,alerts",
			};
			OneCallResponse? response = await apiClient.GetOneCallDataAsync(modifiedRequest, cancellationToken);

			return response?.Minutely ?? Enumerable.Empty<MinutelyForecast>();
		}
		catch (Exception ex)
		{
			logger.LogError(ex,
				"Failed to retrieve minutely forecast for Lat: {Latitude}, Lon: {Longitude}",
				request.Latitude, request.Longitude);
			throw new ExternalServiceException("Failed to retrieve minutely forecast data", ex);
		}
	}

	/// <inheritdoc/>
	public async Task<bool> CanMakeApiCallAsync(CancellationToken cancellationToken = default) => await apiClient.CanMakeRequestAsync(cancellationToken);

	/// <inheritdoc/>
	public async Task<int> GetRemainingApiQuotaAsync(CancellationToken cancellationToken = default) => await apiClient.GetRemainingQuotaAsync(cancellationToken);

	/// <inheritdoc/>
	public TimeSpan GetTimeUntilReset() => rateLimitingService.GetTimeUntilReset();
}