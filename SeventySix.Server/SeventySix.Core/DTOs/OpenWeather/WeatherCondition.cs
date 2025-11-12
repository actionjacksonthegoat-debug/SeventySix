// <copyright file="WeatherCondition.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Text.Json.Serialization;

namespace SeventySix.Core.DTOs.OpenWeather;

/// <summary>
/// Weather condition information.
/// </summary>
/// <remarks>
/// Represents one weather condition from the OpenWeather API.
/// Multiple conditions can be returned for a single timestamp.
/// </remarks>
public class WeatherCondition
{
	/// <summary>
	/// Gets or sets the weather condition ID.
	/// </summary>
	/// <value>Weather condition ID (see OpenWeather docs for codes).</value>
	[JsonPropertyName("id")]
	public int Id
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the main weather condition group.
	/// </summary>
	/// <value>Examples: Rain, Snow, Clouds, Clear.</value>
	[JsonPropertyName("main")]
	public string Main { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the detailed description.
	/// </summary>
	/// <value>Examples: "light rain", "overcast clouds".</value>
	[JsonPropertyName("description")]
	public string Description { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the weather icon ID.
	/// </summary>
	/// <value>Icon code for displaying weather icons.</value>
	[JsonPropertyName("icon")]
	public string Icon { get; set; } = string.Empty;

	/// <summary>
	/// Gets the full URL to the weather icon.
	/// </summary>
	public string IconUrl => $"https://openweathermap.org/img/wn/{Icon}@2x.png";
}