// <copyright file="RateLimitingService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.BusinessLogic.Configuration;
using SeventySix.Core.Interfaces;

namespace SeventySix.DataAccess.Services;

/// <summary>
/// Thread-safe rate limiting service for API call tracking.
/// </summary>
/// <remarks>
/// Singleton service that tracks API calls per 24-hour period (midnight to midnight UTC).
/// Automatically resets counters at midnight UTC.
///
/// Design Patterns:
/// - Singleton: One instance tracks all API calls
/// - Thread-safe: ConcurrentDictionary for concurrent access
///
/// SOLID Principles:
/// - SRP: Only responsible for rate limiting logic
/// - OCP: Can be extended with different reset strategies
/// - DIP: Depends on IOptions abstraction for configuration
/// </remarks>
public class RateLimitingService : IRateLimitingService, IDisposable
{
	private readonly ILogger<RateLimitingService> Logger;
	private readonly OpenWeatherOptions Options;
	private readonly ConcurrentDictionary<string, RateLimitCounter> Counters;
	private readonly Timer ResetTimer;
	private bool Disposed;

	/// <summary>
	/// Initializes a new instance of the <see cref="RateLimitingService"/> class.
	/// </summary>
	/// <param name="logger">Logger instance.</param>
	/// <param name="options">OpenWeather configuration options.</param>
	public RateLimitingService(
		ILogger<RateLimitingService> logger,
		IOptions<OpenWeatherOptions> options)
	{
		Logger = logger ?? throw new ArgumentNullException(nameof(logger));
		Options = options?.Value ?? throw new ArgumentNullException(nameof(options));
		Counters = new ConcurrentDictionary<string, RateLimitCounter>();

		// Schedule automatic reset at midnight UTC
		ResetTimer = new Timer(ResetAllCounters, null, GetTimeUntilMidnight(), TimeSpan.FromDays(1));

		Logger.LogInformation(
			"RateLimitingService initialized. Daily limit: {DailyLimit}. Next reset: {ResetTime:yyyy-MM-dd HH:mm:ss} UTC",
			Options.DailyCallLimit,
			DateTime.UtcNow.Add(GetTimeUntilReset()));
	}

	/// <inheritdoc/>
	public bool CanMakeRequest(string apiName)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(apiName);

		RateLimitCounter counter = GetOrCreateCounter(apiName);

		// Check if counter has expired (past midnight UTC)
		if (DateTime.UtcNow.Date > counter.ResetDate.Date)
		{
			ResetCounter(apiName);
			counter = GetOrCreateCounter(apiName);
		}

		bool canMakeRequest = counter.Count < Options.DailyCallLimit;

		if (!canMakeRequest)
		{
			Logger.LogWarning(
				"Rate limit exceeded for API: {ApiName}. Count: {Count}/{Limit}. Resets in: {TimeUntilReset}",
				apiName,
				counter.Count,
				Options.DailyCallLimit,
				GetTimeUntilReset());
		}

		return canMakeRequest;
	}

	/// <inheritdoc/>
	public bool TryIncrementRequestCount(string apiName)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(apiName);

		if (!CanMakeRequest(apiName))
		{
			return false;
		}

		RateLimitCounter counter = GetOrCreateCounter(apiName);
		int newCount = Interlocked.Increment(ref counter.Count);

		Logger.LogDebug(
			"API call recorded for {ApiName}. Count: {Count}/{Limit}",
			apiName,
			newCount,
			Options.DailyCallLimit);

		// Warn when approaching limit
		if (newCount >= Options.DailyCallLimit * 0.9)
		{
			Logger.LogWarning(
				"Approaching rate limit for {ApiName}: {Count}/{Limit} ({Percentage:F1}%)",
				apiName,
				newCount,
				Options.DailyCallLimit,
				(double)newCount / Options.DailyCallLimit * 100);
		}

		return true;
	}

	/// <inheritdoc/>
	public int GetRequestCount(string apiName)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(apiName);

		RateLimitCounter counter = GetOrCreateCounter(apiName);
		return counter.Count;
	}

	/// <inheritdoc/>
	public int GetRemainingQuota(string apiName)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(apiName);

		RateLimitCounter counter = GetOrCreateCounter(apiName);
		return Math.Max(0, Options.DailyCallLimit - counter.Count);
	}

	/// <inheritdoc/>
	public TimeSpan GetTimeUntilReset()
	{
		DateTime now = DateTime.UtcNow;
		DateTime nextMidnight = now.Date.AddDays(1);
		return nextMidnight - now;
	}

	/// <inheritdoc/>
	public void ResetCounter(string apiName)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(apiName);

		Counters.AddOrUpdate(
			apiName,
			_ => new RateLimitCounter(),
			(_, _) => new RateLimitCounter());

		Logger.LogInformation("Rate limit counter reset for API: {ApiName}", apiName);
	}

	/// <summary>
	/// Gets or creates a rate limit counter for the specified API.
	/// </summary>
	private RateLimitCounter GetOrCreateCounter(string apiName)
	{
		return Counters.GetOrAdd(apiName, _ => new RateLimitCounter());
	}

	/// <summary>
	/// Calculates time until midnight UTC.
	/// </summary>
	private TimeSpan GetTimeUntilMidnight()
	{
		DateTime now = DateTime.UtcNow;
		DateTime nextMidnight = now.Date.AddDays(1);
		return nextMidnight - now;
	}

	/// <summary>
	/// Timer callback to reset all counters at midnight UTC.
	/// </summary>
	private void ResetAllCounters(object? state)
	{
		Logger.LogInformation("Automatic daily rate limit reset triggered at {Time:yyyy-MM-dd HH:mm:ss} UTC", DateTime.UtcNow);

		foreach (string apiName in Counters.Keys.ToList())
		{
			ResetCounter(apiName);
		}

		Logger.LogInformation("All rate limit counters have been reset. Next reset: {NextReset:yyyy-MM-dd HH:mm:ss} UTC",
			DateTime.UtcNow.Add(GetTimeUntilReset()));
	}

	/// <summary>
	/// Disposes the service and its resources.
	/// </summary>
	public void Dispose()
	{
		Dispose(true);
		GC.SuppressFinalize(this);
	}

	/// <summary>
	/// Disposes the service and its resources.
	/// </summary>
	/// <param name="disposing">Whether to dispose managed resources.</param>
	protected virtual void Dispose(bool disposing)
	{
		if (!Disposed)
		{
			if (disposing)
			{
				ResetTimer?.Dispose();
			}

			Disposed = true;
		}
	}

	/// <summary>
	/// Nested class representing a rate limit counter.
	/// </summary>
	private class RateLimitCounter
	{
		/// <summary>
		/// Gets the current request count.
		/// </summary>
		public int Count;

		/// <summary>
		/// Gets the date when this counter was created/reset.
		/// </summary>
		public DateTime ResetDate { get; } = DateTime.UtcNow;
	}
}
