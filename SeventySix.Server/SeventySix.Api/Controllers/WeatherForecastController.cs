// <copyright file="WeatherForecastController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using SeventySix.BusinessLogic.DTOs;
using SeventySix.BusinessLogic.DTOs.Requests;
using SeventySix.BusinessLogic.Interfaces;

namespace SeventySix.Api.Controllers;

/// <summary>
/// Weather forecast API endpoints.
/// Provides RESTful operations for managing weather forecast data.
/// </summary>
/// <remarks>
/// This controller implements the Service Layer pattern, delegating business logic
/// to IWeatherForecastService while handling HTTP concerns.
///
/// All endpoints return:
/// - Proper HTTP status codes (200, 201, 400, 404, 500)
/// - ProblemDetails for errors (RFC 7807)
/// - Appropriate response caching headers
///
/// Design Patterns:
/// - Dependency Injection: Services injected via constructor
/// - Repository Pattern: Data access abstracted through service layer
/// - DTO Pattern: Domain models never exposed directly
/// </remarks>
[ApiController]
[Route("api/[controller]")]
public class WeatherForecastController : ControllerBase
{
	private readonly IWeatherForecastService WeatherService;
	private readonly ILogger<WeatherForecastController> Logger;

	/// <summary>
	/// Initializes a new instance of the <see cref="WeatherForecastController"/> class.
	/// </summary>
	/// <param name="weatherService">The weather forecast service for business logic operations.</param>
	/// <param name="logger">The logger instance for recording controller operations.</param>
	/// <exception cref="ArgumentNullException">Thrown when weatherService or logger is null.</exception>
	public WeatherForecastController(
		IWeatherForecastService weatherService,
		ILogger<WeatherForecastController> logger)
	{
		WeatherService = weatherService ?? throw new ArgumentNullException(nameof(weatherService));
		Logger = logger ?? throw new ArgumentNullException(nameof(logger));
	}

	/// <summary>
	/// Gets all weather forecasts.
	/// </summary>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>A list of all weather forecasts.</returns>
	/// <response code="200">Returns the list of weather forecasts.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	/// <remarks>
	/// Sample request:
	///
	///     GET /api/weatherforecast
	///
	/// Response is cached for 60 seconds to improve performance.
	/// </remarks>
	[HttpGet(Name = "GetWeatherForecasts")]
	[ProducesResponseType(typeof(IEnumerable<WeatherForecastDto>), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	[ResponseCache(Duration = 60, Location = ResponseCacheLocation.Any)]
	public async Task<ActionResult<IEnumerable<WeatherForecastDto>>> GetAllAsync(CancellationToken cancellationToken)
	{
		Logger.LogInformation("Getting all weather forecasts");
		var forecasts = await WeatherService.GetAllForecastsAsync(cancellationToken);
		return Ok(forecasts);
	}

	/// <summary>
	/// Gets a weather forecast by its identifier.
	/// </summary>
	/// <param name="id">The unique identifier of the forecast.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>The weather forecast if found; otherwise, 404 Not Found.</returns>
	/// <response code="200">Returns the weather forecast.</response>
	/// <response code="404">If the forecast is not found.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	/// <remarks>
	/// Sample request:
	///
	///     GET /api/weatherforecast/123
	///
	/// Response is cached for 60 seconds to improve performance.
	/// </remarks>
	[HttpGet("{id}", Name = "GetWeatherForecastById")]
	[ProducesResponseType(typeof(WeatherForecastDto), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	[ResponseCache(Duration = 60, Location = ResponseCacheLocation.Any)]
	public async Task<ActionResult<WeatherForecastDto>> GetByIdAsync(int id, CancellationToken cancellationToken)
	{
		Logger.LogInformation("Getting weather forecast with ID: {ForecastId}", id);
		var forecast = await WeatherService.GetForecastByIdAsync(id, cancellationToken);

		if (forecast is null)
		{
			Logger.LogWarning("Weather forecast with ID {ForecastId} not found", id);
			return NotFound();
		}

		return Ok(forecast);
	}

	/// <summary>
	/// Creates a new weather forecast.
	/// </summary>
	/// <param name="request">The forecast creation request containing forecast data.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>The created weather forecast with location header.</returns>
	/// <response code="201">Returns the newly created forecast.</response>
	/// <response code="400">If the request is invalid or validation fails.</response>
	/// <response code="422">If a business rule is violated.</response>
	/// <response code="500">If an unexpected error occurs.</response>
	/// <remarks>
	/// Sample request:
	///
	///     POST /api/weatherforecast
	///     {
	///        "date": "2025-11-10",
	///        "temperatureC": 25,
	///        "summary": "Warm and sunny"
	///     }
	///
	/// FluentValidation automatically validates the request before processing.
	/// Returns 201 Created with Location header pointing to the new resource.
	/// </remarks>
	[HttpPost(Name = "CreateWeatherForecast")]
	[ProducesResponseType(typeof(WeatherForecastDto), StatusCodes.Status201Created)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
	[ProducesResponseType(StatusCodes.Status500InternalServerError)]
	public async Task<ActionResult<WeatherForecastDto>> CreateAsync(
		[FromBody] CreateWeatherForecastRequest request,
		CancellationToken cancellationToken)
	{
		Logger.LogInformation("Creating new weather forecast");
		var forecast = await WeatherService.CreateForecastAsync(request, cancellationToken);
		return CreatedAtRoute("GetWeatherForecastById", new { id = forecast.Date.DayNumber }, forecast);
	}
}