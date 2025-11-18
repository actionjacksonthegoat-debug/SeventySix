// <copyright file="PollyIntegrationClient.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Polly;
using Polly.CircuitBreaker;
using Polly.Retry;
using Polly.Timeout;
using SeventySix.BusinessLogic.Configuration;
using SeventySix.BusinessLogic.Interfaces;

namespace SeventySix.Data.Services;

/// <summary>
/// Generic HTTP client with Polly resilience policies.
/// </summary>
/// <remarks>
/// Implements the Proxy pattern, wrapping HttpClient with resilience policies:
/// - Retry Policy: Handles transient failures with exponential backoff
/// - Circuit Breaker: Prevents cascading failures
/// - Timeout Policy: Prevents hanging requests
/// - Rate Limiting: Enforces API call quotas (APPLICATION-WIDE, database-backed)
/// - Caching: Reduces unnecessary API calls
///
/// IMPORTANT - TWO-LAYER RATE LIMITING:
/// This service enforces EXTERNAL API quotas (e.g., OpenWeather 250 calls/day).
/// This is SEPARATE from the HTTP middleware rate limiting which protects YOUR API endpoints.
///
/// - Layer 1 (HTTP): AttributeBasedRateLimitingMiddleware - protects YOUR API from client abuse
/// - Layer 2 (External): RateLimitingService (this) - protects YOU from exceeding external API quotas
///
/// This rate limiting is ALWAYS enforced regardless of where the API is called from because
/// ALL external API calls MUST go through IPollyIntegrationClient/PollyIntegrationClient.
///
/// Design Patterns:
/// - Proxy: Adds resilience behavior to HttpClient
/// - Chain of Responsibility: Policy pipeline
/// - Strategy: Different policies for different scenarios
///
/// SOLID Principles:
/// - SRP: Only responsible for HTTP communication with policies
/// - OCP: Policies are configurable and extensible
/// - DIP: Depends on abstractions (IMemoryCache, IRateLimitingService)
/// </remarks>
public class PollyIntegrationClient : IPollyIntegrationClient
{
	private readonly HttpClient HttpClient;
	private readonly IMemoryCache Cache;
	private readonly IRateLimitingService RateLimitingService;
	private readonly ILogger<PollyIntegrationClient> Logger;
	private readonly PollyOptions Options;
	private readonly ResiliencePipeline<HttpResponseMessage> ResiliencePipeline;

	// Add this field to cache the JsonSerializerOptions instance
	private static readonly JsonSerializerOptions CachedJsonSerializerOptions = new JsonSerializerOptions
	{
		PropertyNameCaseInsensitive = true,
	};

	/// <summary>
	/// Initializes a new instance of the <see cref="PollyIntegrationClient"/> class.
	/// </summary>
	/// <param name="httpClient">HTTP client instance.</param>
	/// <param name="cache">Memory cache for response caching.</param>
	/// <param name="rateLimitingService">Rate limiting service.</param>
	/// <param name="logger">Logger instance.</param>
	/// <param name="options">Polly configuration options.</param>
	public PollyIntegrationClient(
		HttpClient httpClient,
		IMemoryCache cache,
		IRateLimitingService rateLimitingService,
		ILogger<PollyIntegrationClient> logger,
		IOptions<PollyOptions> options)
	{
		HttpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
		Cache = cache ?? throw new ArgumentNullException(nameof(cache));
		RateLimitingService = rateLimitingService ?? throw new ArgumentNullException(nameof(rateLimitingService));
		Logger = logger ?? throw new ArgumentNullException(nameof(logger));
		Options = options?.Value ?? throw new ArgumentNullException(nameof(options));

		ResiliencePipeline = BuildResiliencePipeline();

		Logger.LogInformation(
			"PollyIntegrationClient initialized with retry={RetryCount}, timeout={TimeoutSeconds}s, circuit breaker threshold={CircuitBreakerThreshold}",
			Options.RetryCount,
			Options.TimeoutSeconds,
			Options.CircuitBreakerFailureThreshold);
	}

	/// <inheritdoc/>
	public async Task<T?> GetAsync<T>(
		string url,
		string apiName,
		string? cacheKey = null,
		TimeSpan? cacheDuration = null,
		CancellationToken cancellationToken = default)
		where T : class
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(url);
		ArgumentException.ThrowIfNullOrWhiteSpace(apiName);

		// Check cache first
		if (!string.IsNullOrWhiteSpace(cacheKey) && Cache.TryGetValue(cacheKey, out T? cachedValue))
		{
			Logger.LogDebug("Cache hit for key: {CacheKey}", cacheKey);
			return cachedValue;
		}

