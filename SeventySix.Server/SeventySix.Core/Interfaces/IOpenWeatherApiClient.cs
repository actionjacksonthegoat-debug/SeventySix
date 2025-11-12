// <copyright file="IOpenWeatherApiClient.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Core.DTOs.OpenWeather;
using SeventySix.Core.DTOs.Requests;

namespace SeventySix.Core.Interfaces;

/// <summary>
/// Interface for OpenWeather API client.
/// </summary>
public interface IOpenWeatherApiClient
{
	/// <summary>
	/// Gets current weather and forecasts using One Call API 3.0.
	/// </summary>
	/// <param name="request">Weather request parameters.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Complete weather response including current, forecasts, and alerts.</returns>
	Task<OneCallResponse?> GetOneCallDataAsync(
		WeatherRequest request,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets historical weather data using Timemachine API.
	/// </summary>
	/// <param name="request">Historical weather request parameters.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Historical weather data for the specified timestamp.</returns>
	Task<OneCallResponse?> GetHistoricalDataAsync(
		HistoricalWeatherRequest request,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Checks if API calls can be made without exceeding rate limits.
	/// </summary>
	/// <returns>True if requests are allowed.</returns>
	bool CanMakeRequest();

	/// <summary>
	/// Gets the remaining API call quota for today.
	/// </summary>
	/// <returns>Number of remaining API calls.</returns>
	int GetRemainingQuota();
}
