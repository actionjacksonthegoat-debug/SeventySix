// <copyright file="Units.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Core.DTOs.OpenWeather.Common;

/// <summary>
/// Unit systems supported by OpenWeather API.
/// </summary>
public enum Units
{
	/// <summary>
	/// Standard units (Kelvin for temperature).
	/// </summary>
	Standard,

	/// <summary>
	/// Metric units (Celsius for temperature).
	/// </summary>
	Metric,

	/// <summary>
	/// Imperial units (Fahrenheit for temperature).
	/// </summary>
	Imperial,
}
