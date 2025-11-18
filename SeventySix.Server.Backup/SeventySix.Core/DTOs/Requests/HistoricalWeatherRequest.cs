// <copyright file="HistoricalWeatherRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Core.DTOs.OpenWeather.Common;

namespace SeventySix.Core.DTOs.Requests;

/// <summary>
/// Request model for historical weather data (timemachine).
/// </summary>
public class HistoricalWeatherRequest
{
	/// <summary>
	/// Gets or sets the latitude.
	/// </summary>
	public double Latitude
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the longitude.
	/// </summary>
	public double Longitude
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the date/time for historical data (Unix UTC).
	/// </summary>
	/// <remarks>
	/// Available for the last 5 days.
	/// </remarks>
	public long Timestamp
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the units system.
	/// </summary>
	public Units Units { get; set; } = Units.Metric;

	/// <summary>
	/// Gets or sets the language code.
	/// </summary>
	public string Language { get; set; } = "en";
}