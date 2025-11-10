// <copyright file="CreateWeatherForecastRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Application.DTOs.Requests;

/// <summary>
/// Request DTO for creating a new weather forecast.
/// Encapsulates all required data for forecast creation.
/// </summary>
/// <remarks>
/// This request DTO implements the Command pattern, representing an intent
/// to create a new weather forecast in the system.
///
/// Design Benefits:
/// - Separates API contracts from domain models
/// - Enables request-specific validation rules
/// - Provides a clear contract for clients
/// - Supports API versioning
///
/// Validation:
/// - Date: Required, must be today or in the future
/// - TemperatureC: Required, must be between -100°C and 100°C
/// - Summary: Optional, max 200 characters if provided
///
/// Validation is performed by CreateWeatherForecastValidator using FluentValidation.
///
/// Note: TemperatureF is not included as it's calculated from TemperatureC.
/// </remarks>
public record CreateWeatherForecastRequest
{
	/// <summary>
	/// Gets the date for the weather forecast.
	/// </summary>
	/// <value>
	/// A DateOnly value representing when this forecast is for.
	/// </value>
	/// <remarks>
	/// Required field (C# 11+ required modifier).
	/// Must be today or in the future (validated by FluentValidation).
	/// </remarks>
	public required DateOnly Date
	{
		get; init;
	}

	/// <summary>
	/// Gets the temperature in degrees Celsius.
	/// </summary>
	/// <value>
	/// An integer representing the forecasted temperature in °C.
	/// </value>
	/// <remarks>
	/// Required field (C# 11+ required modifier).
	/// Must be between -100°C and 100°C (validated by FluentValidation).
	/// Fahrenheit will be automatically calculated from this value.
	/// </remarks>
	public required int TemperatureC
	{
		get; init;
	}

	/// <summary>
	/// Gets the weather summary description.
	/// </summary>
	/// <value>
	/// A string describing the forecasted weather conditions.
	/// Null if not provided.
	/// </value>
	/// <remarks>
	/// Optional field.
	/// If provided, must not exceed 200 characters (validated by FluentValidation).
	/// Examples: "Sunny", "Partly Cloudy", "Heavy Rain Expected"
	/// </remarks>
	public string? Summary
	{
		get; init;
	}
}