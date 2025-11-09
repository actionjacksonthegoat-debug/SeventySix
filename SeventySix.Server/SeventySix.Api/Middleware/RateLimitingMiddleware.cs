// <copyright file="RateLimitingMiddleware.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Concurrent;

namespace SeventySix.Api.Middleware;

/// <summary>
/// Rate limiting middleware.
/// Prevents abuse by limiting the number of requests from a single IP address.
/// </summary>
public class RateLimitingMiddleware
{
	private readonly RequestDelegate _next;
	private readonly ILogger<RateLimitingMiddleware> _logger;
	private static readonly ConcurrentDictionary<string, RateLimitInfo> _clients = new();
	private const int MaxRequestsPerMinute = 100;
	private const int TimeWindowSeconds = 60;

	public RateLimitingMiddleware(
		RequestDelegate next,
		ILogger<RateLimitingMiddleware> logger)
	{
		_next = next;
		_logger = logger;
	}

	public async Task InvokeAsync(HttpContext context)
	{
		string? clientIp = context.Connection.RemoteIpAddress?.ToString();

		if (string.IsNullOrEmpty(clientIp))
		{
			await _next(context);
			return;
		}

		RateLimitInfo clientInfo = _clients.GetOrAdd(clientIp, _ => new RateLimitInfo());

		// Clean up old entries periodically
		if (_clients.Count > 10000)
		{
			CleanupOldEntries();
		}

		// Check rate limit
		if (!clientInfo.AllowRequest())
		{
			_logger.LogWarning("Rate limit exceeded for IP: {ClientIp}", clientIp);

			context.Response.StatusCode = StatusCodes.Status429TooManyRequests;
			context.Response.Headers["Retry-After"] = TimeWindowSeconds.ToString();

			await context.Response.WriteAsJsonAsync(new
			{
				error = "Too Many Requests",
				message = $"Rate limit exceeded. Maximum {MaxRequestsPerMinute} requests per minute allowed.",
				retryAfter = TimeWindowSeconds
			});

			return;
		}

		await _next(context);
	}

	private static void CleanupOldEntries()
	{
		DateTime cutoff = DateTime.UtcNow.AddMinutes(-5);

		foreach (KeyValuePair<string, RateLimitInfo> client in _clients)
		{
			if (client.Value.LastRequestTime < cutoff)
			{
				_clients.TryRemove(client.Key, out _);
			}
		}
	}

	private class RateLimitInfo
	{
		private readonly Queue<DateTime> _requestTimes = new();
		private readonly object _lock = new();

		public DateTime LastRequestTime { get; private set; } = DateTime.UtcNow;

		public bool AllowRequest()
		{
			lock (_lock)
			{
				DateTime now = DateTime.UtcNow;
				LastRequestTime = now;

				// Remove requests outside the time window
				while (_requestTimes.Count > 0 && _requestTimes.Peek() < now.AddSeconds(-TimeWindowSeconds))
				{
					_requestTimes.Dequeue();
				}

				// Check if limit exceeded
				if (_requestTimes.Count >= MaxRequestsPerMinute)
				{
					return false;
				}

				_requestTimes.Enqueue(now);
				return true;
			}
		}
	}
}
