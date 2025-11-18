// <copyright file="AttributeBasedRateLimitingMiddleware.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Concurrent;
using Microsoft.AspNetCore.Mvc.Controllers;
using SeventySix.Api.Attributes;

namespace SeventySix.Api.Middleware;

/// <summary>
/// Attribute-aware rate limiting middleware that respects [RateLimit] attributes.
/// </summary>
/// <remarks>
/// This middleware reads rate limit configuration from [RateLimit] attributes
/// applied to controllers or actions. Falls back to global defaults when no
/// attribute is present.
///
/// <para>Priority (highest to lowest):</para>
/// <list type="number">
/// <item>Action-level [RateLimit] attribute</item>
/// <item>Controller-level [RateLimit] attribute</item>
/// <item>Global default (100 req/min)</item>
/// </list>
///
/// <para>Thread Safety:</para>
/// Uses ConcurrentDictionary and per-client locking for thread-safe operation.
///
/// <para>Memory Management:</para>
/// Automatically cleans up stale client entries to prevent memory leaks.
/// </remarks>
/// <remarks>
/// Initializes a new instance of the <see cref="AttributeBasedRateLimitingMiddleware"/> class.
/// </remarks>
/// <param name="next">The next middleware in the pipeline.</param>
/// <param name="logger">The logger instance.</param>
public class AttributeBasedRateLimitingMiddleware(
	RequestDelegate next)
{
	private static readonly ConcurrentDictionary<string, RateLimitInfo> Clients = new();

	// Global defaults (used when no attribute is present)
	private const int DEFAULT_MAX_REQUESTS = 250;
	private const int DEFAULT_WINDOW_SECONDS = 3600;

	/// <summary>
	/// Invokes the rate limiting middleware.
	/// </summary>
	/// <param name="context">The HTTP context.</param>
	/// <returns>A task representing the asynchronous operation.</returns>
	public async Task InvokeAsync(HttpContext context)
	{
		// Get rate limit configuration from attributes
		(int maxRequests, int windowSeconds, bool enabled) = GetRateLimitConfig(context);

		// Skip rate limiting if disabled by attribute
		if (!enabled)
		{
			await next(context);
			return;
		}

		string? clientIp = context.Connection.RemoteIpAddress?.ToString();

		if (string.IsNullOrEmpty(clientIp))
		{
			await next(context);
			return;
		}

		// Create unique key per IP + endpoint + config
		string rateLimitKey = $"{clientIp}:{context.Request.Path}:{maxRequests}:{windowSeconds}";
		RateLimitInfo clientInfo = Clients.GetOrAdd(rateLimitKey, _ => new RateLimitInfo());

		// Clean up old entries periodically
		if (Clients.Count > 10000)
		{
			CleanupOldEntries();
		}

		// Check rate limit
		if (!clientInfo.AllowRequest(maxRequests, windowSeconds))
		{
			context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
			context.Response.Headers.RetryAfter = windowSeconds.ToString();

			await context.Response.WriteAsJsonAsync(new
			{
				error = "Too Many Requests",
				message = $"Rate limit exceeded. Maximum {maxRequests} requests per {windowSeconds} seconds allowed.",
				retryAfter = windowSeconds
			});

			return;
		}

		await next(context);
	}

	/// <summary>
	/// Gets rate limit configuration from attributes or defaults.
	/// </summary>
	/// <param name="context">The HTTP context.</param>
	/// <returns>Tuple of (maxRequests, windowSeconds, enabled).</returns>
	private static (int maxRequests, int windowSeconds, bool enabled) GetRateLimitConfig(HttpContext context)
	{
		Endpoint? endpoint = context.GetEndpoint();
		if (endpoint == null)
		{
			return (DEFAULT_MAX_REQUESTS, DEFAULT_WINDOW_SECONDS, true);
		}

		// Check for action-level attribute first
		ControllerActionDescriptor? actionDescriptor = endpoint.Metadata.GetMetadata<ControllerActionDescriptor>();

		if (actionDescriptor?.MethodInfo.GetCustomAttributes(typeof(RateLimitAttribute), true)
			.FirstOrDefault() is RateLimitAttribute actionAttribute)
		{
			return (actionAttribute.MaxRequests, actionAttribute.WindowSeconds, actionAttribute.Enabled);
		}

		// Check for controller-level attribute

		if (actionDescriptor?.ControllerTypeInfo.GetCustomAttributes(typeof(RateLimitAttribute), true)
			.FirstOrDefault() is RateLimitAttribute controllerAttribute)
		{
			return (controllerAttribute.MaxRequests, controllerAttribute.WindowSeconds, controllerAttribute.Enabled);
		}

		// Use defaults
		return (DEFAULT_MAX_REQUESTS, DEFAULT_WINDOW_SECONDS, true);
	}

	/// <summary>
	/// Removes client entries that haven't made requests in the last 5 minutes.
	/// </summary>
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
	/// Tracks rate limit information for a single client+endpoint combination.
	/// </summary>
	private class RateLimitInfo
	{
		private readonly Queue<DateTime> RequestTimes = new();
		private readonly Lock Lock = new();

		/// <summary>
		/// Gets the timestamp of the most recent request.
		/// </summary>
		public DateTime LastRequestTime { get; private set; } = DateTime.UtcNow;

		/// <summary>
		/// Checks if a new request should be allowed based on the rate limit.
		/// </summary>
		/// <param name="maxRequests">Maximum requests allowed in the window.</param>
		/// <param name="windowSeconds">Time window in seconds.</param>
		/// <returns>True if the request is allowed; otherwise, false.</returns>
		public bool AllowRequest(int maxRequests, int windowSeconds)
		{
			lock (Lock)
			{
				DateTime now = DateTime.UtcNow;
				LastRequestTime = now;

				// Remove requests outside the time window
				while (RequestTimes.Count > 0 && RequestTimes.Peek() < now.AddSeconds(-windowSeconds))
				{
					RequestTimes.Dequeue();
				}

				// Check if limit exceeded
				if (RequestTimes.Count >= maxRequests)
				{
					return false;
				}

				RequestTimes.Enqueue(now);
				return true;
			}
		}
	}
}