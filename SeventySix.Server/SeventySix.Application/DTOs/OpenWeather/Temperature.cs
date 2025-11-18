// <copyright file="Temperature.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Text.Json.Serialization;

namespace SeventySix.Application.DTOs.OpenWeather;

/// <summary>
/// Temperature information for daily forecast.
/// </summary>
public class Temperature
{
	/// <summary>
	/// Gets or sets the morning temperature.
	/// </summary>
	[JsonPropertyName("morn")]
	public double Morning
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the day temperature.
	/// </summary>
	[JsonPropertyName("day")]
	public double Day
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the evening temperature.
	/// </summary>
	[JsonPropertyName("eve")]
	public double Evening
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the night temperature.
	/// </summary>
	[JsonPropertyName("night")]
	public double Night
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the minimum daily temperature.
	/// </summary>
	[JsonPropertyName("min")]
	public double Min
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the maximum daily temperature.
	/// </summary>
	[JsonPropertyName("max")]
	public double Max
	{
		get; set;
	}
}