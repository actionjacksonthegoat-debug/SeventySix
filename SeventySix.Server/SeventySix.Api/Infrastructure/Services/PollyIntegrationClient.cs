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
using Polly.Telemetry;
using Polly.Timeout;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Interfaces;
using SeventySix.Shared.Settings;

namespace SeventySix.Api.Infrastructure;

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
/// </remarks>
public class PollyIntegrationClient(
	HttpClient httpClient,
	IMemoryCache cache,
	IRateLimitingService rateLimitingService,
	ILoggerFactory loggerFactory,
	IOptions<PollyOptions> options) : IPollyIntegrationClient
{
	private readonly ILogger<PollyIntegrationClient> Logger =
		loggerFactory.CreateLogger<PollyIntegrationClient>();

	// Lazy initialization to avoid field initialization from constructor parameters
	private readonly Lazy<
		ResiliencePipeline<HttpResponseMessage>
	> LazyPipeline =
		new(() =>
			BuildResiliencePipeline(options.Value, loggerFactory));

	private ResiliencePipeline<HttpResponseMessage> ResiliencePipeline =>
		LazyPipeline.Value;

	// Cache the JsonSerializerOptions instance
	private static readonly JsonSerializerOptions CachedJsonSerializerOptions =
		new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

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
		if (
			!string.IsNullOrWhiteSpace(cacheKey)
			&& cache.TryGetValue(cacheKey, out T? cachedValue))
		{
			return cachedValue;
		}

		// Check rate limit
		if (
			!await rateLimitingService.CanMakeRequestAsync(
				apiName,
				cancellationToken))
		{
			Logger.LogWarning(
				"Rate limit exceeded for {ApiName}. Quota: {Quota}, Resets in: {TimeUntilReset}",
				apiName,
				await rateLimitingService.GetRemainingQuotaAsync(
					apiName,
					cancellationToken),
				rateLimitingService.GetTimeUntilReset());

			// Try to return cached value even if expired
			if (
				!string.IsNullOrWhiteSpace(cacheKey)
				&& cache.TryGetValue($"{cacheKey}_stale", out T? staleValue))
			{
				Logger.LogWarning(
					"Returning stale cached data due to rate limit for {ApiName}",
					apiName);
				return staleValue;
			}

			throw new InvalidOperationException(
				$"API rate limit exceeded for {apiName}. Resets in: {rateLimitingService.GetTimeUntilReset()}");
		}

		// Extract base URL from full URL
		string baseUrl =
			GetBaseUrl(url);

		try
		{
			// Execute request with resilience pipeline
			HttpResponseMessage response =
				await ResiliencePipeline.ExecuteAsync(
					async cancellation =>
					{
						HttpResponseMessage httpResponse =
							await httpClient.GetAsync(url, cancellation);

						// Increment rate limit counter on successful request
						await rateLimitingService.TryIncrementRequestCountAsync(
							apiName,
							baseUrl,
							cancellation);

						httpResponse.EnsureSuccessStatusCode();
						return httpResponse;
					},
					cancellationToken);

			// Deserialize response
			string content =
				await response.Content.ReadAsStringAsync(
					cancellationToken);
			T? result =
				JsonSerializer.Deserialize<T>(
					content,
					CachedJsonSerializerOptions);

			// Cache the result
			if (result is not null && !string.IsNullOrWhiteSpace(cacheKey))
			{
				TimeSpan duration =
					cacheDuration ?? TimeSpan.FromMinutes(5);
				cache.Set(cacheKey, result, duration);
				cache.Set($"{cacheKey}_stale", result, TimeSpan.FromHours(24)); // Keep stale copy for fallback
			}

			return result;
		}
		catch (BrokenCircuitException exception)
		{
			Logger.LogError(
				exception,
				"Circuit breaker is open for {ApiName}. Service may be unavailable.",
				apiName);

			// Try to return stale cached data
			if (
				!string.IsNullOrWhiteSpace(cacheKey)
				&& cache.TryGetValue($"{cacheKey}_stale", out T? staleValue))
			{
				Logger.LogWarning(
					"Returning stale cached data due to circuit breaker for {ApiName}",
					apiName);
				return staleValue;
			}

			throw;
		}
		catch (TimeoutRejectedException exception)
		{
			Logger.LogError(
				exception,
				"Request timeout for {ApiName} after {TimeoutSeconds}s",
				apiName,
				options.Value.TimeoutSeconds);
			throw;
		}
		catch (HttpRequestException exception)
		{
			Logger.LogError(
				exception,
				"HTTP request failed for {ApiName}: {Message}",
				apiName,
				exception.Message);
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
		if (
			!await rateLimitingService.CanMakeRequestAsync(
				apiName,
				cancellationToken))
		{
			Logger.LogWarning("Rate limit exceeded for {ApiName}", apiName);
			throw new InvalidOperationException(
				$"API rate limit exceeded for {apiName}");
		}

		// Extract base URL from full URL
		string baseUrl =
			GetBaseUrl(url);

		try
		{
			// Execute request with resilience pipeline
			HttpResponseMessage response =
				await ResiliencePipeline.ExecuteAsync(
					async cancellation =>
					{
						string json =
							JsonSerializer.Serialize(body);
						StringContent content =
							new(
								json,
								Encoding.UTF8,
								MediaTypeConstants.Json);

						HttpResponseMessage httpResponse =
							await httpClient.PostAsync(
								url,
								content,
								cancellation);

						// Increment rate limit counter
						await rateLimitingService.TryIncrementRequestCountAsync(
							apiName,
							baseUrl,
							cancellation);

						httpResponse.EnsureSuccessStatusCode();
						return httpResponse;
					},
					cancellationToken);

			// Deserialize response
			string responseContent =
				await response.Content.ReadAsStringAsync(
					cancellationToken);
			return JsonSerializer.Deserialize<TResponse>(
				responseContent,
				CachedJsonSerializerOptions);
		}
		catch (Exception exception)
		{
			Logger.LogError(
				exception,
				"POST request failed for {ApiName}",
				apiName);
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

		if (
			!await rateLimitingService.CanMakeRequestAsync(
				apiName,
				cancellationToken))
		{
			throw new InvalidOperationException(
				$"API rate limit exceeded for {apiName}");
		}

		// Extract base URL from full URL
		string baseUrl =
			GetBaseUrl(url);

		HttpResponseMessage response =
			await ResiliencePipeline.ExecuteAsync(
				async cancellation =>
				{
					HttpResponseMessage httpResponse =
						await httpClient.GetAsync(
						url,
						cancellation);
					await rateLimitingService.TryIncrementRequestCountAsync(
						apiName,
						baseUrl,
						cancellation);
					return httpResponse;
				},
				cancellationToken);

		return response;
	}

	/// <inheritdoc/>
	public async Task<bool> CanMakeRequestAsync(
		string apiName,
		CancellationToken cancellationToken = default) =>
		await rateLimitingService.CanMakeRequestAsync(
			apiName,
			cancellationToken);

	/// <inheritdoc/>
	public async Task<int> GetRemainingQuotaAsync(
		string apiName,
		CancellationToken cancellationToken = default) =>
		await rateLimitingService.GetRemainingQuotaAsync(
			apiName,
			cancellationToken);

	/// <summary>
	/// Extracts the base URL from a full URL.
	/// </summary>
	private string GetBaseUrl(string fullUrl)
	{
		// If it's a relative URL, use the HttpClient's BaseAddress
		if (!Uri.TryCreate(fullUrl, UriKind.Absolute, out Uri? uri))
		{
			if (httpClient.BaseAddress != null)
			{
				return httpClient.BaseAddress.GetLeftPart(UriPartial.Authority);
			}

			// Fallback to a default if neither absolute URL nor BaseAddress
			throw new InvalidOperationException(
				"Cannot determine base URL for rate limiting. URL must be absolute or httpClient.BaseAddress must be set.");
		}

		return uri.GetLeftPart(UriPartial.Authority);
	}

	/// <summary>
	/// Builds the Polly resilience pipeline with retry, circuit breaker, and timeout policies.
	/// </summary>
	private static ResiliencePipeline<HttpResponseMessage> BuildResiliencePipeline(
		PollyOptions pollyOptions,
		ILoggerFactory loggerFactory)
	{
		// Configure telemetry - suppress Debug/Info noise - only log Warning+ events
		TelemetryOptions telemetryOptions =
			new()
		{
			LoggerFactory = loggerFactory,
			SeverityProvider =
			args =>
				args.Event.Severity switch
				{
					ResilienceEventSeverity.Debug =>
						ResilienceEventSeverity.None,
					ResilienceEventSeverity.Information =>
						ResilienceEventSeverity.None,
					_ => args.Event.Severity,
				},
		};

		return new ResiliencePipelineBuilder<HttpResponseMessage>()
			.AddRetry(
				new RetryStrategyOptions<HttpResponseMessage>
				{
					Name = "HttpRetry",
					MaxRetryAttempts = pollyOptions.RetryCount,
					Delay =
			TimeSpan.FromSeconds(
				pollyOptions.RetryDelaySeconds),
					BackoffType =
			DelayBackoffType.Exponential,
					UseJitter = pollyOptions.UseJitter,
					ShouldHandle =
			new PredicateBuilder<HttpResponseMessage>()
				.Handle<HttpRequestException>()
				.Handle<TimeoutException>()
				.HandleResult(response =>
					response.StatusCode
						is HttpStatusCode.TooManyRequests
							or HttpStatusCode.ServiceUnavailable),
				})
			.AddCircuitBreaker(
				new CircuitBreakerStrategyOptions<HttpResponseMessage>
				{
					Name = "HttpCircuitBreaker",
					FailureRatio = 0.5,
					MinimumThroughput =
						pollyOptions.CircuitBreakerFailureThreshold,
					SamplingDuration =
			TimeSpan.FromSeconds(
				pollyOptions.CircuitBreakerSamplingDurationSeconds),
					BreakDuration =
			TimeSpan.FromSeconds(
				pollyOptions.CircuitBreakerBreakDurationSeconds),
					ShouldHandle =
			new PredicateBuilder<HttpResponseMessage>()
				.Handle<HttpRequestException>()
				.HandleResult(response =>
					(int)response.StatusCode >= 500),
				})
			.AddTimeout(
				new TimeoutStrategyOptions
				{
					Name = "HttpTimeout",
					Timeout =
			TimeSpan.FromSeconds(pollyOptions.TimeoutSeconds),
				})
			.ConfigureTelemetry(telemetryOptions)
			.Build();
	}
}
