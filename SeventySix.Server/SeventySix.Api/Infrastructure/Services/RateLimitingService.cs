// <copyright file="RateLimitingService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Options;
using SeventySix.ApiTracking;
using SeventySix.Shared;
using SeventySix.Shared.Interfaces;

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Database-backed rate limiting service for API call tracking.
/// </summary>
/// <remarks>
/// Scoped service that tracks API calls per day or month based on configuration.
/// Uses PostgreSQL for persistence across application restarts and horizontal scaling.
/// </remarks>
public class RateLimitingService(
	ILogger<RateLimitingService> logger,
	IThirdPartyApiRequestRepository repository,
	ITransactionManager transactionManager,
	IOptions<ThirdPartyApiLimitSettings> settings,
	TimeProvider timeProvider) : IRateLimitingService
{
	private readonly ThirdPartyApiLimitSettings RateLimitSettings =
		settings.Value;

	/// <inheritdoc/>
	public async Task<bool> CanMakeRequestAsync(
		string apiName,
		CancellationToken cancellationToken = default)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(apiName);

		// Get the interval configured for this API
		LimitInterval interval =
			RateLimitSettings.GetLimitInterval(apiName);

		return await CanMakeRequestAsync(
			apiName,
			interval,
			cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<bool> CanMakeRequestAsync(
		string apiName,
		LimitInterval interval,
		CancellationToken cancellationToken = default)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(apiName);

		// If rate limiting is disabled globally or for this API, allow the request
		if (!RateLimitSettings.IsApiRateLimitEnabled(apiName))
		{
			return true;
		}

		int limit =
			RateLimitSettings.GetLimit(apiName);
		int currentCount =
			await GetCurrentCountAsync(
				apiName,
				interval,
				cancellationToken);

		bool canMakeRequest =
			currentCount < limit;

		if (!canMakeRequest)
		{
			logger.LogWarning(
				"Rate limit exceeded for API: {ApiName}. Count: {Count}/{Limit}. Interval: {Interval}. Resets in: {TimeUntilReset}",
				apiName,
				currentCount,
				limit,
				interval,
				GetTimeUntilReset(interval));
		}

		return canMakeRequest;
	}

	/// <inheritdoc/>
	public async Task<bool> TryIncrementRequestCountAsync(
		string apiName,
		string baseUrl,
		CancellationToken cancellationToken = default)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(apiName);
		ArgumentException.ThrowIfNullOrWhiteSpace(baseUrl);

		// If rate limiting is disabled globally or for this API, always succeed without tracking
		if (!RateLimitSettings.IsApiRateLimitEnabled(apiName))
		{
			return true;
		}

		int limit =
			RateLimitSettings.GetLimit(apiName);
		LimitInterval interval =
			RateLimitSettings.GetLimitInterval(apiName);

		// Execute the entire operation in a transaction with automatic retry on conflicts
		return await transactionManager.ExecuteInTransactionAsync(
			cancellation =>
				IncrementRequestCountCoreAsync(
					apiName,
					baseUrl,
					limit,
					interval,
					cancellation),
			maxRetries: 5,
			cancellationToken); // Allow up to 5 retries for high-concurrency scenarios
	}

	/// <summary>
	/// Core logic for incrementing request count within a transaction.
	/// </summary>
	private async Task<bool> IncrementRequestCountCoreAsync(
		string apiName,
		string baseUrl,
		int limit,
		LimitInterval interval,
		CancellationToken cancellation)
	{
		DateOnly today =
			DateOnly.FromDateTime(
				timeProvider.GetUtcNow().UtcDateTime);

		// For monthly intervals, check the total across all days in the month
		if (interval == LimitInterval.Monthly)
		{
			int monthlyCount =
				await GetCurrentCountAsync(
					apiName,
					interval,
					cancellation);

			if (monthlyCount >= limit)
			{
				logger.LogWarning(
					"Cannot increment request count for {ApiName}. Monthly limit reached: {Count}/{Limit}",
					apiName,
					monthlyCount,
					limit);

				return false;
			}
		}

		ThirdPartyApiRequest? request =
			await repository.GetByApiNameAndDateAsync(
				apiName,
				today,
				cancellation);

		if (request == null)
		{
			return await CreateNewRequestRecordAsync(
				apiName,
				baseUrl,
				today);
		}

		return await IncrementExistingRecordAsync(
			request,
			apiName,
			limit,
			interval,
			cancellation);
	}

	/// <summary>
	/// Creates a new request record when no record exists for today.
	/// </summary>
	private async Task<bool> CreateNewRequestRecordAsync(
		string apiName,
		string baseUrl,
		DateOnly today)
	{
		ThirdPartyApiRequest request =
			new()
			{
				ApiName = apiName,
				BaseUrl = baseUrl,
				ResetDate = today,
			};

		// Use domain method to increment (sets CallCount = 1 and LastCalledAt = now)
		request.IncrementCallCount(
			timeProvider.GetUtcNow().UtcDateTime);

		await repository.CreateAsync(request);
		return true;
	}

	/// <summary>
	/// Increments an existing request record.
	/// </summary>
	private async Task<bool> IncrementExistingRecordAsync(
		ThirdPartyApiRequest request,
		string apiName,
		int limit,
		LimitInterval interval,
		CancellationToken cancellation)
	{
		// For daily limits, check today's count
		if (interval == LimitInterval.Daily && request.CallCount >= limit)
		{
			logger.LogWarning(
				"Cannot increment request count for {ApiName}. Daily limit reached: {Count}/{Limit}",
				apiName,
				request.CallCount,
				limit);

			return false;
		}

		// Increment counter using domain logic
		request.IncrementCallCount(
			timeProvider.GetUtcNow().UtcDateTime);

		// Update the record
		await repository.UpdateAsync(request);

		// Get current count for logging (monthly needs recalculation)
		int currentCount =
			interval == LimitInterval.Monthly
				? await GetCurrentCountAsync(
					apiName,
					interval,
					cancellation)
				: request.CallCount;

		// Warn when approaching limit (90%)
		if (currentCount >= limit * 0.9)
		{
			logger.LogWarning(
				"Approaching rate limit for {ApiName}: {Count}/{Limit} ({Percentage:F1}%) - {Interval}",
				apiName,
				currentCount,
				limit,
				(double)currentCount / limit * 100,
				interval);
		}


		return true;
	}

	/// <inheritdoc/>
	public async Task<int> GetRequestCountAsync(
		string apiName,
		CancellationToken cancellationToken = default)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(apiName);

		LimitInterval interval =
			RateLimitSettings.GetLimitInterval(apiName);

		return await GetCurrentCountAsync(
			apiName,
			interval,
			cancellationToken);
	}

	/// <inheritdoc/>
	public async Task<int> GetCurrentCountAsync(
		string apiName,
		LimitInterval interval,
		CancellationToken cancellationToken = default)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(apiName);

		DateTime utcNow =
			timeProvider.GetUtcNow().UtcDateTime;
		DateOnly today =
			DateOnly.FromDateTime(utcNow);

		if (interval == LimitInterval.Monthly)
		{
			// For monthly, sum all days from 1st of current month to today
			DateOnly monthStart =
				new(utcNow.Year, utcNow.Month, 1);

			return await repository.GetTotalCallCountInRangeAsync(
				apiName,
				monthStart,
				today,
				cancellationToken);
		}

		// For daily, just get today's count
		ThirdPartyApiRequest? request =
			await repository.GetByApiNameAndDateAsync(
				apiName,
				today,
				cancellationToken);

		return request?.CallCount ?? 0;
	}

	/// <inheritdoc/>
	public async Task<int> GetRemainingQuotaAsync(
		string apiName,
		CancellationToken cancellationToken = default)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(apiName);

		int limit =
			RateLimitSettings.GetLimit(apiName);
		LimitInterval interval =
			RateLimitSettings.GetLimitInterval(apiName);
		int currentCount =
			await GetCurrentCountAsync(
				apiName,
				interval,
				cancellationToken);

		return Math.Max(
			0,
			limit - currentCount);
	}

	/// <inheritdoc/>
	public TimeSpan GetTimeUntilReset()
	{
		// Default to daily for backward compatibility
		return GetTimeUntilReset(LimitInterval.Daily);
	}

	/// <summary>
	/// Gets the time until rate limit resets for the specified interval.
	/// </summary>
	/// <param name="interval">
	/// The limit interval.
	/// </param>
	/// <returns>
	/// Time remaining until the interval resets.
	/// </returns>
	private TimeSpan GetTimeUntilReset(LimitInterval interval)
	{
		DateTime utcNow =
			timeProvider.GetUtcNow().UtcDateTime;

		return interval switch
		{
			LimitInterval.Monthly => GetTimeUntilMonthlyReset(utcNow),
			_ => GetTimeUntilDailyReset(utcNow)
		};
	}

	/// <summary>
	/// Gets time until midnight UTC (daily reset).
	/// </summary>
	/// <param name="utcNow">
	/// Current UTC time.
	/// </param>
	/// <returns>
	/// Time remaining until midnight.
	/// </returns>
	private static TimeSpan GetTimeUntilDailyReset(DateTime utcNow)
	{
		DateTime nextMidnight =
			utcNow.Date.AddDays(1);

		return nextMidnight - utcNow;
	}

	/// <summary>
	/// Gets time until 1st of next month at midnight UTC (monthly reset).
	/// </summary>
	/// <param name="utcNow">
	/// Current UTC time.
	/// </param>
	/// <returns>
	/// Time remaining until 1st of next month.
	/// </returns>
	private static TimeSpan GetTimeUntilMonthlyReset(DateTime utcNow)
	{
		// Constructing a specific date (not getting current time)
#pragma warning disable SS004 // Avoid direct DateTime usage
		DateTime firstOfNextMonth =
			new DateTime(
				utcNow.Year,
				utcNow.Month,
				1,
				0,
				0,
				0,
				DateTimeKind.Utc)
				.AddMonths(1);
#pragma warning restore SS004

		return firstOfNextMonth - utcNow;
	}

	/// <inheritdoc/>
	public async Task ResetCounterAsync(
		string apiName,
		CancellationToken cancellationToken = default)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(apiName);

		DateOnly today =
			DateOnly.FromDateTime(
				timeProvider.GetUtcNow().UtcDateTime);
		ThirdPartyApiRequest? request =
			await repository.GetByApiNameAndDateAsync(
				apiName,
				today,
				cancellationToken);

		if (request == null)
		{
			return;
		}

		// Reset counter using domain logic
		request.ResetCallCount();

		await repository.UpdateAsync(request);
	}
}