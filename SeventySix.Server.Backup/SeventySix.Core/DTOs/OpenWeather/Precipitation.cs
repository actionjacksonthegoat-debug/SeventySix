// <copyright file="Precipitation.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Text.Json.Serialization;

namespace SeventySix.Core.DTOs.OpenWeather;

/// <summary>
/// Precipitation data (rain/snow).
/// </summary>
public class Precipitation
{
	/// <summary>
	/// Gets or sets the precipitation volume for the last 1 hour (mm).
	/// </summary>
	[JsonPropertyName("1h")]
	public double? OneHour
	{
		get; set;
	}
}