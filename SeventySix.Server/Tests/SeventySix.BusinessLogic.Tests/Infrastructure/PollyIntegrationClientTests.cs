// <copyright file="PollyIntegrationClientTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using SeventySix.BusinessLogic.Configuration;
using SeventySix.BusinessLogic.Infrastructure;
using SeventySix.BusinessLogic.Interfaces;

namespace SeventySix.Data.Tests.Services;

/// <summary>
/// Unit tests for PollyIntegrationClient.
/// </summary>
public class PollyIntegrationClientTests : IDisposable
{
	private readonly Mock<IRateLimitingService> MockRateLimiter;
	private readonly Mock<ILogger<PollyIntegrationClient>> MockLogger;
	private readonly IMemoryCache Cache;
	private readonly PollyOptions Options;
	private readonly Mock<HttpMessageHandler> MockHttpMessageHandler;
	private readonly HttpClient HttpClient;
	private bool Disposed;

	public PollyIntegrationClientTests()
	{
		MockRateLimiter = new Mock<IRateLimitingService>();
		MockLogger = new Mock<ILogger<PollyIntegrationClient>>();
		Cache = new MemoryCache(new MemoryCacheOptions());
		Options = new PollyOptions
		{
			RetryCount = 2,
			RetryDelaySeconds = 1,
			TimeoutSeconds = 5,
			CircuitBreakerFailureThreshold = 3,
			CircuitBreakerBreakDurationSeconds = 10,
			CircuitBreakerSamplingDurationSeconds = 60,
			UseJitter = false,
		};

		MockHttpMessageHandler = new Mock<HttpMessageHandler>();
		HttpClient = new HttpClient(MockHttpMessageHandler.Object)
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
		MockRateLimiter.Verify(r => r.CanMakeRequestAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
	}

	[Fact]
	public async Task GetAsync_WhenRateLimitExceeded_ShouldThrowExceptionAsync()
	{
		// Arrange
		const string url = "/test";
		const string apiName = "TestApi";

		MockRateLimiter.Setup(r => r.CanMakeRequestAsync(apiName, It.IsAny<CancellationToken>())).ReturnsAsync(false);
		MockRateLimiter.Setup(r => r.GetTimeUntilReset()).Returns(TimeSpan.FromHours(1));

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

		MockRateLimiter.Setup(r => r.CanMakeRequestAsync(apiName, It.IsAny<CancellationToken>())).ReturnsAsync(true);

		MockHttpMessageHandler.Protected()
			.Setup<Task<HttpResponseMessage>>(
				"SendAsync",
				ItExpr.IsAny<HttpRequestMessage>(),
				ItExpr.IsAny<CancellationToken>())
			.ReturnsAsync(new HttpResponseMessage
			{
				StatusCode = HttpStatusCode.OK,
				Content = new StringContent("{\"value\":\"success\"}"),
			});

		PollyIntegrationClient sut = CreateSut();

		// Act
		TestResponse? result = await sut.GetAsync<TestResponse>(url, apiName, cacheKey);

		// Assert
		Assert.NotNull(result);
		Assert.Equal("success", result.Value);
		MockRateLimiter.Verify(r => r.TryIncrementRequestCountAsync(apiName, It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);

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
		MockRateLimiter.Setup(r => r.CanMakeRequestAsync(apiName, It.IsAny<CancellationToken>())).ReturnsAsync(true);

		PollyIntegrationClient sut = CreateSut();

		// Act
		bool result = await sut.CanMakeRequestAsync(apiName);

		// Assert
		Assert.True(result);
		MockRateLimiter.Verify(r => r.CanMakeRequestAsync(apiName, It.IsAny<CancellationToken>()), Times.Once);
	}

	[Fact]
	public async Task GetRemainingQuota_ShouldDelegateToRateLimiterAsync()
	{
		// Arrange
		const string apiName = "TestApi";
		MockRateLimiter.Setup(r => r.GetRemainingQuotaAsync(apiName, It.IsAny<CancellationToken>())).ReturnsAsync(500);

		PollyIntegrationClient sut = CreateSut();

		// Act
		int result = await sut.GetRemainingQuotaAsync(apiName);

		// Assert
		Assert.Equal(500, result);
		MockRateLimiter.Verify(r => r.GetRemainingQuotaAsync(apiName, It.IsAny<CancellationToken>()), Times.Once);
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
			MockRateLimiter.Object,
			MockLogger.Object,
			Microsoft.Extensions.Options.Options.Create(Options));
	}

	private class TestResponse
	{
		public string Value { get; set; } = string.Empty;
	}
}