// <copyright file="OneCallResponse.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Text.Json.Serialization;

namespace SeventySix.Application.DTOs.OpenWeather;

/// <summary>
/// Complete response from OpenWeather One Call API 3.0.
/// </summary>
/// <remarks>
/// Contains current weather, forecasts, and alerts for a specific location.
/// API documentation: https://openweathermap.org/api/one-call-3
/// </remarks>
public class OneCallResponse
{
	/// <summary>
	/// Gets or sets the latitude of the location.
	/// </summary>
	[JsonPropertyName("lat")]
	public double Latitude
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the longitude of the location.
	/// </summary>
	[JsonPropertyName("lon")]
	public double Longitude
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the timezone name.
	/// </summary>
	/// <value>Example: "America/New_York"</value>
	[JsonPropertyName("timezone")]
	public string Timezone { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the timezone offset from UTC (seconds).
	/// </summary>
	[JsonPropertyName("timezone_offset")]
	public int TimezoneOffset
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the current weather data.
	/// </summary>
	[JsonPropertyName("current")]
	public CurrentWeather? Current
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the minutely precipitation forecast (next hour).
	/// </summary>
	/// <remarks>
	/// Only available for locations where minute forecast is supported.
	/// </remarks>
	[JsonPropertyName("minutely")]
	public List<MinutelyForecast>? Minutely
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the hourly forecast (48 hours).
	/// </summary>
	[JsonPropertyName("hourly")]
	public List<HourlyForecast>? Hourly
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the daily forecast (8 days).
	/// </summary>
	[JsonPropertyName("daily")]
	public List<DailyForecast>? Daily
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the weather alerts.
	/// </summary>
	/// <remarks>
	/// Only present if there are active alerts for the location.
	/// </remarks>
	[JsonPropertyName("alerts")]
	public List<WeatherAlert>? Alerts
	{
		get; set;
	}
}