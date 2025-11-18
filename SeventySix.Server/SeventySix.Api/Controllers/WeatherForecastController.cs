// <copyright file="WeatherForecastController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using SeventySix.Api.Attributes;
using SeventySix.Api.Configuration;
using SeventySix.Application.Interfaces;
using SeventySix.Application.DTOs.OpenWeather;
using SeventySix.Application.DTOs.OpenWeather.Common;
using SeventySix.Application.DTOs.Requests;

namespace SeventySix.Api.Controllers;

/// <summary>
/// Weather forecast API endpoints using OpenWeather One Call API 3.0.
/// </summary>
/// <remarks>
/// Provides RESTful operations for weather data including:
/// - Current weather conditions
/// - Hourly forecasts (48 hours)
/// - Daily forecasts (8 days)
/// - Minute-by-minute precipitation (1 hour)
/// - Government weather alerts
/// - Historical weather data (last 5 days)
///
/// All endpoints implement:
/// - Input validation (FluentValidation)
/// - Response caching (5 minute default)
/// - Rate limiting (1000 calls/day)
/// - Proper HTTP status codes
/// - ProblemDetails for errors (RFC 7807)
///
/// Design Patterns:
/// - Thin Controller: Delegates to service layer
/// - RESTful API: Resource-based endpoints
/// - Dependency Injection: Services injected via constructor
/// - Attribute-based Configuration: Uses [RateLimit], [OutputCache] for per-endpoint control
/// </remarks>
/// <remarks>
/// Initializes a new instance of the <see cref="WeatherForecastController"/> class.
/// </remarks>
/// <param name="weatherService">OpenWeather service for business logic.</param>
/// <param name="logger">Logger instance.</param>
[ApiController]
[Route(ApiVersionConfig.VersionedRoutePrefix + "/weather")]
[RateLimit(MaxRequests = 100, WindowSeconds = 86400)] // Weather API: 100 req/day
public class WeatherForecastController(
	IOpenWeatherService weatherService) : ControllerBase
{
	/// <summary>
	/// Gets current weather conditions for a location.
	/// </summary>
	/// <param name="latitude">Latitude (-90 to 90).</param>
	/// <param name="longitude">Longitude (-180 to 180).</param>
	/// <param name="units">Units system (metric, imperial, standard). Default: metric.</param>
	/// <param name="language">Language code (ISO 639-1). Default: en.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Current weather data.</returns>
	/// <response code="200">Returns current weather data.</response>
	/// <response code="400">Invalid request parameters.</response>
	/// <response code="429">Rate limit exceeded (1000 calls/day).</response>
	/// <response code="503">External service unavailable.</response>
	/// <remarks>
	/// Sample request:
	///
	///     GET /api/v1/weather/current?latitude=40.7128&amp;longitude=-74.0060&amp;units=metric
	///
	/// Response is cached for 5 minutes.
	/// </remarks>
	[HttpGet("current", Name = "GetCurrentWeather")]
	[ProducesResponseType(typeof(CurrentWeather), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status429TooManyRequests)]
	[ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
	[OutputCache(PolicyName = "weather")]
	public async Task<ActionResult<CurrentWeather>> GetCurrentWeatherAsync(
		[FromQuery] double latitude,
		[FromQuery] double longitude,
		[FromQuery] Units units = Units.Metric,
		[FromQuery] string language = "en",
		CancellationToken cancellationToken = default)
	{
		WeatherRequest request = new()
		{
			Latitude = latitude,
			Longitude = longitude,
			Units = units,
			Language = language,
		};

		CurrentWeather? result = await weatherService.GetCurrentWeatherAsync(request, cancellationToken);

		return result is null ?
			(ActionResult<CurrentWeather>)NotFound(new
			{
				message = "Weather data not available for this location"
			})
			: (ActionResult<CurrentWeather>)Ok(result);
	}

	/// <summary>
	/// Gets hourly weather forecast for the next 48 hours.
	/// </summary>
	/// <param name="latitude">Latitude (-90 to 90).</param>
	/// <param name="longitude">Longitude (-180 to 180).</param>
	/// <param name="units">Units system. Default: metric.</param>
	/// <param name="language">Language code. Default: en.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>List of hourly forecasts.</returns>
	/// <response code="200">Returns hourly forecast data.</response>
	/// <response code="400">Invalid request parameters.</response>
	/// <response code="429">Rate limit exceeded.</response>
	/// <remarks>
	/// Sample request:
	///
	///     GET /api/v1/weather/hourly?latitude=40.7128&amp;longitude=-74.0060
	///
	/// Returns 48 hours of hourly forecasts.
	/// </remarks>
	[HttpGet("hourly", Name = "GetHourlyForecast")]
	[ProducesResponseType(typeof(IEnumerable<HourlyForecast>), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status429TooManyRequests)]
	[OutputCache(PolicyName = "weather")]
	public async Task<ActionResult<IEnumerable<HourlyForecast>>> GetHourlyForecastAsync(
		[FromQuery] double latitude,
		[FromQuery] double longitude,
		[FromQuery] Units units = Units.Metric,
		[FromQuery] string language = "en",
		CancellationToken cancellationToken = default)
	{
		WeatherRequest request = new()
		{
			Latitude = latitude,
			Longitude = longitude,
			Units = units,
			Language = language,
		};

		IEnumerable<HourlyForecast> result = await weatherService.GetHourlyForecastAsync(request, cancellationToken);
		return Ok(result);
	}

	/// <summary>
	/// Gets daily weather forecast for the next 8 days.
	/// </summary>
	/// <param name="latitude">Latitude (-90 to 90).</param>
	/// <param name="longitude">Longitude (-180 to 180).</param>
	/// <param name="units">Units system. Default: metric.</param>
	/// <param name="language">Language code. Default: en.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>List of daily forecasts.</returns>
	/// <response code="200">Returns daily forecast data.</response>
	/// <response code="400">Invalid request parameters.</response>
	/// <response code="429">Rate limit exceeded.</response>
	/// <remarks>
	/// Sample request:
	///
	///     GET /api/v1/weather/daily?latitude=40.7128&amp;longitude=-74.0060
	///
	/// Returns 8 days of daily forecasts including min/max temperatures, conditions, and more.
	/// </remarks>
	[HttpGet("daily", Name = "GetDailyForecast")]
	[ProducesResponseType(typeof(IEnumerable<DailyForecast>), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status429TooManyRequests)]
	[OutputCache(PolicyName = "weather")]
	public async Task<ActionResult<IEnumerable<DailyForecast>>> GetDailyForecastAsync(
		[FromQuery] double latitude,
		[FromQuery] double longitude,
		[FromQuery] Units units = Units.Metric,
		[FromQuery] string language = "en",
		CancellationToken cancellationToken = default)
	{
		WeatherRequest request = new()
		{
			Latitude = latitude,
			Longitude = longitude,
			Units = units,
			Language = language,
		};

		IEnumerable<DailyForecast> result = await weatherService.GetDailyForecastAsync(request, cancellationToken);
		return Ok(result);
	}

	/// <summary>
	/// Gets minute-by-minute precipitation forecast for the next hour.
	/// </summary>
	/// <param name="latitude">Latitude (-90 to 90).</param>
	/// <param name="longitude">Longitude (-180 to 180).</param>
	/// <param name="units">Units system. Default: metric.</param>
	/// <param name="language">Language code. Default: en.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>List of minutely precipitation forecasts.</returns>
	/// <response code="200">Returns minutely precipitation data.</response>
	/// <response code="400">Invalid request parameters.</response>
	/// <response code="404">Minutely forecast not available for this location.</response>
	/// <remarks>
	/// Sample request:
	///
	///     GET /api/v1/weather/minutely?latitude=40.7128&amp;longitude=-74.0060
	///
	/// Note: Minutely forecast is only available for certain geographic areas.
	/// Returns empty list if not available.
	/// </remarks>
	[HttpGet("minutely", Name = "GetMinutelyForecast")]
	[ProducesResponseType(typeof(IEnumerable<MinutelyForecast>), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[OutputCache(PolicyName = "weather")]
	public async Task<ActionResult<IEnumerable<MinutelyForecast>>> GetMinutelyForecastAsync(
		[FromQuery] double latitude,
		[FromQuery] double longitude,
		[FromQuery] Units units = Units.Metric,
		[FromQuery] string language = "en",
		CancellationToken cancellationToken = default)
	{
		WeatherRequest request = new()
		{
			Latitude = latitude,
			Longitude = longitude,
			Units = units,
			Language = language,
		};

		IEnumerable<MinutelyForecast> result = await weatherService.GetMinutelyForecastAsync(request, cancellationToken);
		return Ok(result);
	}

	/// <summary>
	/// Gets government weather alerts for a location.
	/// </summary>
	/// <param name="latitude">Latitude (-90 to 90).</param>
	/// <param name="longitude">Longitude (-180 to 180).</param>
	/// <param name="language">Language code. Default: en.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>List of active weather alerts.</returns>
	/// <response code="200">Returns weather alerts (empty list if none).</response>
	/// <response code="400">Invalid request parameters.</response>
	/// <remarks>
	/// Sample request:
	///
	///     GET /api/v1/weather/alerts?latitude=40.7128&amp;longitude=-74.0060
	///
	/// Returns government-issued weather alerts (warnings, watches, advisories).
	/// Returns empty list if no active alerts.
	/// </remarks>
	[HttpGet("alerts", Name = "GetWeatherAlerts")]
	[ProducesResponseType(typeof(IEnumerable<WeatherAlert>), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[OutputCache(PolicyName = "weather")]
	public async Task<ActionResult<IEnumerable<WeatherAlert>>> GetWeatherAlertsAsync(
		[FromQuery] double latitude,
		[FromQuery] double longitude,
		[FromQuery] string language = "en",
		CancellationToken cancellationToken = default)
	{
		WeatherRequest request = new()
		{
			Latitude = latitude,
			Longitude = longitude,
			Language = language,
		};

		IEnumerable<WeatherAlert> result = await weatherService.GetWeatherAlertsAsync(request, cancellationToken);
		return Ok(result);
	}

	/// <summary>
	/// Gets complete weather data (current, forecasts, alerts) in one call.
	/// </summary>
	/// <param name="latitude">Latitude (-90 to 90).</param>
	/// <param name="longitude">Longitude (-180 to 180).</param>
	/// <param name="units">Units system. Default: metric.</param>
	/// <param name="language">Language code. Default: en.</param>
	/// <param name="exclude">Optional comma-separated list to exclude: current,minutely,hourly,daily,alerts.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Complete One Call API response.</returns>
	/// <response code="200">Returns complete weather data.</response>
	/// <response code="400">Invalid request parameters.</response>
	/// <response code="429">Rate limit exceeded.</response>
	/// <remarks>
	/// Sample request:
	///
	///     GET /api/weatherforecast?latitude=40.7128&amp;longitude=-74.0060&amp;exclude=minutely
	///
	/// This is the most efficient endpoint if you need multiple data types.
	/// Use the 'exclude' parameter to omit data you don't need.
	/// </remarks>
	[HttpGet(Name = "GetCompleteWeatherData")]
	[ProducesResponseType(typeof(OneCallResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status429TooManyRequests)]
	[OutputCache(PolicyName = "weather")]
	public async Task<ActionResult<OneCallResponse>> GetCompleteWeatherDataAsync(
		[FromQuery] double latitude,
		[FromQuery] double longitude,
		[FromQuery] Units units = Units.Metric,
		[FromQuery] string language = "en",
		[FromQuery] string? exclude = null,
		CancellationToken cancellationToken = default)
	{
		WeatherRequest request = new()
		{
			Latitude = latitude,
			Longitude = longitude,
			Units = units,
			Language = language,
			Exclude = exclude,
		};

		OneCallResponse? result = await weatherService.GetCompleteWeatherDataAsync(request, cancellationToken);

		return result is null
			? (ActionResult<OneCallResponse>)NotFound(new
			{
				message = "Weather data not available"
			})
			: (ActionResult<OneCallResponse>)Ok(result);
	}

	/// <summary>
	/// Gets historical weather data for a specific date/time (last 5 days).
	/// </summary>
	/// <param name="latitude">Latitude (-90 to 90).</param>
	/// <param name="longitude">Longitude (-180 to 180).</param>
	/// <param name="timestamp">Unix UTC timestamp for the historical data.</param>
	/// <param name="units">Units system. Default: metric.</param>
	/// <param name="language">Language code. Default: en.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Historical weather data.</returns>
	/// <response code="200">Returns historical weather data.</response>
	/// <response code="400">Invalid parameters or timestamp outside 5-day range.</response>
	/// <response code="429">Rate limit exceeded.</response>
	/// <remarks>
	/// Sample request:
	///
	///     GET /api/v1/weather/historical?latitude=40.7128&amp;longitude=-74.0060&amp;timestamp=1699632000
	///
	/// Historical data is available for the last 5 days only.
	/// </remarks>
	[HttpGet("historical", Name = "GetHistoricalWeather")]
	[ProducesResponseType(typeof(OneCallResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status429TooManyRequests)]
	[OutputCache(PolicyName = "weather")]
	public async Task<ActionResult<OneCallResponse>> GetHistoricalWeatherAsync(
		[FromQuery] double latitude,
		[FromQuery] double longitude,
		[FromQuery] long timestamp,
		[FromQuery] Units units = Units.Metric,
		[FromQuery] string language = "en",
		CancellationToken cancellationToken = default)
	{
		HistoricalWeatherRequest request = new()
		{
			Latitude = latitude,
			Longitude = longitude,
			Timestamp = timestamp,
			Units = units,
			Language = language,
		};

		OneCallResponse? result = await weatherService.GetHistoricalWeatherAsync(request, cancellationToken);

		return result is null
			? (ActionResult<OneCallResponse>)NotFound(new
			{
				message = "Historical weather data not available"
			})
			: (ActionResult<OneCallResponse>)Ok(result);
	}

	/// <summary>
	/// Gets API usage information (rate limit status).
	/// </summary>
	/// <returns>API quota information.</returns>
	/// <response code="200">Returns API quota status.</response>
	/// <remarks>
	/// Sample request:
	///
	///     GET /api/v1/weather/quota
	///
	/// Use this endpoint to check remaining API calls and reset time.
	/// </remarks>
	[HttpGet("quota", Name = "GetApiQuota")]
	[ProducesResponseType(StatusCodes.Status200OK)]
	public async Task<ActionResult<object>> GetApiQuotaAsync()
	{
		int remaining = await weatherService.GetRemainingApiQuotaAsync();
		bool canMakeCall = await weatherService.CanMakeApiCallAsync();
		TimeSpan resetTime = weatherService.GetTimeUntilReset();

		return Ok(new
		{
			remainingCalls = remaining,
			canMakeCall,
			resetsIn = new
			{
				hours = (int)resetTime.TotalHours,
				minutes = resetTime.Minutes,
				seconds = resetTime.Seconds,
				totalSeconds = (int)resetTime.TotalSeconds,
			},
			resetTime = DateTime.UtcNow.Add(resetTime),
		});
	}
}
