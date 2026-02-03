// <copyright file="ResilienceOptions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Settings;

/// <summary>
/// Configuration options for HTTP resilience policies.
/// </summary>
/// <remarks>
/// Provides configuration for retry, circuit breaker, and timeout policies.
/// Values are bound from appsettings.json "Resilience" section.
/// All numeric properties must be configured in appsettings.json.
/// </remarks>
public record ResilienceOptions
{
	/// <summary>
	/// Configuration section name in appsettings.json.
	/// </summary>
	public const string SectionName = "Resilience";

	/// <summary>
	/// Number of retry attempts before failing.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int RetryCount { get; init; }

	/// <summary>
	/// Base delay for exponential backoff (seconds).
	/// Must be configured in appsettings.json.
	/// Delay formula: baseDelay * 2^retryAttempt.
	/// </summary>
	public int RetryDelaySeconds { get; init; }

	/// <summary>
	/// Minimum throughput before circuit breaker evaluates failure ratio.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int CircuitBreakerFailureThreshold { get; init; }

	/// <summary>
	/// Duration to sample failures before opening circuit (seconds).
	/// Must be configured in appsettings.json.
	/// </summary>
	public int CircuitBreakerSamplingDurationSeconds { get; init; }

	/// <summary>
	/// Duration the circuit stays open before allowing test request (seconds).
	/// Must be configured in appsettings.json.
	/// </summary>
	public int CircuitBreakerBreakDurationSeconds { get; init; }

	/// <summary>
	/// HTTP request timeout (seconds).
	/// For sub-second timeouts, use TimeoutMilliseconds instead.
	/// Must be configured in appsettings.json.
	/// </summary>
	public int TimeoutSeconds { get; init; }

	/// <summary>
	/// HTTP request timeout in milliseconds.
	/// Takes precedence over TimeoutSeconds when set to a value greater than 0.
	/// Useful for testing with fast timeouts.
	/// </summary>
	public int TimeoutMilliseconds { get; init; }

	/// <summary>
	/// Gets the effective timeout as a TimeSpan.
	/// Uses TimeoutMilliseconds if set, otherwise TimeoutSeconds.
	/// </summary>
	public TimeSpan EffectiveTimeout =>
		TimeoutMilliseconds > 0
			? TimeSpan.FromMilliseconds(TimeoutMilliseconds)
			: TimeSpan.FromSeconds(TimeoutSeconds);

	/// <summary>
	/// Enable jitter in retry delays to prevent thundering herd.
	/// </summary>
	public bool UseJitter { get; init; } = true;
}