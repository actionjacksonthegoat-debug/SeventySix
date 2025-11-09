// <copyright file="IWeatherForecastRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Domain.Entities;

namespace SeventySix.Domain.Interfaces;

/// <summary>
/// Repository interface for weather forecast data access.
/// Follows Repository pattern and Dependency Inversion Principle.
/// </summary>
public interface IWeatherForecastRepository
{
	/// <summary>
	/// Gets all weather forecasts.
	/// </summary>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Collection of weather forecasts.</returns>
	Task<IEnumerable<WeatherForecast>> GetAllAsync(CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets weather forecast by ID.
	/// </summary>
	/// <param name="id">Forecast identifier.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Weather forecast or null.</returns>
	Task<WeatherForecast?> GetByIdAsync(int id, CancellationToken cancellationToken = default);

	/// <summary>
	/// Creates new weather forecast.
	/// </summary>
	/// <param name="forecast">Forecast to create.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Created forecast.</returns>
	Task<WeatherForecast> CreateAsync(WeatherForecast forecast, CancellationToken cancellationToken = default);

	/// <summary>
	/// Updates existing weather forecast.
	/// </summary>
	/// <param name="forecast">Forecast to update.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Updated forecast.</returns>
	Task<WeatherForecast> UpdateAsync(WeatherForecast forecast, CancellationToken cancellationToken = default);

	/// <summary>
	/// Deletes weather forecast.
	/// </summary>
	/// <param name="id">Forecast identifier.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>True if deleted, false if not found.</returns>
	Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
}
