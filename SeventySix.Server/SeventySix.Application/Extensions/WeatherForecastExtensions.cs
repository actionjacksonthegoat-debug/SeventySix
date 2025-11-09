// <copyright file="WeatherForecastExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Application.DTOs;
using SeventySix.Application.DTOs.Requests;
using SeventySix.Domain.Entities;

namespace SeventySix.Application.Extensions;

/// <summary>
/// Extension methods for WeatherForecast entity mapping.
/// </summary>
public static class WeatherForecastExtensions
{
	/// <summary>
	/// Converts WeatherForecast entity to DTO.
	/// </summary>
	/// <param name="entity">The entity to convert.</param>
	/// <returns>WeatherForecastDto.</returns>
	public static WeatherForecastDto ToDto(this WeatherForecast entity)
	{
		ArgumentNullException.ThrowIfNull(entity);

		return new WeatherForecastDto
		{
			Date = entity.Date,
			TemperatureC = entity.TemperatureC,
			TemperatureF = entity.TemperatureF,
			Summary = entity.Summary,
		};
	}

	/// <summary>
	/// Converts collection of WeatherForecast entities to DTOs.
	/// </summary>
	/// <param name="entities">The entities to convert.</param>
	/// <returns>Collection of WeatherForecastDto.</returns>
	public static IEnumerable<WeatherForecastDto> ToDto(this IEnumerable<WeatherForecast> entities)
	{
		ArgumentNullException.ThrowIfNull(entities);

		return entities.Select(e => e.ToDto());
	}

	/// <summary>
	/// Converts CreateWeatherForecastRequest to entity.
	/// </summary>
	/// <param name="request">The request to convert.</param>
	/// <returns>WeatherForecast entity.</returns>
	public static WeatherForecast ToEntity(this CreateWeatherForecastRequest request)
	{
		ArgumentNullException.ThrowIfNull(request);

		return new WeatherForecast
		{
			Date = request.Date,
			TemperatureC = request.TemperatureC,
			Summary = request.Summary,
		};
	}
}
