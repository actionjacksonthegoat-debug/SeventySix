// <copyright file="OpenWeatherApiClient.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.BusinessLogic.Configuration;
using SeventySix.BusinessLogic.DTOs.OpenWeather;
using SeventySix.BusinessLogic.DTOs.Requests;
using SeventySix.BusinessLogic.Interfaces;

namespace SeventySix.Data.Services;

/// <summary>
/// OpenWeather API client implementation.
/// </summary>
/// <remarks>
/// Wraps the generic PollyIntegrationClient with OpenWeather-specific logic.
/// Handles URL construction, query parameters, and API key management.
///
/// Design Patterns:
/// - Facade: Simplifies OpenWeather API interactions
/// - Adapter: Adapts generic HTTP client to OpenWeather API
///
/// SOLID Principles:
/// - SRP: Only responsible for OpenWeather API communication
/// - DIP: Depends on IPollyIntegrationClient abstraction
/// </remarks>
public class OpenWeatherApiClient : IOpenWeatherApiClient
{
	private const string ApiName = "OpenWeather";
	private const string OneCallEndpoint = "/data/3.0/onecall";
	private const string TimemachineEndpoint = "/data/3.0/onecall/timemachine";

	private readonly IPollyIntegrationClient PollyClient;
	private readonly ILogger<OpenWeatherApiClient> Logger;
	private readonly OpenWeatherOptions Options;

	/// <summary>
	/// Initializes a new instance of the <see cref="OpenWeatherApiClient"/> class.
	/// </summary>
	/// <param name="pollyClient">Polly integration client.</param>
	/// <param name="logger">Logger instance.</param>
	/// <param name="options">OpenWeather configuration options.</param>
	public OpenWeatherApiClient(
		IPollyIntegrationClient pollyClient,
		ILogger<OpenWeatherApiClient> logger,
		IOptions<OpenWeatherOptions> options)
	{
		PollyClient = pollyClient ?? throw new ArgumentNullException(nameof(pollyClient));
		Logger = logger ?? throw new ArgumentNullException(nameof(logger));
		Options = options?.Value ?? throw new ArgumentNullException(nameof(options));
	}

	/// <inheritdoc/>
	public async Task<OneCallResponse?> GetOneCallDataAsync(
		WeatherRequest request,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(request);

		string url = BuildOneCallUrl(request);
		string cacheKey = BuildCacheKey("onecall", request.Latitude, request.Longitude, request.Exclude);
		TimeSpan cacheDuration = TimeSpan.FromMinutes(Options.CacheDurationMinutes);

		Logger.LogInformation(
			"Fetching One Call data for coordinates: ({Latitude}, {Longitude})",
			request.Latitude,
			request.Longitude);

		return await PollyClient.GetAsync<OneCallResponse>(
			url,
			ApiName,
			cacheKey,
			cacheDuration,
			cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<OneCallResponse?> GetHistoricalDataAsync(
		HistoricalWeatherRequest request,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(request);

		string url = BuildTimemachineUrl(request);
		string cacheKey = BuildCacheKey("timemachine", request.Latitude, request.Longitude, request.Timestamp.ToString());
		TimeSpan cacheDuration = TimeSpan.FromHours(24); // Historical data doesn't change

		Logger.LogInformation(
			"Fetching historical data for coordinates: ({Latitude}, {Longitude}) at timestamp: {Timestamp}",
			request.Latitude,
			request.Longitude,
			request.Timestamp);

		return await PollyClient.GetAsync<OneCallResponse>(
			url,
			ApiName,
			cacheKey,
			cacheDuration,
			cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<bool> CanMakeRequestAsync(CancellationToken cancellationToken = default) => await PollyClient.CanMakeRequestAsync(ApiName, cancellationToken);

	/// <inheritdoc/>
	public async Task<int> GetRemainingQuotaAsync(CancellationToken cancellationToken = default) => await PollyClient.GetRemainingQuotaAsync(ApiName, cancellationToken);

	/// <summary>
	/// Builds the One Call API URL with query parameters.
	/// </summary>
	private string BuildOneCallUrl(WeatherRequest request)
	{
		string baseUrl = $"{Options.BaseUrl}{OneCallEndpoint}";
		List<string> queryParams =
		[
			$"lat={request.Latitude}",
			$"lon={request.Longitude}",
			$"appid={Options.ApiKey}",
			$"units={request.Units.ToString().ToLowerInvariant()}",
			$"lang={request.Language}",
		];

		if (!string.IsNullOrWhiteSpace(request.Exclude))
		{
			queryParams.Add($"exclude={request.Exclude}");
		}

		return $"{baseUrl}?{string.Join("&", queryParams)}";
	}

	/// <summary>
	/// Builds the Timemachine API URL with query parameters.
	/// </summary>
	private string BuildTimemachineUrl(HistoricalWeatherRequest request)
	{
		string baseUrl = $"{Options.BaseUrl}{TimemachineEndpoint}";
		List<string> queryParams =
		[
			$"lat={request.Latitude}",
			$"lon={request.Longitude}",
			$"dt={request.Timestamp}",
			$"appid={Options.ApiKey}",
			$"units={request.Units.ToString().ToLowerInvariant()}",
			$"lang={request.Language}",
		];

		return $"{baseUrl}?{string.Join("&", queryParams)}";
	}

	/// <summary>
	/// Builds a cache key for the request.
	/// </summary>
	private static string BuildCacheKey(string endpoint, double latitude, double longitude, string? extra = null)
	{
		string key = $"openweather:{endpoint}:{latitude:F4}:{longitude:F4}";
		if (!string.IsNullOrWhiteSpace(extra))
		{
			key += $":{extra}";
		}

		return key;
	}
}