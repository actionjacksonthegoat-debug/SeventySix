// <copyright file="PollyOptions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Settings;

/// <summary>
/// Configuration options for Polly resilience policies.
/// </summary>
/// <remarks>
/// Provides configuration for retry, circuit breaker, and timeout policies.
/// Values are bound from appsettings.json "Polly" section.
/// </remarks>
public record PollyOptions
{
	/// <summary>
	/// Configuration section name in appsettings.json.
	/// </summary>
	public const string SECTION_NAME = "Polly";

	/// <summary>
	/// Number of retry attempts before failing.
	/// </summary>
	public int RetryCount { get; init; } = 3;

	/// <summary>
	/// Base delay for exponential backoff (seconds).
	/// Delay formula: baseDelay * 2^retryAttempt
	/// </summary>
	public int RetryDelaySeconds { get; init; } = 2;

	/// <summary>
	/// Minimum throughput before circuit breaker evaluates failure ratio.
	/// </summary>
	public int CircuitBreakerFailureThreshold { get; init; } = 5;

	/// <summary>
	/// Duration to sample failures before opening circuit (seconds).
	/// </summary>
	public int CircuitBreakerSamplingDurationSeconds { get; init; } = 60;

	/// <summary>
	/// Duration the circuit stays open before allowing test request (seconds).
	/// </summary>
	public int CircuitBreakerBreakDurationSeconds { get; init; } = 30;

	/// <summary>
	/// HTTP request timeout (seconds).
	/// </summary>
	public int TimeoutSeconds { get; init; } = 10;

	/// <summary>
	/// Enable jitter in retry delays to prevent thundering herd.
	/// </summary>
	public bool UseJitter { get; init; } = true;
}