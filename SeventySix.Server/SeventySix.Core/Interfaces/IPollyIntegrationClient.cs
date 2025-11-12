// <copyright file="IPollyIntegrationClient.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Core.Interfaces;

/// <summary>
/// Interface for HTTP client with Polly resilience policies.
/// </summary>
/// <remarks>
/// Provides a generic HTTP client wrapper with:
/// - Retry policy (transient failure handling)
/// - Circuit breaker (prevent cascading failures)
/// - Timeout policy (prevent hanging requests)
/// - Rate limiting integration
/// - Response caching
/// </remarks>
public interface IPollyIntegrationClient
{
	/// <summary>
	/// Sends a GET request with Polly policies applied.
	/// </summary>
	/// <typeparam name="T">The response type to deserialize.</typeparam>
	/// <param name="url">The request URL.</param>
	/// <param name="apiName">The API name for rate limiting.</param>
	/// <param name="cacheKey">Optional cache key for response caching.</param>
	/// <param name="cacheDuration">Optional cache duration override.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Deserialized response or cached data.</returns>
	public Task<T?> GetAsync<T>(
		string url,
		string apiName,
		string? cacheKey = null,
		TimeSpan? cacheDuration = null,
		CancellationToken cancellationToken = default)
		where T : class;

	/// <summary>
	/// Sends a POST request with Polly policies applied.
	/// </summary>
	/// <typeparam name="TRequest">The request body type.</typeparam>
	/// <typeparam name="TResponse">The response type to deserialize.</typeparam>
	/// <param name="url">The request URL.</param>
	/// <param name="body">The request body.</param>
	/// <param name="apiName">The API name for rate limiting.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Deserialized response.</returns>
	public Task<TResponse?> PostAsync<TRequest, TResponse>(
		string url,
		TRequest body,
		string apiName,
		CancellationToken cancellationToken = default)
		where TRequest : class
		where TResponse : class;

	/// <summary>
	/// Sends a raw HTTP GET request with Polly policies.
	/// </summary>
	/// <param name="url">The request URL.</param>
	/// <param name="apiName">The API name for rate limiting.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>HTTP response message.</returns>
	public Task<HttpResponseMessage> SendAsync(
		string url,
		string apiName,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Checks if a request can be made without exceeding rate limits.
	/// </summary>
	/// <param name="apiName">The API name.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>True if request is allowed.</returns>
	public Task<bool> CanMakeRequestAsync(string apiName, CancellationToken cancellationToken = default);

	/// <summary>
	/// Gets the remaining API quota for the specified API.
	/// </summary>
	/// <param name="apiName">The API name.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Remaining request count.</returns>
	public Task<int> GetRemainingQuotaAsync(string apiName, CancellationToken cancellationToken = default);
}