// <copyright file="ThirdPartyApiRequestResponse.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Application.DTOs.ThirdPartyRequests;

/// <summary>
/// Response DTO for third-party API request tracking record.
/// </summary>
/// <remarks>
/// Represents a single API usage tracking record for a specific API on a specific date.
/// Used for displaying API call statistics in the admin dashboard.
///
/// Design Patterns:
/// - DTO: Data Transfer Object for API response
///
/// SOLID Principles:
/// - SRP: Only responsible for API request data transfer
/// </remarks>
public class ThirdPartyApiRequestResponse
{
	/// <summary>
	/// Gets or sets the unique identifier.
	/// </summary>
	public int Id
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the name of the external API.
	/// </summary>
	/// <example>OpenWeather</example>
	public string ApiName { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the base URL of the external API.
	/// </summary>
	/// <example>https://api.openweathermap.org</example>
	public string BaseUrl { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the number of API calls made on the ResetDate.
	/// </summary>
	public int CallCount
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the timestamp of the most recent API call.
	/// </summary>
	public DateTime? LastCalledAt
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the date for which this counter is tracking.
	/// </summary>
	public DateOnly ResetDate
	{
		get; set;
	}
}