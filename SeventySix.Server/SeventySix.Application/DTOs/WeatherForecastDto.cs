// <copyright file="WeatherForecastDto.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Application.DTOs;

/// <summary>
/// Weather forecast data transfer object for API responses.
/// Represents a read-only snapshot of weather forecast data.
/// </summary>
/// <remarks>
/// This DTO implements the DTO (Data Transfer Object) pattern to:
/// - Separate the domain model from API contracts
/// - Control what data is exposed to clients
/// - Enable API versioning without affecting domain models
/// - Provide a stable interface for clients
///
/// Design Notes:
/// - Implemented as a record for immutability and value equality
/// - Uses init-only properties (C# 9+) for immutable state
/// - Contains no business logic (pure data container)
/// - Includes both Celsius and Fahrenheit for client convenience
///
/// This record is serialized to JSON for HTTP responses.
/// </remarks>
public record WeatherForecastDto
{
	/// <summary>
	/// Gets the date for this weather forecast.
	/// </summary>
	/// <value>
	/// A DateOnly value representing the forecast date.
	/// </value>
	/// <remarks>
	/// Uses DateOnly (C# 10+) instead of DateTime for date-only precision.
	/// </remarks>
	public DateOnly Date
	{
		get; init;
	}

	/// <summary>
	/// Gets the temperature in degrees Celsius.
	/// </summary>
	/// <value>
	/// An integer representing the temperature in °C.
	/// Valid range: -100 to 100 (enforced by validation).
	/// </value>
	public int TemperatureC
	{
		get; init;
	}

	/// <summary>
	/// Gets the temperature in degrees Fahrenheit.
	/// </summary>
	/// <value>
	/// An integer representing the temperature in °F.
	/// Calculated from TemperatureC: (TemperatureC * 9/5) + 32.
	/// </value>
	/// <remarks>
	/// This is a calculated value provided for client convenience.
	/// Clients working in imperial units don't need to perform conversion.
	/// </remarks>
	public int TemperatureF
	{
		get; init;
	}

	/// <summary>
	/// Gets the weather summary description.
	/// </summary>
	/// <value>
	/// A string describing the weather conditions (e.g., "Sunny", "Rainy", "Cloudy").
	/// Null if no summary is provided.
	/// </value>
	/// <remarks>
	/// Maximum length: 200 characters (enforced by validation).
	/// Optional field - may be null or empty.
	/// </remarks>
	public string? Summary
	{
		get; init;
	}
}