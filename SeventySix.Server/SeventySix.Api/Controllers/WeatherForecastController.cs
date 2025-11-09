// <copyright file="WeatherForecastController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using SeventySix.Application.DTOs;
using SeventySix.Application.DTOs.Requests;
using SeventySix.Application.Interfaces;

namespace SeventySix.Api.Controllers;

/// <summary>
/// Weather forecast API endpoints.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class WeatherForecastController : ControllerBase
{
	private readonly IWeatherForecastService _weatherService;
	private readonly ILogger<WeatherForecastController> _logger;

	/// <summary>
	/// Initializes a new instance of the <see cref="WeatherForecastController"/> class.
	/// </summary>
	/// <param name="weatherService">Weather forecast service.</param>
	/// <param name="logger">Logger instance.</param>
	public WeatherForecastController(
		IWeatherForecastService weatherService,
		ILogger<WeatherForecastController> logger)
	{
		_weatherService = weatherService ?? throw new ArgumentNullException(nameof(weatherService));
		_logger = logger ?? throw new ArgumentNullException(nameof(logger));
	}

	/// <summary>
	/// Gets all weather forecasts.
	/// </summary>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>List of weather forecasts.</returns>
	[HttpGet(Name = "GetWeatherForecasts")]
	[ProducesResponseType(typeof(IEnumerable<WeatherForecastDto>), StatusCodes.Status200OK)]
	[ResponseCache(Duration = 60, Location = ResponseCacheLocation.Any)]
	public async Task<ActionResult<IEnumerable<WeatherForecastDto>>> GetAll(CancellationToken cancellationToken)
	{
		_logger.LogInformation("Getting all weather forecasts");
		var forecasts = await _weatherService.GetAllForecastsAsync(cancellationToken);
		return Ok(forecasts);
	}

	/// <summary>
	/// Gets weather forecast by ID.
	/// </summary>
	/// <param name="id">Forecast identifier.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Weather forecast or 404.</returns>
	[HttpGet("{id}", Name = "GetWeatherForecastById")]
	[ProducesResponseType(typeof(WeatherForecastDto), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	[ResponseCache(Duration = 60, Location = ResponseCacheLocation.Any)]
	public async Task<ActionResult<WeatherForecastDto>> GetById(int id, CancellationToken cancellationToken)
	{
		_logger.LogInformation("Getting weather forecast with ID: {ForecastId}", id);
		var forecast = await _weatherService.GetForecastByIdAsync(id, cancellationToken);

		if (forecast is null)
		{
			_logger.LogWarning("Weather forecast with ID {ForecastId} not found", id);
			return NotFound();
		}

		return Ok(forecast);
	}

	/// <summary>
	/// Creates new weather forecast.
	/// </summary>
	/// <param name="request">Create request.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Created forecast.</returns>
	[HttpPost(Name = "CreateWeatherForecast")]
	[ProducesResponseType(typeof(WeatherForecastDto), StatusCodes.Status201Created)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	public async Task<ActionResult<WeatherForecastDto>> Create(
		[FromBody] CreateWeatherForecastRequest request,
		CancellationToken cancellationToken)
	{
		_logger.LogInformation("Creating new weather forecast");
		var forecast = await _weatherService.CreateForecastAsync(request, cancellationToken);
		return CreatedAtRoute("GetWeatherForecastById", new { id = forecast.Date.DayNumber }, forecast);
	}
}
