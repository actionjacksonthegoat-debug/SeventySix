// <copyright file="ThirdPartyRateLimitOptions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Infrastructure;

/// <summary>
/// Configuration options for ThirdPartyRateLimit API integration.
/// </summary>
/// <remarks>
/// Loaded from appsettings.json via Options pattern.
/// All values are validated on application startup.
/// </remarks>
public class ThirdPartyRateLimitOptions
{
	/// <summary>
	/// Configuration section name in appsettings.json.
	/// </summary>
	public const string SECTION_NAME = "ThirdPartyRateLimit";

	/// <summary>
	/// Gets or sets the ThirdPartyRateLimit API key.
	/// </summary>
	/// <remarks>
	/// CRITICAL: Store in User Secrets (dev) or Azure Key Vault (prod).
	/// Never commit API keys to source control.
	/// </remarks>
	public required string ApiKey
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the base URL for ThirdPartyRateLimit API.
	/// </summary>
	/// <value>Default: https://api.openweathermap.org</value>
	public required string BaseUrl
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the maximum number of API calls allowed per day.
	/// </summary>
	/// <value>Default: 1000 (free tier limit)</value>
	public int DailyCallLimit { get; set; } = 1000;

	/// <summary>
	/// Gets or sets the cache duration in minutes.
	/// </summary>
	/// <value>Default: 5 minutes</value>
	public int CacheDurationMinutes { get; set; } = 5;

	/// <summary>
	/// Gets or sets the HTTP request timeout in seconds.
	/// </summary>
	/// <value>Default: 10 seconds</value>
	public int TimeoutSeconds { get; set; } = 10;

	/// <summary>
	/// Gets or sets the number of retry attempts for transient failures.
	/// </summary>
	/// <value>Default: 3 retries</value>
	public int RetryCount { get; set; } = 3;

	/// <summary>
	/// Gets or sets the circuit breaker failure threshold.
	/// </summary>
	/// <value>Default: 5 consecutive failures</value>
	public int CircuitBreakerThreshold { get; set; } = 5;

	/// <summary>
	/// Gets or sets the circuit breaker open duration in seconds.
	/// </summary>
	/// <value>Default: 30 seconds</value>
	public int CircuitBreakerDurationSeconds { get; set; } = 30;

	/// <summary>
	/// Gets or sets the default latitude for weather requests.
	/// </summary>
	/// <value>Optional: Used for testing or fallback</value>
	public double? DefaultLatitude
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the default longitude for weather requests.
	/// </summary>
	/// <value>Optional: Used for testing or fallback</value>
	public double? DefaultLongitude
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the preferred units system (standard, metric, imperial).
	/// </summary>
	/// <value>Default: metric</value>
	public string Units { get; set; } = "metric";

	/// <summary>
	/// Gets or sets the preferred language for API responses.
	/// </summary>
	/// <value>Default: en (English)</value>
	public string Language { get; set; } = "en";
}