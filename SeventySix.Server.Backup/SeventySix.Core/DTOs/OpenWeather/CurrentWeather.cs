// <copyright file="CurrentWeather.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Text.Json.Serialization;

namespace SeventySix.Core.DTOs.OpenWeather;

/// <summary>
/// Current weather data from OpenWeather One Call API 3.0.
/// </summary>
public class CurrentWeather
{
	/// <summary>
	/// Gets or sets the current time (Unix UTC) - used for JSON deserialization.
	/// </summary>
	[JsonPropertyName("dt")]
	[JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
	internal long Timestamp
	{
		get; set;
	}

	/// <summary>
	/// Gets the current time as DateTime (UTC).
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
	/// Gets or sets the temperature.
	/// </summary>
	[JsonPropertyName("temp")]
	public double Temperature
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the "feels like" temperature.
	/// </summary>
	[JsonPropertyName("feels_like")]
	public double FeelsLike
	{
		get; set;
	}

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
	/// Gets or sets the visibility (meters).
	/// </summary>
	[JsonPropertyName("visibility")]
	public int Visibility
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
	/// Gets or sets the weather conditions.
	/// </summary>
	[JsonPropertyName("weather")]
	public List<WeatherCondition> Weather { get; set; } = [];

	/// <summary>
	/// Gets or sets the rain data (optional).
	/// </summary>
	[JsonPropertyName("rain")]
	public Precipitation? Rain
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the snow data (optional).
	/// </summary>
	[JsonPropertyName("snow")]
	public Precipitation? Snow
	{
		get; set;
	}
}