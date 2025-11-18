// <copyright file="PollyOptions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Application.Configuration;

/// <summary>
/// Configuration options for Polly resilience policies.
/// </summary>
/// <remarks>
/// Provides configuration for retry, circuit breaker, and timeout policies.
/// Can be customized per HTTP client if needed.
/// </remarks>
public class PollyOptions
{
	/// <summary>
	/// Configuration section name in appsettings.json.
	/// </summary>
	public const string SECTION_NAME = "Polly";

	/// <summary>
	/// Gets or sets the number of retry attempts.
	/// </summary>
	public int RetryCount { get; set; } = 3;

	/// <summary>
	/// Gets or sets the base delay for exponential backoff (seconds).
	/// </summary>
	/// <value>Delay formula: baseDelay * 2^retryAttempt</value>
	public int RetryDelaySeconds { get; set; } = 2;

	/// <summary>
	/// Gets or sets the circuit breaker failure threshold.
	/// </summary>
	public int CircuitBreakerFailureThreshold { get; set; } = 5;

	/// <summary>
	/// Gets or sets the circuit breaker sampling duration (seconds).
	/// </summary>
	public int CircuitBreakerSamplingDurationSeconds { get; set; } = 60;

	/// <summary>
	/// Gets or sets the circuit breaker break duration (seconds).
	/// </summary>
	public int CircuitBreakerBreakDurationSeconds { get; set; } = 30;

	/// <summary>
	/// Gets or sets the HTTP request timeout (seconds).
	/// </summary>
	public int TimeoutSeconds { get; set; } = 10;

	/// <summary>
	/// Gets or sets whether to enable jitter in retry delays.
	/// </summary>
	/// <remarks>
	/// Jitter helps prevent thundering herd problem.
	/// </remarks>
	public bool UseJitter { get; set; } = true;
}