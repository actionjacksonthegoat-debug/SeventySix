// <copyright file="IPollyIntegrationClient.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Api.Infrastructure;

/// <summary>HTTP client with Polly resilience policies (retry, circuit breaker, timeout, rate limiting).</summary>
public interface IPollyIntegrationClient
{
	/// <summary>GET request with policies applied.</summary>
	public Task<T?> GetAsync<T>(
		string url,
		string apiName,
		string? cacheKey = null,
		TimeSpan? cacheDuration = null,
		CancellationToken cancellationToken = default)
		where T : class;

	/// <summary>POST request with policies applied.</summary>
	public Task<TResponse?> PostAsync<TRequest, TResponse>(
		string url,
		TRequest body,
		string apiName,
		CancellationToken cancellationToken = default)
		where TRequest : class
		where TResponse : class;

	/// <summary>Raw HTTP GET request with policies.</summary>
	public Task<HttpResponseMessage> SendAsync(
		string url,
		string apiName,
		CancellationToken cancellationToken = default);

	/// <summary>Checks if request is allowed under rate limits.</summary>
	public Task<bool> CanMakeRequestAsync(string apiName, CancellationToken cancellationToken = default);

	/// <summary>Gets remaining API quota.</summary>
	public Task<int> GetRemainingQuotaAsync(string apiName, CancellationToken cancellationToken = default);
}