// <copyright file="FeelsLike.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Text.Json.Serialization;

namespace SeventySix.Core.DTOs.OpenWeather;

/// <summary>
/// "Feels like" temperature information for daily forecast.
/// </summary>
public class FeelsLike
{
	/// <summary>
	/// Gets or sets the morning "feels like" temperature.
	/// </summary>
	[JsonPropertyName("morn")]
	public double Morning
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the day "feels like" temperature.
	/// </summary>
	[JsonPropertyName("day")]
	public double Day
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the evening "feels like" temperature.
	/// </summary>
	[JsonPropertyName("eve")]
	public double Evening
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the night "feels like" temperature.
	/// </summary>
	[JsonPropertyName("night")]
	public double Night
	{
		get; set;
	}
}
