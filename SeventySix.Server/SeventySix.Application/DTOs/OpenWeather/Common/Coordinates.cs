// <copyright file="Coordinates.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Text.Json.Serialization;

namespace SeventySix.Application.DTOs.OpenWeather.Common;

/// <summary>
/// Geographic coordinates.
/// </summary>
public class Coordinates
{
	/// <summary>
	/// Gets or sets the latitude.
	/// </summary>
	/// <value>Range: -90 to 90 degrees.</value>
	[JsonPropertyName("lat")]
	public double Latitude
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the longitude.
	/// </summary>
	/// <value>Range: -180 to 180 degrees.</value>
	[JsonPropertyName("lon")]
	public double Longitude
	{
		get; set;
	}
}