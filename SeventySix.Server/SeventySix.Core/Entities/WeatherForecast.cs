// <copyright file="WeatherForecast.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Core.Entities;

/// <summary>
/// Weather forecast domain entity representing forecast data for a specific date.
/// Core business object in the weather forecasting domain.
/// </summary>
/// <remarks>
/// This entity represents the heart of the domain model in Clean Architecture,
/// containing both data and business logic related to weather forecasts.
///
/// Design Principles:
/// - Rich Domain Model: Contains calculated properties (TemperatureF)
/// - Framework Independence: No dependencies on infrastructure or application concerns
/// - Business Logic Encapsulation: Temperature conversion logic lives in the domain
///
/// Business Rules:
/// - Date represents the day for which the forecast is valid
/// - Temperature is stored in Celsius (primary unit)
/// - Fahrenheit is calculated on-the-fly using the standard conversion formula
/// - Summary is optional descriptive text about weather conditions
///
/// Note: This is a simple entity. More complex entities might include:
/// - Validation logic in property setters
/// - Domain events for state changes
/// - Private setters with business rule enforcement
/// - Value objects for complex properties
/// </remarks>
public class WeatherForecast
{
	/// <summary>
	/// Gets or sets the date for which this weather forecast applies.
	/// </summary>
	/// <value>
	/// A DateOnly value representing the forecast date.
	/// </value>
	/// <remarks>
	/// Business Rule: This should typically be today or a future date.
	/// Validation is enforced at the application layer (CreateWeatherForecastValidator).
	/// </remarks>
	public DateOnly Date
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the forecasted temperature in degrees Celsius.
	/// </summary>
	/// <value>
	/// An integer representing the temperature in °C.
	/// </value>
	/// <remarks>
	/// Celsius is used as the primary storage unit following international standards.
	/// Valid range: -100°C to 100°C (enforced by validation layer).
	/// </remarks>
	public int TemperatureC
	{
		get; set;
	}

	/// <summary>
	/// Gets the forecasted temperature in degrees Fahrenheit.
	/// </summary>
	/// <value>
	/// An integer representing the temperature in °F, calculated from TemperatureC.
	/// </value>
	/// <remarks>
	/// This is a calculated property (domain logic) using the formula: (C × 9/5) + 32
	/// Read-only property - cannot be set directly. To change this value, set TemperatureC.
	/// The calculation is performed on every access, which is acceptable for this simple conversion.
	/// For expensive calculations, consider caching or using a backing field.
	/// </remarks>
	public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);

	/// <summary>
	/// Gets or sets a descriptive summary of the weather conditions.
	/// </summary>
	/// <value>
	/// A string describing weather conditions (e.g., "Sunny", "Rainy", "Partly Cloudy").
	/// Null if no summary is provided.
	/// </value>
	/// <remarks>
	/// This is an optional field that provides human-readable context.
	/// Maximum length: 200 characters (enforced by validation layer).
	/// Examples: "Clear skies", "Scattered thunderstorms", "Heavy fog expected"
	/// </remarks>
	public string? Summary
	{
		get; set;
	}
}