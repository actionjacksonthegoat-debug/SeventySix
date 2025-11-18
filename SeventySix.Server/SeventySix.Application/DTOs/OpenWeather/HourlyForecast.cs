// <copyright file="HourlyForecast.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Text.Json.Serialization;

namespace SeventySix.Application.DTOs.OpenWeather;

/// <summary>
/// Hourly weather forecast (48 hours).
/// </summary>
public class HourlyForecast
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
	/// Gets or sets the probability of precipitation (0-1).
	/// </summary>
	[JsonPropertyName("pop")]
	public double PrecipitationProbability
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