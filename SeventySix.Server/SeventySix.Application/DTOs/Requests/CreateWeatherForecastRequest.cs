// <copyright file="CreateWeatherForecastRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Application.DTOs.Requests;

/// <summary>
/// Request DTO for creating weather forecast.
/// </summary>
public record CreateWeatherForecastRequest
{
	/// <summary>
	/// Gets forecast date.
	/// </summary>
	public required DateOnly Date
	{
		get; init;
	}

	/// <summary>
	/// Gets temperature in Celsius.
	/// </summary>
	public required int TemperatureC
	{
		get; init;
	}

	/// <summary>
	/// Gets weather summary.
	/// </summary>
	public string? Summary
	{
		get; init;
	}
}
