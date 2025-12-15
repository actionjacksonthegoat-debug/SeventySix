// <copyright file="PollyIntegrationClientTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using NSubstitute;
using SeventySix.Api.Infrastructure;
using SeventySix.Shared.Interfaces;
using SeventySix.Shared.Settings;
using SeventySix.TestUtilities.TestHelpers;

namespace SeventySix.Api.Tests.Infrastructure.Services;

/// <summary>
/// Unit tests for PollyIntegrationClient.
/// </summary>
public class PollyIntegrationClientTests : IDisposable
{
	private readonly IRateLimitingService RateLimiter;
	private readonly ILoggerFactory LoggerFactory;
	private readonly IMemoryCache Cache;
	private readonly PollyOptions Options;
	private readonly HttpClient HttpClient;
	private bool Disposed;

	public PollyIntegrationClientTests()
	{
		RateLimiter = Substitute.For<IRateLimitingService>();
		LoggerFactory = Substitute.For<ILoggerFactory>();
		LoggerFactory.CreateLogger(Arg.Any<string>()).Returns(Substitute.For<ILogger>());
		Cache = new MemoryCache(new MemoryCacheOptions());
		Options = new PollyOptions
		{
			RetryCount = 2,
			RetryDelaySeconds = 0,  // Zero delay for fast test execution
			TimeoutSeconds = 5,
			CircuitBreakerFailureThreshold = 3,
			CircuitBreakerBreakDurationSeconds = 1,  // Polly minimum is 0.5s
			CircuitBreakerSamplingDurationSeconds = 60,
			UseJitter = false,
		};

		MockHttpMessageHandler handler = new((request, cancellationToken) =>
			Task.FromResult(new HttpResponseMessage
			{
				StatusCode = HttpStatusCode.OK,
				Content = new StringContent("{\"value\":\"success\"}"),
			}));

		HttpClient = new HttpClient(handler)
		{
			BaseAddress = new Uri("https://api.test.com"),
		};
	}

	[Fact]
	public async Task GetAsync_WhenCacheHit_ShouldReturnFromCacheAsync()
	{
		// Arrange
		const string url = "/test";
		const string apiName = "TestApi";
		const string cacheKey = "test-key";
		TestResponse expectedData = new() { Value = "cached" };

		Cache.Set(cacheKey, expectedData);

		PollyIntegrationClient sut = CreateSut();

		// Act
		TestResponse? result = await sut.GetAsync<TestResponse>(url, apiName, cacheKey);

		// Assert
		Assert.NotNull(result);
		Assert.Equal("cached", result.Value);
		await RateLimiter.DidNotReceive().CanMakeRequestAsync(Arg.Any<string>(), Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task GetAsync_WhenRateLimitExceeded_ShouldThrowExceptionAsync()
	{
		// Arrange
		const string url = "/test";
		const string apiName = "TestApi";

		RateLimiter.CanMakeRequestAsync(apiName, Arg.Any<CancellationToken>()).Returns(false);
		RateLimiter.GetTimeUntilReset().Returns(TimeSpan.FromHours(1));

		PollyIntegrationClient sut = CreateSut();

		// Act & Assert
		await Assert.ThrowsAsync<InvalidOperationException>(
			async () => await sut.GetAsync<TestResponse>(url, apiName));
	}

	[Fact]
	public async Task GetAsync_WhenSuccessfulRequest_ShouldCacheResultAsync()
	{
		// Arrange
		const string url = "/test";
		const string apiName = "TestApi";
		const string cacheKey = "test-key";

		RateLimiter.CanMakeRequestAsync(apiName, Arg.Any<CancellationToken>()).Returns(true);
		RateLimiter.TryIncrementRequestCountAsync(apiName, Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns(true);

		PollyIntegrationClient sut = CreateSut();

		// Act
		TestResponse? result = await sut.GetAsync<TestResponse>(url, apiName, cacheKey);

		// Assert
		Assert.NotNull(result);
		Assert.Equal("success", result.Value);
		await RateLimiter.Received(1).TryIncrementRequestCountAsync(apiName, Arg.Any<string>(), Arg.Any<CancellationToken>());

		// Verify cached
		Assert.True(Cache.TryGetValue(cacheKey, out TestResponse? cached));
		Assert.Equal("success", cached?.Value);
	}

	[Fact]
	public async Task GetAsync_WhenUrlIsNull_ShouldThrowArgumentExceptionAsync()
	{
		// Arrange
		PollyIntegrationClient sut = CreateSut();

		// Act & Assert
		await Assert.ThrowsAsync<ArgumentNullException>(
			async () => await sut.GetAsync<TestResponse>(null!, "TestApi"));
	}

	[Fact]
	public async Task GetAsync_WhenApiNameIsNull_ShouldThrowArgumentExceptionAsync()
	{
		// Arrange
		PollyIntegrationClient sut = CreateSut();

		// Act & Assert
		await Assert.ThrowsAsync<ArgumentNullException>(
			async () => await sut.GetAsync<TestResponse>("/test", null!));
	}

	[Fact]
	public async Task CanMakeRequest_ShouldDelegateToRateLimiterAsync()
	{
		// Arrange
		const string apiName = "TestApi";
		RateLimiter.CanMakeRequestAsync(apiName, Arg.Any<CancellationToken>()).Returns(true);

		PollyIntegrationClient sut = CreateSut();

		// Act
		bool result = await sut.CanMakeRequestAsync(apiName);

		// Assert
		Assert.True(result);
		await RateLimiter.Received(1).CanMakeRequestAsync(apiName, Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task GetRemainingQuota_ShouldDelegateToRateLimiterAsync()
	{
		// Arrange
		const string apiName = "TestApi";
		RateLimiter.GetRemainingQuotaAsync(apiName, Arg.Any<CancellationToken>()).Returns(500);

		PollyIntegrationClient sut = CreateSut();

		// Act
		int result = await sut.GetRemainingQuotaAsync(apiName);

		// Assert
		Assert.Equal(500, result);
		await RateLimiter.Received(1).GetRemainingQuotaAsync(apiName, Arg.Any<CancellationToken>());
	}

	public void Dispose()
	{
		if (Disposed)
		{
			return;
		}

		HttpClient?.Dispose();
		Cache?.Dispose();
		Disposed = true;
		GC.SuppressFinalize(this);
	}

	private PollyIntegrationClient CreateSut()
	{
		return new PollyIntegrationClient(
			HttpClient,
			Cache,
			RateLimiter,
			LoggerFactory,
			Microsoft.Extensions.Options.Options.Create(Options));
	}

	private class TestResponse
	{
		public string Value { get; set; } = string.Empty;
	}
}
