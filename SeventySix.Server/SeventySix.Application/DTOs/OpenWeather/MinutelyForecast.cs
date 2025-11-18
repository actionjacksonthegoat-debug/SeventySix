// <copyright file="MinutelyForecast.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Text.Json.Serialization;

namespace SeventySix.Application.DTOs.OpenWeather;

/// <summary>
/// Minute-by-minute precipitation forecast for the next hour.
/// </summary>
public class MinutelyForecast
{
	/// <summary>
	/// Gets or sets the forecast time (Unix UTC) - used for JSON deserialization.
	/// </summary>
	[JsonPropertyName("dt")]
	[JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
	internal long Timestamp
	{
		get; set;
	}

	/// <summary>
	/// Gets the forecast time as DateTime (UTC).
	/// </summary>
	public DateTime DateTime => DateTimeOffset.FromUnixTimeSeconds(Timestamp).UtcDateTime;

	/// <summary>
	/// Gets or sets the precipitation volume (mm).
	/// </summary>
	[JsonPropertyName("precipitation")]
	public double Precipitation
	{
		get; set;
	}
}