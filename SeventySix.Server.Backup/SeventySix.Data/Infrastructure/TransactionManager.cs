// <copyright file="TransactionManager.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace SeventySix.Data.Infrastructure;

/// <summary>
/// Implements database transactions with automatic retry logic for concurrency conflicts.
/// Provides thread-safe operations using optimistic concurrency control with PostgreSQL.
/// </summary>
/// <remarks>
/// Design Patterns:
/// - Retry Pattern: Automatic retry with exponential backoff
/// - Transaction Pattern: Ensures ACID properties
/// - Optimistic Concurrency: Uses row versioning instead of pessimistic locks
///
/// Thread Safety:
/// - Each operation gets its own transaction scope
/// - Uses PostgreSQL's MVCC (Multi-Version Concurrency Control)
/// - No explicit locks required - database handles isolation
/// - Retry logic handles race conditions transparently
///
/// SOLID Principles:
/// - SRP: Only responsible for transaction management
/// - OCP: Can be extended with custom retry strategies
/// - DIP: Depends on DbContext abstraction
/// </remarks>
/// <remarks>
/// Initializes a new instance of the <see cref="TransactionManager"/> class.
/// </remarks>
/// <param name="context">The database context.</param>
/// <param name="logger">Logger instance.</param>
public class TransactionManager(
	ApplicationDbContext context) : ITransactionManager
{
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
				IExecutionStrategy strategy = context.Database.CreateExecutionStrategy();

				return await strategy.ExecuteAsync(async ct =>
				{
					// Start a new transaction with ReadCommitted isolation
					// PostgreSQL will automatically detect conflicts and throw exceptions
					using IDbContextTransaction transaction = await context.Database.BeginTransactionAsync(
						System.Data.IsolationLevel.ReadCommitted,
						ct);

					try
					{
						// Execute the operation
						T? result = await operation(ct);

						// Commit the transaction
						await transaction.CommitAsync(ct);

						return result;
					}
					catch
					{
						// Rollback on any exception
						await transaction.RollbackAsync(ct);
						throw;
					}
				}, cancellationToken);
			}
			catch (DbUpdateConcurrencyException ex)
			{
				// Optimistic concurrency conflict - another transaction modified the same data
				lastException = ex;

				// Clear change tracker to avoid tracking stale entities
				context.ChangeTracker.Clear();
			}
			catch (DbUpdateException ex) when (IsConcurrencyRelated(ex))
			{
				// Database constraint violation (duplicate key, etc.) - likely race condition
				lastException = ex;

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
				int delayMs = CalculateBackoff(retryCount);
				await Task.Delay(delayMs, cancellationToken);
			}
		}

		throw new InvalidOperationException(
			$"Transaction failed after {maxRetries} retries due to concurrency conflicts. " +
			"This may indicate high contention or a systematic issue.",
			lastException);
	}

	/// <inheritdoc/>
	public async Task ExecuteInTransactionAsync(
		Func<CancellationToken, Task> operation,
		int maxRetries = 3,
		CancellationToken cancellationToken = default)
	{
		await ExecuteInTransactionAsync(
			async ct =>
			{
				await operation(ct);
				return true; // Dummy return value
			},
			maxRetries,
			cancellationToken);
	}

	/// <summary>
	/// Determines if an exception is related to concurrency issues.
	/// </summary>
	/// <param name="ex">The exception to check.</param>
	/// <returns>True if the exception indicates a concurrency conflict.</returns>
	private static bool IsConcurrencyRelated(DbUpdateException ex)
	{
		string message = ex.InnerException?.Message ?? ex.Message;

		// PostgreSQL-specific error codes and messages
		return message.Contains("duplicate key", StringComparison.OrdinalIgnoreCase) ||
			   message.Contains("23505", StringComparison.Ordinal) || // Unique violation
			   message.Contains("40001", StringComparison.Ordinal) || // Serialization failure
			   message.Contains("40P01", StringComparison.Ordinal);   // Deadlock detected
	}

	/// <summary>
	/// Calculates exponential backoff delay with jitter.
	/// </summary>
	/// <param name="retryCount">The current retry attempt (1-based).</param>
	/// <returns>Delay in milliseconds.</returns>
	private static int CalculateBackoff(int retryCount)
	{
		// Base delay: 50ms, 100ms, 200ms, 400ms, etc.
		double baseDelay = 50 * Math.Pow(2, retryCount - 1);

		// Add jitter (±25%) to prevent thundering herd
		double jitter = Random.Shared.Next(-25, 26) / 100.0;
		int delayMs = (int)(baseDelay * (1 + jitter));

		// Cap at 2 seconds
		return Math.Min(delayMs, 2000);
	}
}