// <copyright file="TestPollyOptionsBuilder.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Options;
using SeventySix.Shared;

namespace SeventySix.TestUtilities.Builders;

/// <summary>
/// Builder for creating PollyOptions configured for fast test execution.
/// Uses zero delays to prevent test slowdowns from retry/circuit breaker logic.
/// </summary>
/// <remarks>
/// All delay-related options default to zero for fast test execution.
/// UseJitter is disabled for deterministic test behavior.
///
/// Usage:
/// <code>
/// // Default options (zero delays)
/// IOptions&lt;PollyOptions&gt; options = TestPollyOptionsBuilder.CreateDefault();
///
/// // Customized options
/// IOptions&lt;PollyOptions&gt; options = new TestPollyOptionsBuilder()
///     .WithRetryCount(0)
///     .WithTimeout(2)
///     .Build();
/// </code>
/// </remarks>
public class TestPollyOptionsBuilder
{
	private int RetryCountValue = 3;
	private int CircuitBreakerFailureThresholdValue = 3;
	private int TimeoutSecondsValue = 1;

	/// <summary>
	/// Creates default fast test options with zero delays.
	/// </summary>
	/// <returns>IOptions&lt;PollyOptions&gt; configured for tests.</returns>
	public static IOptions<PollyOptions> CreateDefault() =>
		new TestPollyOptionsBuilder().Build();

	/// <summary>
	/// Sets the retry count.
	/// </summary>
	/// <param name="count">Number of retries.</param>
	/// <returns>The builder for chaining.</returns>
	public TestPollyOptionsBuilder WithRetryCount(int count)
	{
		RetryCountValue = count;
		return this;
	}

	/// <summary>
	/// Sets the circuit breaker failure threshold.
	/// </summary>
	/// <param name="threshold">Failure threshold.</param>
	/// <returns>The builder for chaining.</returns>
	public TestPollyOptionsBuilder WithCircuitBreakerThreshold(int threshold)
	{
		CircuitBreakerFailureThresholdValue = threshold;
		return this;
	}

	/// <summary>
	/// Sets the timeout in seconds.
	/// </summary>
	/// <param name="seconds">Timeout duration.</param>
	/// <returns>The builder for chaining.</returns>
	public TestPollyOptionsBuilder WithTimeout(int seconds)
	{
		TimeoutSecondsValue = seconds;
		return this;
	}

	/// <summary>
	/// Builds the PollyOptions with zero delays for fast test execution.
	/// </summary>
	/// <returns>Configured IOptions&lt;PollyOptions&gt;.</returns>
	public IOptions<PollyOptions> Build() =>
		Options.Create(new PollyOptions
		{
			RetryCount = RetryCountValue,
			RetryDelaySeconds = 0,  // Always zero for tests
			CircuitBreakerFailureThreshold = CircuitBreakerFailureThresholdValue,
			CircuitBreakerSamplingDurationSeconds = 60,
			CircuitBreakerBreakDurationSeconds = 1,  // Polly minimum is 0.5s
			TimeoutSeconds = TimeoutSecondsValue,
			UseJitter = false,  // Disabled for deterministic tests
		});
}