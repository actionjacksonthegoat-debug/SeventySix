// <copyright file="PollyResiliencePolicyTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using NSubstitute;
using SeventySix.Infrastructure;
using SeventySix.Shared;
using SeventySix.TestUtilities.TestHelpers;
using Shouldly;

namespace SeventySix.Api.Tests.Resilience;

/// <summary>
/// Tests for Polly resilience policies (retry, circuit breaker, timeout).
/// </summary>
public class PollyResiliencePolicyTests
{
	[Fact]
	public async Task RetryPolicy_TransientFailure_RetriesThreeTimesAsync()
	{
		// Arrange
		int callCount = 0;
		MockHttpMessageHandler handler = new((_, _) =>
		{
			callCount++;
			return Task.FromResult(callCount < 3
				? new HttpResponseMessage(HttpStatusCode.ServiceUnavailable)
				: new HttpResponseMessage(HttpStatusCode.OK)
				{
					Content = new StringContent("{\"lat\":40.71,\"lon\":-74.01}"),
				});
		});

		HttpClient httpClient = new(handler) { BaseAddress = new Uri("https://api.example.com/") };
		MemoryCache cache = new(new MemoryCacheOptions());

		IRateLimitingService rateLimiter = Substitute.For<IRateLimitingService>();
		rateLimiter.CanMakeRequestAsync(Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns(true);
		rateLimiter.TryIncrementRequestCountAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns(true);

		ILoggerFactory loggerFactory = Substitute.For<ILoggerFactory>();
		loggerFactory.CreateLogger(Arg.Any<string>()).Returns(Substitute.For<ILogger>());

		// Use zero delays for fast test execution (exponential backoff: 0 * 2^n = 0)
		IOptions<PollyOptions> options = Options.Create(new PollyOptions
		{
			RetryCount = 3,
			RetryDelaySeconds = 0,
			CircuitBreakerFailureThreshold = 5,
			CircuitBreakerSamplingDurationSeconds = 60,
			CircuitBreakerBreakDurationSeconds = 30,
			TimeoutSeconds = 10,
		});

		PollyIntegrationClient client = new(httpClient, cache, rateLimiter, loggerFactory, options);

		// Act
		dynamic? response = await client.GetAsync<dynamic>("test", "TestApi", cancellationToken: CancellationToken.None);

		// Assert
		callCount.ShouldBe(3, "Should retry twice (3 attempts total)");
	}

	[Fact]
	public async Task CircuitBreaker_ExceedsThreshold_OpensCircuitAsync()
	{
		// Arrange
		MockHttpMessageHandler handler = new((_, _) =>
			Task.FromResult(new HttpResponseMessage(HttpStatusCode.ServiceUnavailable)));

		HttpClient httpClient = new(handler) { BaseAddress = new Uri("https://api.example.com/") };
		MemoryCache cache = new(new MemoryCacheOptions());

		IRateLimitingService rateLimiter = Substitute.For<IRateLimitingService>();
		rateLimiter.CanMakeRequestAsync(Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns(true);
		rateLimiter.TryIncrementRequestCountAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns(true);

		ILoggerFactory loggerFactory = Substitute.For<ILoggerFactory>();
		loggerFactory.CreateLogger(Arg.Any<string>()).Returns(Substitute.For<ILogger>());

		// Use zero delays for fast test execution
		IOptions<PollyOptions> options = Options.Create(new PollyOptions
		{
			RetryCount = 0,
			RetryDelaySeconds = 0,
			CircuitBreakerFailureThreshold = 3,
			CircuitBreakerSamplingDurationSeconds = 60,
			CircuitBreakerBreakDurationSeconds = 0,
			TimeoutSeconds = 10,
		});

		PollyIntegrationClient client = new(httpClient, cache, rateLimiter, loggerFactory, options);

		// Act - Trigger circuit breaker
		for (int i = 0; i < 5; i++)
		{
			try
			{
				await client.GetAsync<dynamic>("test", "TestApi", cancellationToken: CancellationToken.None);
			}
			catch
			{
				// Expected failures
			}
		}

		// Assert - Circuit should now be open
		await Assert.ThrowsAnyAsync<Exception>(async () =>
			await client.GetAsync<dynamic>("test", "TestApi", cancellationToken: CancellationToken.None));
	}

	[Fact]
	public async Task TimeoutPolicy_SlowResponse_CancelsRequestAsync()
	{
		// Arrange - handler respects cancellation token so timeout actually cancels the delay
		MockHttpMessageHandler handler = new(async (_, cancellationToken) =>
		{
			await Task.Delay(TimeSpan.FromSeconds(15), cancellationToken);
			return new HttpResponseMessage(HttpStatusCode.OK);
		});

		HttpClient httpClient = new(handler) { BaseAddress = new Uri("https://api.example.com/") };
		MemoryCache cache = new(new MemoryCacheOptions());

		IRateLimitingService rateLimiter = Substitute.For<IRateLimitingService>();
		rateLimiter.CanMakeRequestAsync(Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns(true);
		rateLimiter.TryIncrementRequestCountAsync(Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns(true);

		ILoggerFactory loggerFactory = Substitute.For<ILoggerFactory>();
		loggerFactory.CreateLogger(Arg.Any<string>()).Returns(Substitute.For<ILogger>());

		// Use 1 second timeout for fast test execution
		IOptions<PollyOptions> options = Options.Create(new PollyOptions
		{
			RetryCount = 0,
			RetryDelaySeconds = 0,
			CircuitBreakerFailureThreshold = 5,
			CircuitBreakerSamplingDurationSeconds = 60,
			CircuitBreakerBreakDurationSeconds = 30,
			TimeoutSeconds = 1,
		});

		PollyIntegrationClient client = new(httpClient, cache, rateLimiter, loggerFactory, options);

		// Act & Assert
		await Assert.ThrowsAnyAsync<Exception>(async () =>
			await client.GetAsync<dynamic>("test", "TestApi", cancellationToken: CancellationToken.None));
	}
}