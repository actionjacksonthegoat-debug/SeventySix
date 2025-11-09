// <copyright file="WeatherForecastDto.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Application.DTOs;

/// <summary>
/// Weather forecast data transfer object.
/// Used for API responses to separate domain from presentation.
/// </summary>
public record WeatherForecastDto
{
	/// <summary>
	/// Gets forecast date.
	/// </summary>
	public DateOnly Date
	{
		get; init;
	}

	/// <summary>
	/// Gets temperature in Celsius.
	/// </summary>
	public int TemperatureC
	{
		get; init;
	}

	/// <summary>
	/// Gets temperature in Fahrenheit.
	/// </summary>
	public int TemperatureF
	{
		get; init;
	}

	/// <summary>
	/// Gets weather summary.
	/// </summary>
	public string? Summary
	{
		get; init;
	}
}
