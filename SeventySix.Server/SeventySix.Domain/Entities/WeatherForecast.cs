// <copyright file="WeatherForecast.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Domain.Entities;

/// <summary>
/// Weather forecast domain entity.
/// </summary>
public class WeatherForecast
{
	/// <summary>
	/// Gets or sets the forecast date.
	/// </summary>
	public DateOnly Date
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the temperature in Celsius.
	/// </summary>
	public int TemperatureC
	{
		get; set;
	}

	/// <summary>
	/// Gets the temperature in Fahrenheit.
	/// </summary>
	public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);

	/// <summary>
	/// Gets or sets the weather summary.
	/// </summary>
	public string? Summary
	{
		get; set;
	}
}
