// <copyright file="RateLimitingMiddleware.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Concurrent;

namespace SeventySix.Api.Middleware;

/// <summary>
/// Rate limiting middleware to prevent API abuse.
/// Implements a sliding window rate limiter that tracks requests per client IP address.
/// </summary>
/// <remarks>
/// This middleware implements the Throttling pattern to protect the API from abuse and ensure
/// fair resource allocation across clients.
///
/// Configuration:
/// - Maximum requests: 100 per minute per IP address
/// - Time window: 60 seconds (sliding window)
/// - Cleanup threshold: 10,000 client entries
/// - Cleanup age: 5 minutes
///
/// The middleware returns HTTP 429 (Too Many Requests) when the rate limit is exceeded,
/// with a Retry-After header indicating when the client can retry.
///
/// Thread Safety: Uses ConcurrentDictionary and locking for thread-safe operation.
/// Memory Management: Automatically cleans up old client entries to prevent memory leaks.
/// </remarks>
/// <remarks>
/// Initializes a new instance of the <see cref="RateLimitingMiddleware"/> class.
/// </remarks>
/// <param name="next">The next middleware in the pipeline.</param>
/// <param name="logger">The logger instance for recording rate limit violations.</param>
/// <exception cref="ArgumentNullException">Thrown when next or logger is null.</exception>
public class RateLimitingMiddleware(
	RequestDelegate next)
{
	private static readonly ConcurrentDictionary<string, RateLimitInfo> Clients = new();

	/// <summary>
	/// Maximum number of requests allowed per time window.
	/// </summary>
	private const int MAX_REQUESTS_PER_MINUTE = 100;

	/// <summary>
	/// Time window in seconds for rate limiting.
	/// </summary>
	private const int TIME_WINDOW_SECONDS = 60;

	/// <summary>
	/// Invokes the rate limiting middleware to check and enforce request limits.
	/// </summary>
	/// <param name="context">The HTTP context for the current request.</param>
	/// <returns>A task that represents the asynchronous operation.</returns>
	/// <remarks>
	/// This method:
	/// 1. Extracts the client IP address from the connection
	/// 2. Checks if the client has exceeded the rate limit
	/// 3. Returns 429 if limit exceeded, otherwise proceeds to next middleware
	/// 4. Periodically cleans up old client entries to manage memory
	/// </remarks>
	public async Task InvokeAsync(HttpContext context)
	{
		string? clientIp = context.Connection.RemoteIpAddress?.ToString();

		if (string.IsNullOrEmpty(clientIp))
		{
			await next(context);
			return;
		}

		RateLimitInfo clientInfo = Clients.GetOrAdd(clientIp, _ => new RateLimitInfo());

		// Clean up old entries periodically
		if (Clients.Count > 10000)
		{
			CleanupOldEntries();
		}

		// Check rate limit
		if (!clientInfo.AllowRequest())
		{
			context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
			context.Response.Headers.RetryAfter = TIME_WINDOW_SECONDS.ToString();

			await context.Response.WriteAsJsonAsync(new
			{
				error = "Too Many Requests",
				message = $"Rate limit exceeded. Maximum {MAX_REQUESTS_PER_MINUTE} requests per minute allowed.",
				retryAfter = TIME_WINDOW_SECONDS
			});

			return;
		}

		await next(context);
	}

	/// <summary>
	/// Removes client entries that haven't made requests in the last 5 minutes.
	/// </summary>
	/// <remarks>
	/// This method prevents unbounded memory growth by removing stale entries.
	/// Called when the client dictionary exceeds 10,000 entries.
	/// </remarks>
	private static void CleanupOldEntries()
	{
		DateTime cutoff = DateTime.UtcNow.AddMinutes(-5);

		foreach (KeyValuePair<string, RateLimitInfo> client in Clients)
		{
			if (client.Value.LastRequestTime < cutoff)
			{
				Clients.TryRemove(client.Key, out _);
			}
		}
	}

	/// <summary>
	/// Tracks rate limit information for a single client.
	/// </summary>
	/// <remarks>
	/// Uses a sliding window algorithm with a queue to track request timestamps.
	/// Thread-safe implementation using lock for concurrent request handling.
	/// </remarks>
	private class RateLimitInfo
	{
		private readonly Queue<DateTime> RequestTimes = new();
		private readonly Lock Lock = new();

		/// <summary>
		/// Gets the timestamp of the most recent request from this client.
		/// </summary>
		public DateTime LastRequestTime { get; private set; } = DateTime.UtcNow;

		/// <summary>
		/// Checks if a new request should be allowed based on the rate limit.
		/// </summary>
		/// <returns>True if the request is allowed; otherwise, false.</returns>
		/// <remarks>
		/// This method:
		/// 1. Removes requests outside the current time window
		/// 2. Checks if the number of requests exceeds the limit
		/// 3. Adds the current request timestamp if allowed
		/// </remarks>
		public bool AllowRequest()
		{
			lock (Lock)
			{
				DateTime now = DateTime.UtcNow;
				LastRequestTime = now;

				// Remove requests outside the time window
				while (RequestTimes.Count > 0 && RequestTimes.Peek() < now.AddSeconds(-TIME_WINDOW_SECONDS))
				{
					RequestTimes.Dequeue();
				}

				// Check if limit exceeded
				if (RequestTimes.Count >= MAX_REQUESTS_PER_MINUTE)
				{
					return false;
				}

				RequestTimes.Enqueue(now);
				return true;
			}
		}
	}
}