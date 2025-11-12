// <copyright file="IOpenWeatherService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Core.DTOs.OpenWeather;
using SeventySix.Core.DTOs.Requests;

namespace SeventySix.BusinessLogic.Interfaces;

/// <summary>
/// Interface for OpenWeather business logic service.
/// </summary>
/// <remarks>
/// Provides weather data operations with validation, caching, and error handling.
/// </remarks>
public interface IOpenWeatherService
{
	/// <summary>
	/// Gets current weather data for the specified location.
	/// </summary>
	/// <param name="request">Weather request parameters.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Current weather data.</returns>
	public Task<CurrentWeather?> GetCurrentWeatherAsync(
		WeatherRequest request,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets hourly forecast for the specified location (48 hours).
	/// </summary>
	/// <param name="request">Weather request parameters.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>List of hourly forecasts.</returns>
	public Task<IEnumerable<HourlyForecast>> GetHourlyForecastAsync(
		WeatherRequest request,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets daily forecast for the specified location (8 days).
	/// </summary>
	/// <param name="request">Weather request parameters.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>List of daily forecasts.</returns>
	public Task<IEnumerable<DailyForecast>> GetDailyForecastAsync(
		WeatherRequest request,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets government weather alerts for the specified location.
	/// </summary>
	/// <param name="request">Weather request parameters.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>List of active weather alerts.</returns>
	public Task<IEnumerable<WeatherAlert>> GetWeatherAlertsAsync(
		WeatherRequest request,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets complete weather data (current, forecasts, alerts) for the specified location.
	/// </summary>
	/// <param name="request">Weather request parameters.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Complete One Call API response.</returns>
	public Task<OneCallResponse?> GetCompleteWeatherDataAsync(
		WeatherRequest request,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets historical weather data for the specified location and time.
	/// </summary>
	/// <param name="request">Historical weather request parameters.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Historical weather data.</returns>
	public Task<OneCallResponse?> GetHistoricalWeatherAsync(
		HistoricalWeatherRequest request,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets minute-by-minute precipitation forecast for the next hour.
	/// </summary>
	/// <param name="request">Weather request parameters.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>List of minutely precipitation forecasts.</returns>
	public Task<IEnumerable<MinutelyForecast>> GetMinutelyForecastAsync(
		WeatherRequest request,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Checks if weather API calls can be made without exceeding rate limits.
	/// </summary>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>True if requests are allowed.</returns>
	public Task<bool> CanMakeApiCallAsync(CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets the remaining API call quota for today.
	/// </summary>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Number of remaining API calls.</returns>
	public Task<int> GetRemainingApiQuotaAsync(CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets the time until the rate limit resets.
	/// </summary>
	/// <returns>TimeSpan until midnight UTC.</returns>
	public TimeSpan GetTimeUntilReset();
}