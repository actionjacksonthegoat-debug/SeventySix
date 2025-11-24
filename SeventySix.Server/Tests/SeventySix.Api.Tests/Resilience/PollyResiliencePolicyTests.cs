// <copyright file="PollyResiliencePolicyTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using FluentAssertions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Moq.Protected;
using SeventySix.BusinessLogic.Configuration;
using SeventySix.BusinessLogic.Infrastructure;
using SeventySix.BusinessLogic.Interfaces;

namespace SeventySix.Api.Tests.Resilience;

/// <summary>
/// Tests for Polly resilience policies (retry, circuit breaker, timeout).
/// Mocks external dependencies including HTTP calls.
/// </summary>
public class PollyResiliencePolicyTests
{
	/// <summary>
	/// Tests retry policy retries on transient failures.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous unit test.</returns>
	[Fact]
	public async Task RetryPolicy_TransientFailure_RetriesThreeTimesAsync()
	{
		// Arrange
		int callCount = 0;
		Mock<HttpMessageHandler> handlerMock = new();
		handlerMock
			.Protected()
			.Setup<Task<HttpResponseMessage>>(
				"SendAsync",
				ItExpr.IsAny<HttpRequestMessage>(),
				ItExpr.IsAny<CancellationToken>())
			.ReturnsAsync(() =>
			{
				callCount++;
				return callCount < 3
					? new HttpResponseMessage(HttpStatusCode.ServiceUnavailable)
					: new HttpResponseMessage(HttpStatusCode.OK)
					{
						Content = new StringContent("{\"lat\":40.71,\"lon\":-74.01}"),
					};
			});

		HttpClient httpClient = new(handlerMock.Object)
		{
			BaseAddress = new Uri("https://api.example.com/"),
		};

		MemoryCache cache = new(new MemoryCacheOptions());
		Mock<IRateLimitingService> rateLimiterMock = new();
		rateLimiterMock.Setup(r => r.CanMakeRequestAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);
		rateLimiterMock.Setup(r => r.TryIncrementRequestCountAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);

		Mock<ILogger<PollyIntegrationClient>> loggerMock = new();

		IOptions<PollyOptions> options = Options.Create(new PollyOptions
		{
			RetryCount = 3,
			RetryDelaySeconds = 1,
			CircuitBreakerFailureThreshold = 5,
			CircuitBreakerSamplingDurationSeconds = 60,
			CircuitBreakerBreakDurationSeconds = 30,
			TimeoutSeconds = 10,
		});

		PollyIntegrationClient client = new(httpClient, cache, rateLimiterMock.Object, loggerMock.Object, options);

		// Act
		dynamic? response = await client.GetAsync<dynamic>("test", "TestApi", cancellationToken: CancellationToken.None);

		// Assert
		callCount.Should().Be(3, "Should retry twice (3 attempts total)");
	}

	/// <summary>
	/// Tests circuit breaker opens after threshold failures.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous unit test.</returns>
	[Fact]
	public async Task CircuitBreaker_ExceedsThreshold_OpensCircuitAsync()
	{
		// Arrange
		Mock<HttpMessageHandler> handlerMock = new();
		handlerMock
			.Protected()
			.Setup<Task<HttpResponseMessage>>(
				"SendAsync",
				ItExpr.IsAny<HttpRequestMessage>(),
				ItExpr.IsAny<CancellationToken>())
			.ReturnsAsync(new HttpResponseMessage(HttpStatusCode.ServiceUnavailable));

		HttpClient httpClient = new(handlerMock.Object)
		{
			BaseAddress = new Uri("https://api.example.com/"),
		};

		MemoryCache cache = new(new MemoryCacheOptions());
		Mock<IRateLimitingService> rateLimiterMock = new();
		rateLimiterMock.Setup(r => r.CanMakeRequestAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);
		rateLimiterMock.Setup(r => r.TryIncrementRequestCountAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);

		Mock<ILogger<PollyIntegrationClient>> loggerMock = new();

		IOptions<PollyOptions> options = Options.Create(new PollyOptions
		{
			RetryCount = 1,
			CircuitBreakerFailureThreshold = 3,
			CircuitBreakerSamplingDurationSeconds = 60,
			CircuitBreakerBreakDurationSeconds = 1,
			TimeoutSeconds = 10,
		});

		PollyIntegrationClient client = new(httpClient, cache, rateLimiterMock.Object, loggerMock.Object, options);

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

	/// <summary>
	/// Tests timeout policy cancels long-running requests.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous unit test.</returns>
	[Fact]
	public async Task TimeoutPolicy_SlowResponse_CancelsRequestAsync()
	{
		// Arrange
		Mock<HttpMessageHandler> handlerMock = new();
		handlerMock
			.Protected()
			.Setup<Task<HttpResponseMessage>>(
				"SendAsync",
				ItExpr.IsAny<HttpRequestMessage>(),
				ItExpr.IsAny<CancellationToken>())
			.Returns(async () =>
			{
				await Task.Delay(TimeSpan.FromSeconds(15));
				return new HttpResponseMessage(HttpStatusCode.OK);
			});

		HttpClient httpClient = new(handlerMock.Object)
		{
			BaseAddress = new Uri("https://api.example.com/"),
		};

		MemoryCache cache = new(new MemoryCacheOptions());
		Mock<IRateLimitingService> rateLimiterMock = new();
		rateLimiterMock.Setup(r => r.CanMakeRequestAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);
		rateLimiterMock.Setup(r => r.TryIncrementRequestCountAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);

		Mock<ILogger<PollyIntegrationClient>> loggerMock = new();

		IOptions<PollyOptions> options = Options.Create(new PollyOptions
		{
			RetryCount = 1,
			CircuitBreakerFailureThreshold = 5,
			CircuitBreakerSamplingDurationSeconds = 60,
			CircuitBreakerBreakDurationSeconds = 30,
			TimeoutSeconds = 2,
		});

		PollyIntegrationClient client = new(httpClient, cache, rateLimiterMock.Object, loggerMock.Object, options);

		// Act & Assert
		await Assert.ThrowsAnyAsync<Exception>(async () =>
			await client.GetAsync<dynamic>("test", "TestApi", cancellationToken: CancellationToken.None));
	}
}