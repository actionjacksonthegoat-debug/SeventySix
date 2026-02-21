// <copyright file="TransactionManager.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using SeventySix.Shared.Extensions;
using SeventySix.Shared.Interfaces;

namespace SeventySix.Shared.Persistence;

/// <summary>
/// Implements database transactions with automatic retry logic for concurrency conflicts.
/// Provides thread-safe operations using optimistic concurrency control with PostgreSQL.
/// </summary>
/// <remarks>
/// <para>Backoff Configuration:</para>
/// <list type="bullet">
/// <item><description><see cref="BaseRetryDelayMs"/>: Starting delay (50ms → 100ms → 200ms → 400ms)</description></item>
/// <item><description><see cref="MaxRetryDelayMs"/>: Maximum delay cap (2 seconds)</description></item>
/// <item><description><see cref="JitterPercentage"/>: Random variance (±25%) to prevent thundering herd</description></item>
/// </list>
/// <para>Design Patterns:</para>
/// <list type="bullet">
/// <item><description>Retry Pattern: Automatic retry with exponential backoff</description></item>
/// <item><description>Transaction Pattern: Ensures ACID properties</description></item>
/// <item><description>Optimistic Concurrency: Uses row versioning instead of pessimistic locks</description></item>
/// </list>
/// <para>Thread Safety:</para>
/// <list type="bullet">
/// <item><description>Each operation gets its own transaction scope</description></item>
/// <item><description>Uses PostgreSQL's MVCC (Multi-Version Concurrency Control)</description></item>
/// <item><description>No explicit locks required — database handles isolation</description></item>
/// <item><description>Retry logic handles race conditions transparently</description></item>
/// </list>
/// <para>SOLID Principles:</para>
/// <list type="bullet">
/// <item><description>SRP: Only responsible for transaction management</description></item>
/// <item><description>OCP: Can be extended with custom retry strategies</description></item>
/// <item><description>DIP: Depends on DbContext abstraction</description></item>
/// </list>
/// </remarks>
/// <param name="context">
/// The database context.
/// </param>
public sealed class TransactionManager(DbContext context) : ITransactionManager
{
	/// <summary>
	/// Base delay in milliseconds for retry backoff calculation.
	/// Delay doubles each retry: 50ms → 100ms → 200ms → 400ms.
	/// </summary>
	private const int BaseRetryDelayMs = 50;

	/// <summary>
	/// Maximum delay cap in milliseconds to prevent excessive wait times.
	/// </summary>
	private const int MaxRetryDelayMs = 2000;

	/// <summary>
	/// Jitter percentage (±) applied to delays to prevent thundering herd.
	/// Value of 25 means ±25% random variance.
	/// </summary>
	private const int JitterPercentage = 25;

	/// <inheritdoc/>
	public async Task<T> ExecuteInTransactionAsync<T>(
		Func<CancellationToken, Task<T>> operation,
		int maxRetries = 3,
		CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(operation);

		int retryCount = 0;
		Exception? lastException = null;

		while (retryCount <= maxRetries)
		{
			try
			{
				// Use the database's execution strategy to handle transactions
				// This is required when EnableRetryOnFailure is configured
				IExecutionStrategy strategy =
					context.Database.CreateExecutionStrategy();

				return await strategy.ExecuteAsync(
					async cancellation =>
					{
						// Start a new transaction with ReadCommitted isolation
						// PostgreSQL will automatically detect conflicts and throw exceptions
						using IDbContextTransaction transaction =
							await context.Database.BeginTransactionAsync(
								System.Data.IsolationLevel.ReadCommitted,
								cancellation);

						try
						{
							// Execute the operation
							T? result =
								await operation(cancellation);

							// Commit the transaction
							await transaction.CommitAsync(cancellation);

							return result;
						}
						catch
						{
							// Rollback on any exception
							await transaction.RollbackAsync(cancellation);
							throw;
						}
					},
					cancellationToken);
			}
			catch (DbUpdateConcurrencyException exception)
			{
				// Optimistic concurrency conflict - another transaction modified the same data
				lastException = exception;

				// Clear change tracker to avoid tracking stale entities
				context.ChangeTracker.Clear();
			}
			catch (DbUpdateException dbException)
				when (dbException.IsConcurrencyRelated())
			{
				// Database constraint violation (duplicate key, etc.) - likely race condition
				lastException = dbException;

				// Clear change tracker
				context.ChangeTracker.Clear();
			}
			catch (Exception)
			{
				// Non-retryable exception - re-throw immediately
				throw;
			}

			retryCount++;

			if (retryCount <= maxRetries)
			{
				// Exponential backoff with jitter
				int delayMs =
					CalculateBackoff(retryCount);
				await Task.Delay(delayMs, cancellationToken);
			}
		}

		throw new InvalidOperationException(
			$"Transaction failed after {maxRetries} retries due to concurrency conflicts. "
				+ "This may indicate high contention or a systematic issue.",
			lastException);
	}

	/// <inheritdoc/>
	public async Task ExecuteInTransactionAsync(
		Func<CancellationToken, Task> operation,
		int maxRetries = 3,
		CancellationToken cancellationToken = default)
	{
		await ExecuteInTransactionAsync(
			async cancellation =>
			{
				await operation(cancellation);
				return true; // Dummy return value
			},
			maxRetries,
			cancellationToken);
	}

	/// <summary>
	/// Calculates exponential backoff delay with jitter.
	/// </summary>
	/// <param name="retryCount">
	/// The current retry attempt (1-based).
	/// </param>
	/// <returns>
	/// Delay in milliseconds.
	/// </returns>
	private static int CalculateBackoff(int retryCount)
	{
		// Math.Pow only has a double overload — cast result to decimal
		decimal baseDelay =
			BaseRetryDelayMs * (decimal)Math.Pow(
				2,
				retryCount - 1);

		decimal jitter =
			Random.Shared.Next(
				-JitterPercentage,
				JitterPercentage + 1) / 100m;
		int delayMs =
			(int)(baseDelay * (1 + jitter));

		return Math.Min(
			delayMs,
			MaxRetryDelayMs);
	}
}