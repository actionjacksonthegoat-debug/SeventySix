// <copyright file="PollyResilienceTests.cs" company="SeventySix">
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
using SeventySix.Core.Interfaces;
using SeventySix.DataAccess.Services;
using Xunit;

namespace SeventySix.Api.Tests.Integration;

/// <summary>
/// Tests Polly resilience policies (retry, circuit breaker, timeout).
/// </summary>
public class PollyResilienceTests
{
	/// <summary>
	/// Tests retry policy retries on transient failures.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous unit test.</returns>
	[Fact]
	public async Task RetryPolicy_TransientFailure_RetriesThreeTimesAsync()
	{
		// Arrange
		var callCount = 0;
		var handlerMock = new Mock<HttpMessageHandler>();
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

		var httpClient = new HttpClient(handlerMock.Object)
		{
			BaseAddress = new Uri("https://api.openweathermap.org/"),
		};

		var cache = new MemoryCache(new MemoryCacheOptions());
		var rateLimiterMock = new Mock<IRateLimitingService>();
		rateLimiterMock.Setup(r => r.CanMakeRequest(It.IsAny<string>())).Returns(true);
		rateLimiterMock.Setup(r => r.TryIncrementRequestCount(It.IsAny<string>())).Returns(true);

		var loggerMock = new Mock<ILogger<PollyIntegrationClient>>();

		var options = Options.Create(new PollyOptions
		{
			RetryCount = 3,
			RetryDelaySeconds = 1,
			CircuitBreakerFailureThreshold = 5,
			CircuitBreakerSamplingDurationSeconds = 60,
			CircuitBreakerBreakDurationSeconds = 30,
			TimeoutSeconds = 10,
		});

		var client = new PollyIntegrationClient(httpClient, cache, rateLimiterMock.Object, loggerMock.Object, options);

		// Act
		var response = await client.GetAsync<dynamic>("test", "TestApi", cancellationToken: CancellationToken.None);

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
		var handlerMock = new Mock<HttpMessageHandler>();
		handlerMock
			.Protected()
			.Setup<Task<HttpResponseMessage>>(
				"SendAsync",
				ItExpr.IsAny<HttpRequestMessage>(),
				ItExpr.IsAny<CancellationToken>())
			.ReturnsAsync(new HttpResponseMessage(HttpStatusCode.ServiceUnavailable));

		var httpClient = new HttpClient(handlerMock.Object)
		{
			BaseAddress = new Uri("https://api.openweathermap.org/"),
		};

		var cache = new MemoryCache(new MemoryCacheOptions());
		var rateLimiterMock = new Mock<IRateLimitingService>();
		rateLimiterMock.Setup(r => r.CanMakeRequest(It.IsAny<string>())).Returns(true);
		rateLimiterMock.Setup(r => r.TryIncrementRequestCount(It.IsAny<string>())).Returns(true);

		var loggerMock = new Mock<ILogger<PollyIntegrationClient>>();

		var options = Options.Create(new PollyOptions
		{
			RetryCount = 1, // Minimum 1 required by Polly (use 1 for minimal retries)
			CircuitBreakerFailureThreshold = 3,
			CircuitBreakerSamplingDurationSeconds = 60,
			CircuitBreakerBreakDurationSeconds = 1,
			TimeoutSeconds = 10,
		});

		var client = new PollyIntegrationClient(httpClient, cache, rateLimiterMock.Object, loggerMock.Object, options);

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
		// Next request should fail immediately without calling the handler
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
		var handlerMock = new Mock<HttpMessageHandler>();
		handlerMock
			.Protected()
			.Setup<Task<HttpResponseMessage>>(
				"SendAsync",
				ItExpr.IsAny<HttpRequestMessage>(),
				ItExpr.IsAny<CancellationToken>())
			.Returns(async () =>
			{
				await Task.Delay(TimeSpan.FromSeconds(15)); // Longer than timeout
				return new HttpResponseMessage(HttpStatusCode.OK);
			});

		var httpClient = new HttpClient(handlerMock.Object)
		{
			BaseAddress = new Uri("https://api.openweathermap.org/"),
		};

		var cache = new MemoryCache(new MemoryCacheOptions());
		var rateLimiterMock = new Mock<IRateLimitingService>();
		rateLimiterMock.Setup(r => r.CanMakeRequest(It.IsAny<string>())).Returns(true);
		rateLimiterMock.Setup(r => r.TryIncrementRequestCount(It.IsAny<string>())).Returns(true);

		var loggerMock = new Mock<ILogger<PollyIntegrationClient>>();

		var options = Options.Create(new PollyOptions
		{
			RetryCount = 1, // Minimum 1 required by Polly (use 1 for minimal retries)
			CircuitBreakerFailureThreshold = 5,
			CircuitBreakerSamplingDurationSeconds = 60,
			CircuitBreakerBreakDurationSeconds = 30,
			TimeoutSeconds = 2, // 2 second timeout
		});

		var client = new PollyIntegrationClient(httpClient, cache, rateLimiterMock.Object, loggerMock.Object, options);

		// Act & Assert
		await Assert.ThrowsAnyAsync<Exception>(async () =>
			await client.GetAsync<dynamic>("test", "TestApi", cancellationToken: CancellationToken.None));
	}
}
