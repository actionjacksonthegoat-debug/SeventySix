// <copyright file="IOpenWeatherApiClient.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Application.DTOs.OpenWeather;
using SeventySix.Application.DTOs.Requests;

namespace SeventySix.Application.Interfaces;

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
	public Task<OneCallResponse?> GetOneCallDataAsync(
		WeatherRequest request,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets historical weather data using Timemachine API.
	/// </summary>
	/// <param name="request">Historical weather request parameters.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Historical weather data for the specified timestamp.</returns>
	public Task<OneCallResponse?> GetHistoricalDataAsync(
		HistoricalWeatherRequest request,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Checks if API calls can be made without exceeding rate limits.
	/// </summary>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>True if requests are allowed.</returns>
	public Task<bool> CanMakeRequestAsync(CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets the remaining API call quota for today.
	/// </summary>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Number of remaining API calls.</returns>
	public Task<int> GetRemainingQuotaAsync(CancellationToken cancellationToken = default);
}