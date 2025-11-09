// <copyright file="IWeatherForecastService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Application.DTOs;
using SeventySix.Application.DTOs.Requests;

namespace SeventySix.Application.Interfaces;

/// <summary>
/// Weather forecast service interface.
/// Defines business logic operations for weather forecasts.
/// </summary>
public interface IWeatherForecastService
{
	/// <summary>
	/// Gets all weather forecasts.
	/// </summary>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Collection of weather forecast DTOs.</returns>
	Task<IEnumerable<WeatherForecastDto>> GetAllForecastsAsync(CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets weather forecast by ID.
	/// </summary>
	/// <param name="id">Forecast identifier.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Weather forecast DTO or null.</returns>
	Task<WeatherForecastDto?> GetForecastByIdAsync(int id, CancellationToken cancellationToken = default);

	/// <summary>
	/// Creates new weather forecast.
	/// </summary>
	/// <param name="request">Create request.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Created forecast DTO.</returns>
	Task<WeatherForecastDto> CreateForecastAsync(CreateWeatherForecastRequest request, CancellationToken cancellationToken = default);
}
