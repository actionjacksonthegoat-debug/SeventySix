// <copyright file="RateLimitingService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;
using SeventySix.ApiTracking;
using SeventySix.Shared;

namespace SeventySix.Infrastructure;

/// <summary>
/// Database-backed rate limiting service for API call tracking.
/// </summary>
/// <remarks>
/// Scoped service that tracks API calls per 24-hour period (midnight to midnight UTC).
/// Uses PostgreSQL for persistence across application restarts and horizontal scaling.
///
/// IMPORTANT - TWO-LAYER RATE LIMITING:
/// This service enforces EXTERNAL API quotas (e.g., ThirdPartyRateLimit 250 calls/day) to prevent
/// exceeding paid API limits. This is SEPARATE from HTTP middleware rate limiting.
///
/// - Layer 1 (HTTP): ASP.NET Core built-in rate limiter - protects YOUR API from client abuse
///   (Per IP, configurable via appsettings.json RateLimiting section)
///
/// - Layer 2 (External): RateLimitingService (this) - protects YOU from exceeding external API quotas
///   (Application-wide, database-backed, persists across restarts)
///
/// This ensures you NEVER exceed external API limits regardless of:
/// - Number of concurrent requests to your API
/// - Application restarts
/// - Multiple instances (horizontal scaling)
/// - Direct vs indirect calls to external APIs
///
/// Design Patterns:
/// - Repository Pattern: Delegates data access to IThirdPartyApiRequestRepository
/// - Dependency Injection: All dependencies injected via constructor
/// - Domain-Driven Design: Uses ThirdPartyApiRequest entity with business logic
///
/// SOLID Principles:
/// - SRP: Only responsible for rate limiting logic
/// - OCP: Can be extended with different reset strategies
/// - LSP: Implements IRateLimitingService contract
/// - ISP: Interface contains only necessary methods
/// - DIP: Depends on IThirdPartyApiRequestRepository abstraction
/// </remarks>
public class RateLimitingService(
	ILogger<RateLimitingService> logger,
	IThirdPartyApiRequestRepository repository,
	ITransactionManager transactionManager) : IRateLimitingService
{
	private const int DAILY_CALL_LIMIT = 1000;

	/// <inheritdoc/>
	public async Task<bool> CanMakeRequestAsync(string apiName, CancellationToken cancellationToken = default)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(apiName);

		DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
		ThirdPartyApiRequest? request = await repository.GetByApiNameAndDateAsync(apiName, today, cancellationToken);

		// If no record exists for today, we can make a request
		if (request == null)
		{
			logger.LogDebug("No tracking record found for {ApiName} on {Date}. Request allowed.", apiName, today);
			return true;
		}

		bool canMakeRequest = request.CallCount < DAILY_CALL_LIMIT;

		if (!canMakeRequest)
		{
			logger.LogWarning(
				"Rate limit exceeded for API: {ApiName}. Count: {Count}/{Limit}. Resets in: {TimeUntilReset}",
				apiName,
				request.CallCount,
				DAILY_CALL_LIMIT,
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

		// Execute the entire operation in a transaction with automatic retry on conflicts
		// The TransactionManager handles all race conditions and concurrency issues transparently
		return await transactionManager.ExecuteInTransactionAsync(async ct =>
		{
			DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);

			// Fetch the current record within the transaction
			// Repository now uses tracking queries when inside a transaction
			// This ensures we see the latest committed data from other transactions
			ThirdPartyApiRequest? request = await repository.GetByApiNameAndDateAsync(apiName, today, ct);

			if (request == null)
			{
				// No record exists - try to create one
				// Note: In concurrent scenarios, multiple transactions may try this
				// The first will succeed, others will get duplicate key exception
				// TransactionManager will catch and retry, and on retry this will find the record
				request = new ThirdPartyApiRequest
				{
					ApiName = apiName,
					BaseUrl = baseUrl,
					ResetDate = today
				};

				// Use domain method to increment (sets CallCount = 1 and LastCalledAt = now)
				request.IncrementCallCount();

				await repository.CreateAsync(request); logger.LogInformation(
						"Created new tracking record for {ApiName}. CallCount: {CallCount}",
						apiName,
						request.CallCount);

				return true;
			}

			// Record exists - check limit before incrementing
			if (request.CallCount >= DAILY_CALL_LIMIT)
			{
				logger.LogWarning(
					"Cannot increment request count for {ApiName}. Limit reached: {Count}/{Limit}",
					apiName,
					request.CallCount,
					DAILY_CALL_LIMIT);

				return false;
			}

			// Increment counter using domain logic
			request.IncrementCallCount();

			// Update the record - if another transaction modified it, this will throw
			// and the TransactionManager will automatically retry the entire operation
			await repository.UpdateAsync(request);

			logger.LogDebug(
				"API call recorded for {ApiName}. Count: {Count}/{Limit}",
				apiName,
				request.CallCount,
				DAILY_CALL_LIMIT);

			// Warn when approaching limit (90%)
			if (request.CallCount >= DAILY_CALL_LIMIT * 0.9)
			{
				logger.LogWarning(
					"Approaching rate limit for {ApiName}: {Count}/{Limit} ({Percentage:F1}%)",
					apiName,
					request.CallCount,
					DAILY_CALL_LIMIT,
					(double)request.CallCount / DAILY_CALL_LIMIT * 100);
			}

			return true;
		}, maxRetries: 5, cancellationToken); // Allow up to 5 retries for high-concurrency scenarios
	}

	/// <inheritdoc/>
	public async Task<int> GetRequestCountAsync(string apiName, CancellationToken cancellationToken = default)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(apiName);

		DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
		ThirdPartyApiRequest? request = await repository.GetByApiNameAndDateAsync(apiName, today, cancellationToken);

		return request?.CallCount ?? 0;
	}

	/// <inheritdoc/>
	public async Task<int> GetRemainingQuotaAsync(string apiName, CancellationToken cancellationToken = default)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(apiName);

		DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
		ThirdPartyApiRequest? request = await repository.GetByApiNameAndDateAsync(apiName, today, cancellationToken);

		int currentCount = request?.CallCount ?? 0;
		return Math.Max(0, DAILY_CALL_LIMIT - currentCount);
	}

	/// <inheritdoc/>
	public TimeSpan GetTimeUntilReset()
	{
		DateTime now = DateTime.UtcNow;
		DateTime nextMidnight = now.Date.AddDays(1);
		return nextMidnight - now;
	}

	/// <inheritdoc/>
	public async Task ResetCounterAsync(string apiName, CancellationToken cancellationToken = default)
	{
		ArgumentException.ThrowIfNullOrWhiteSpace(apiName);

		DateOnly today = DateOnly.FromDateTime(DateTime.UtcNow);
		ThirdPartyApiRequest? request = await repository.GetByApiNameAndDateAsync(apiName, today, cancellationToken);

		if (request == null)
		{
			logger.LogDebug("No tracking record to reset for {ApiName} on {Date}", apiName, today);
			return;
		}

		// Reset counter using domain logic
		request.ResetCallCount();

		await repository.UpdateAsync(request);

		logger.LogInformation("Rate limit counter reset for API: {ApiName}", apiName);
	}
}