		// Check rate limit
		if (!await RateLimitingService.CanMakeRequestAsync(apiName, cancellationToken))
		{
			Logger.LogWarning(
				"Rate limit exceeded for {ApiName}. Quota: {Quota}, Resets in: {TimeUntilReset}",
				apiName,
				await RateLimitingService.GetRemainingQuotaAsync(apiName, cancellationToken),
				RateLimitingService.GetTimeUntilReset());

			// Try to return cached value even if expired
			if (!string.IsNullOrWhiteSpace(cacheKey) && Cache.TryGetValue($"{cacheKey}_stale", out T? staleValue))
			{
				Logger.LogInformation("Returning stale cached data due to rate limit");
				return staleValue;
			}

			throw new InvalidOperationException($"API rate limit exceeded for {apiName}. Resets in: {RateLimitingService.GetTimeUntilReset()}");
		}

		// Extract base URL from full URL
		string baseUrl = GetBaseUrl(url);

		try
		{
			// Execute request with resilience pipeline
			HttpResponseMessage response = await ResiliencePipeline.ExecuteAsync(
				async ct =>
				{
					Logger.LogDebug("Sending GET request to: {Url}", url);
					HttpResponseMessage httpResponse = await HttpClient.GetAsync(url, ct);

					// Increment rate limit counter on successful request
					await RateLimitingService.TryIncrementRequestCountAsync(apiName, baseUrl, ct);

					httpResponse.EnsureSuccessStatusCode();
					return httpResponse;
				},
				cancellationToken);

			// Deserialize response
			string content = await response.Content.ReadAsStringAsync(cancellationToken);
			T? result = JsonSerializer.Deserialize<T>(content, CachedJsonSerializerOptions);

			// Cache the result
			if (result is not null && !string.IsNullOrWhiteSpace(cacheKey))
			{
				TimeSpan duration = cacheDuration ?? TimeSpan.FromMinutes(5);
				Cache.Set(cacheKey, result, duration);
				Cache.Set($"{cacheKey}_stale", result, TimeSpan.FromHours(24)); // Keep stale copy for fallback

				Logger.LogDebug("Cached response with key: {CacheKey} for {Duration}", cacheKey, duration);
			}

			return result;
		}
		catch (BrokenCircuitException ex)
		{
			Logger.LogError(ex, "Circuit breaker is open for {ApiName}. Service may be unavailable.", apiName);

			// Try to return stale cached data
			if (!string.IsNullOrWhiteSpace(cacheKey) && Cache.TryGetValue($"{cacheKey}_stale", out T? staleValue))
			{
				Logger.LogInformation("Returning stale cached data due to circuit breaker");
				return staleValue;
			}

			throw;
		}
		catch (TimeoutRejectedException ex)
		{
			Logger.LogError(ex, "Request timeout for {ApiName} after {TimeoutSeconds}s", apiName, Options.TimeoutSeconds);
			throw;
		}
		catch (HttpRequestException ex)
		{
			Logger.LogError(ex, "HTTP request failed for {ApiName}: {Message}", apiName, ex.Message);
			throw;
		}
	}

	/// <inheritdoc/>
	public async Task<TResponse?> PostAsync<TRequest, TResponse>(
		string url,
		TRequest body,
		string apiName,
		CancellationToken cancellationToken = default)
		where TRequest : class
		where TResponse : class
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(url);
		ArgumentNullException.ThrowIfNull(body);
		ArgumentException.ThrowIfNullOrWhiteSpace(apiName);

		// Check rate limit
		if (!await RateLimitingService.CanMakeRequestAsync(apiName, cancellationToken))
		{
			Logger.LogWarning("Rate limit exceeded for {ApiName}", apiName);
			throw new InvalidOperationException($"API rate limit exceeded for {apiName}");
		}

		// Extract base URL from full URL
		string baseUrl = GetBaseUrl(url);

		try
		{
			// Execute request with resilience pipeline
			HttpResponseMessage response = await ResiliencePipeline.ExecuteAsync(
				async ct =>
				{
					string json = JsonSerializer.Serialize(body);
					StringContent content = new(json, Encoding.UTF8, "application/json");

					Logger.LogDebug("Sending POST request to: {Url}", url);
					HttpResponseMessage httpResponse = await HttpClient.PostAsync(url, content, ct);

					// Increment rate limit counter
					await RateLimitingService.TryIncrementRequestCountAsync(apiName, baseUrl, ct);

					httpResponse.EnsureSuccessStatusCode();
					return httpResponse;
				},
				cancellationToken);

			// Deserialize response
			string responseContent = await response.Content.ReadAsStringAsync(cancellationToken);
			return JsonSerializer.Deserialize<TResponse>(responseContent, CachedJsonSerializerOptions);
		}
		catch (Exception ex)
		{
			Logger.LogError(ex, "POST request failed for {ApiName}", apiName);
			throw;
		}
	}

	/// <inheritdoc/>
	public async Task<HttpResponseMessage> SendAsync(
		string url,
		string apiName,
		CancellationToken cancellationToken = default)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(url);
		ArgumentException.ThrowIfNullOrWhiteSpace(apiName);

		if (!await RateLimitingService.CanMakeRequestAsync(apiName, cancellationToken))
		{
			throw new InvalidOperationException($"API rate limit exceeded for {apiName}");
		}

		// Extract base URL from full URL
		string baseUrl = GetBaseUrl(url);

		HttpResponseMessage response = await ResiliencePipeline.ExecuteAsync(
			async ct =>
			{
				HttpResponseMessage httpResponse = await HttpClient.GetAsync(url, ct);
				await RateLimitingService.TryIncrementRequestCountAsync(apiName, baseUrl, ct);
				return httpResponse;
			},
			cancellationToken);

		return response;
	}

	/// <inheritdoc/>
	public async Task<bool> CanMakeRequestAsync(string apiName, CancellationToken cancellationToken = default) => await RateLimitingService.CanMakeRequestAsync(apiName, cancellationToken);

	/// <inheritdoc/>
	public async Task<int> GetRemainingQuotaAsync(string apiName, CancellationToken cancellationToken = default) => await RateLimitingService.GetRemainingQuotaAsync(apiName, cancellationToken);

	/// <summary>
	/// Extracts the base URL from a full URL.
	/// </summary>
	/// <param name="fullUrl">The full URL (e.g., "https://api.example.com/v1/endpoint").</param>
	/// <returns>The base URL (e.g., "https://api.example.com").</returns>
	private string GetBaseUrl(string fullUrl)
	{
		// If it's a relative URL, use the HttpClient's BaseAddress
		if (!Uri.TryCreate(fullUrl, UriKind.Absolute, out Uri? uri))
		{
			if (HttpClient.BaseAddress != null)
			{
				return HttpClient.BaseAddress.GetLeftPart(UriPartial.Authority);
			}

			// Fallback to a default if neither absolute URL nor BaseAddress
			throw new InvalidOperationException("Cannot determine base URL for rate limiting. URL must be absolute or HttpClient.BaseAddress must be set.");
		}

		return uri.GetLeftPart(UriPartial.Authority);
	}

	/// <summary>
	/// Builds the Polly resilience pipeline with retry, circuit breaker, and timeout policies.
	/// </summary>
	private ResiliencePipeline<HttpResponseMessage> BuildResiliencePipeline()
	{
		return new ResiliencePipelineBuilder<HttpResponseMessage>()
			.AddRetry(new RetryStrategyOptions<HttpResponseMessage>
			{
				MaxRetryAttempts = Options.RetryCount,
				Delay = TimeSpan.FromSeconds(Options.RetryDelaySeconds),
				BackoffType = DelayBackoffType.Exponential,
				UseJitter = Options.UseJitter,
				ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
					.Handle<HttpRequestException>()
					.Handle<TimeoutException>()
					.HandleResult(r => r.StatusCode == HttpStatusCode.TooManyRequests || r.StatusCode == HttpStatusCode.ServiceUnavailable),
				OnRetry = args =>
				{
					Logger.LogWarning(
						"Retry attempt {AttemptNumber} after {Delay}ms due to: {Exception}",
						args.AttemptNumber + 1,
						args.RetryDelay.TotalMilliseconds,
						args.Outcome.Exception?.Message ?? args.Outcome.Result?.StatusCode.ToString());
					return ValueTask.CompletedTask;
				},
			})
			.AddCircuitBreaker(new CircuitBreakerStrategyOptions<HttpResponseMessage>
			{
				FailureRatio = 0.5,
				MinimumThroughput = Options.CircuitBreakerFailureThreshold,
				SamplingDuration = TimeSpan.FromSeconds(Options.CircuitBreakerSamplingDurationSeconds),
				BreakDuration = TimeSpan.FromSeconds(Options.CircuitBreakerBreakDurationSeconds),
				ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
					.Handle<HttpRequestException>()
					.HandleResult(r => (int)r.StatusCode >= 500),
				OnOpened = args =>
				{
					Logger.LogError("Circuit breaker OPENED. Service calls will be blocked for {BreakDuration}s", Options.CircuitBreakerBreakDurationSeconds);
					return ValueTask.CompletedTask;
				},
				OnClosed = args =>
				{
					Logger.LogInformation("Circuit breaker CLOSED. Service calls resumed.");
					return ValueTask.CompletedTask;
				},
				OnHalfOpened = args =>
				{
					Logger.LogInformation("Circuit breaker HALF-OPEN. Testing service availability.");
					return ValueTask.CompletedTask;
				},
			})
			.AddTimeout(new TimeoutStrategyOptions
			{
				Timeout = TimeSpan.FromSeconds(Options.TimeoutSeconds),
				OnTimeout = args =>
				{
					Logger.LogError("Request timeout after {TimeoutSeconds}s", Options.TimeoutSeconds);
					return ValueTask.CompletedTask;
				},
			})
			.Build();
	}
}