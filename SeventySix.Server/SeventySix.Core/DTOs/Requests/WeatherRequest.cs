// <copyright file="WeatherRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Core.DTOs.OpenWeather.Common;

namespace SeventySix.Core.DTOs.Requests;

/// <summary>
/// Request model for weather data.
/// </summary>
public class WeatherRequest
{
	/// <summary>
	/// Gets or sets the latitude.
	/// </summary>
	/// <value>Range: -90 to 90 degrees.</value>
	public double Latitude
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the longitude.
	/// </summary>
	/// <value>Range: -180 to 180 degrees.</value>
	public double Longitude
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the units system.
	/// </summary>
	/// <value>Default: Metric</value>
	public Units Units { get; set; } = Units.Metric;

	/// <summary>
	/// Gets or sets the language code.
	/// </summary>
	/// <value>Default: en</value>
	public string Language { get; set; } = "en";

	/// <summary>
	/// Gets or sets optional data exclusions.
	/// </summary>
	/// <value>Comma-separated list: current,minutely,hourly,daily,alerts</value>
	public string? Exclude
	{
		get; set;
	}
}