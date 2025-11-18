// <copyright file="DailyForecast.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Text.Json.Serialization;

namespace SeventySix.Application.DTOs.OpenWeather;

/// <summary>
/// Daily weather forecast (8 days).
/// </summary>
public class DailyForecast
{
	/// <summary>
	/// Gets or sets the forecast time (Unix UTC, midnight) - used for JSON deserialization.
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
	/// Gets or sets the sunrise time (Unix UTC) - used for JSON deserialization.
	/// </summary>
	[JsonPropertyName("sunrise")]
	[JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
	internal long SunriseTimestamp
	{
		get; set;
	}

	/// <summary>
	/// Gets the sunrise time as DateTime (UTC).
	/// </summary>
	public DateTime Sunrise => DateTimeOffset.FromUnixTimeSeconds(SunriseTimestamp).UtcDateTime;

	/// <summary>
	/// Gets or sets the sunset time (Unix UTC) - used for JSON deserialization.
	/// </summary>
	[JsonPropertyName("sunset")]
	[JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
	internal long SunsetTimestamp
	{
		get; set;
	}

	/// <summary>
	/// Gets the sunset time as DateTime (UTC).
	/// </summary>
	public DateTime Sunset => DateTimeOffset.FromUnixTimeSeconds(SunsetTimestamp).UtcDateTime;

	/// <summary>
	/// Gets or sets the moonrise time (Unix UTC) - used for JSON deserialization.
	/// </summary>
	[JsonPropertyName("moonrise")]
	[JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
	internal long MoonriseTimestamp
	{
		get; set;
	}

	/// <summary>
	/// Gets the moonrise time as DateTime (UTC).
	/// </summary>
	public DateTime Moonrise => DateTimeOffset.FromUnixTimeSeconds(MoonriseTimestamp).UtcDateTime;

	/// <summary>
	/// Gets or sets the moonset time (Unix UTC) - used for JSON deserialization.
	/// </summary>
	[JsonPropertyName("moonset")]
	[JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
	internal long MoonsetTimestamp
	{
		get; set;
	}

	/// <summary>
	/// Gets the moonset time as DateTime (UTC).
	/// </summary>
	public DateTime Moonset => DateTimeOffset.FromUnixTimeSeconds(MoonsetTimestamp).UtcDateTime;

	/// <summary>
	/// Gets or sets the moon phase (0-1).
	/// </summary>
	/// <value>
	/// 0 and 1 = new moon, 0.25 = first quarter, 0.5 = full moon, 0.75 = last quarter.
	/// </value>
	[JsonPropertyName("moon_phase")]
	public double MoonPhase
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the temperature throughout the day.
	/// </summary>
	[JsonPropertyName("temp")]
	public Temperature Temperature { get; set; } = new();

	/// <summary>
	/// Gets or sets the "feels like" temperature throughout the day.
	/// </summary>
	[JsonPropertyName("feels_like")]
	public FeelsLike FeelsLike { get; set; } = new();

	/// <summary>
	/// Gets or sets the atmospheric pressure (hPa).
	/// </summary>
	[JsonPropertyName("pressure")]
	public int Pressure
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the humidity percentage.
	/// </summary>
	[JsonPropertyName("humidity")]
	public int Humidity
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the dew point temperature.
	/// </summary>
	[JsonPropertyName("dew_point")]
	public double DewPoint
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the cloudiness percentage.
	/// </summary>
	[JsonPropertyName("clouds")]
	public int Clouds
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the UV index.
	/// </summary>
	[JsonPropertyName("uvi")]
	public double UvIndex
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the wind speed.
	/// </summary>
	[JsonPropertyName("wind_speed")]
	public double WindSpeed
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the wind direction (degrees).
	/// </summary>
	[JsonPropertyName("wind_deg")]
	public int WindDegrees
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the wind gust speed (optional).
	/// </summary>
	[JsonPropertyName("wind_gust")]
	public double? WindGust
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the probability of precipitation (0-1).
	/// </summary>
	[JsonPropertyName("pop")]
	public double PrecipitationProbability
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the rain volume (mm, optional).
	/// </summary>
	[JsonPropertyName("rain")]
	public double? Rain
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the snow volume (mm, optional).
	/// </summary>
	[JsonPropertyName("snow")]
	public double? Snow
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the weather conditions.
	/// </summary>
	[JsonPropertyName("weather")]
	public List<WeatherCondition> Weather { get; set; } = [];

	/// <summary>
	/// Gets or sets a summary of the day's weather.
	/// </summary>
	[JsonPropertyName("summary")]
	public string? Summary
	{
		get; set;
	}
}