// <copyright file="RateLimitingService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SeventySix.ApiTracking;
using SeventySix.Shared.Interfaces;

namespace SeventySix.Api.Infrastructure;

/// <summary>
/// Database-backed rate limiting service for API call tracking.
/// </summary>
/// <remarks>
/// Scoped service that tracks API calls per 24-hour period (midnight to midnight UTC).
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

		// If rate limiting is disabled globally or for this API, allow the request
		if (!RateLimitSettings.IsApiRateLimitEnabled(apiName))
		{
			return true;
		}

		int dailyLimit =
			RateLimitSettings.GetDailyLimit(apiName);
		DateOnly today =
			DateOnly.FromDateTime(
				timeProvider.GetUtcNow().UtcDateTime);
		ThirdPartyApiRequest? request =
			await repository.GetByApiNameAndDateAsync(
				apiName,
				today,
				cancellationToken);

		// If no record exists for today, we can make a request
		if (request == null)
		{
			return true;
		}

		bool canMakeRequest =
			request.CallCount < dailyLimit;

		if (!canMakeRequest)
		{
			logger.LogWarning(
				"Rate limit exceeded for API: {ApiName}. Count: {Count}/{Limit}. Resets in: {TimeUntilReset}",
				apiName,
				request.CallCount,
				dailyLimit,
				GetTimeUntilReset());
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

		int dailyLimit =
			RateLimitSettings.GetDailyLimit(apiName);

		// Execute the entire operation in a transaction with automatic retry on conflicts
		return await transactionManager.ExecuteInTransactionAsync(
			async cancellation =>
			{
				DateOnly today =
					DateOnly.FromDateTime(
						timeProvider.GetUtcNow().UtcDateTime);

				ThirdPartyApiRequest? request =
					await repository.GetByApiNameAndDateAsync(
						apiName,
						today,
						cancellation);

				if (request == null)
				{
					request =
						new ThirdPartyApiRequest
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

				// Record exists - check limit before incrementing
				if (request.CallCount >= dailyLimit)
				{
					logger.LogWarning(
						"Cannot increment request count for {ApiName}. Limit reached: {Count}/{Limit}",
						apiName,
						request.CallCount,
						dailyLimit);

					return false;
				}

				// Increment counter using domain logic
				request.IncrementCallCount(
					timeProvider.GetUtcNow().UtcDateTime);

				// Update the record
				await repository.UpdateAsync(request);

				// Warn when approaching limit (90%)
				if (request.CallCount >= dailyLimit * 0.9)
				{
					logger.LogWarning(
						"Approaching rate limit for {ApiName}: {Count}/{Limit} ({Percentage:F1}%)",
						apiName,
						request.CallCount,
						dailyLimit,
						(double)request.CallCount / dailyLimit * 100);
				}

				return true;
			},
			maxRetries: 5,
			cancellationToken); // Allow up to 5 retries for high-concurrency scenarios
	}

	/// <inheritdoc/>
	public async Task<int> GetRequestCountAsync(
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

		return request?.CallCount ?? 0;
	}

	/// <inheritdoc/>
	public async Task<int> GetRemainingQuotaAsync(
		string apiName,
		CancellationToken cancellationToken = default)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(apiName);

		int dailyLimit =
			RateLimitSettings.GetDailyLimit(apiName);
		DateOnly today =
			DateOnly.FromDateTime(
				timeProvider.GetUtcNow().UtcDateTime);
		ThirdPartyApiRequest? request =
			await repository.GetByApiNameAndDateAsync(
				apiName,
				today,
				cancellationToken);

		int currentCount =
			request?.CallCount ?? 0;
		return Math.Max(0, dailyLimit - currentCount);
	}

	/// <inheritdoc/>
	public TimeSpan GetTimeUntilReset()
	{
		DateTime now =
			timeProvider.GetUtcNow().UtcDateTime;
		DateTime nextMidnight =
			now.Date.AddDays(1);
		return nextMidnight - now;
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
