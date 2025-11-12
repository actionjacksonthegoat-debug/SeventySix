// <copyright file="ITransactionManager.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Data.Infrastructure;

/// <summary>
/// Manages database transactions with automatic retry logic for concurrency conflicts.
/// Provides optimistic concurrency control without requiring explicit try-catch blocks in service code.
/// </summary>
public interface ITransactionManager
{
	/// <summary>
	/// Executes an operation within a transaction with automatic retry on concurrency conflicts.
	/// Uses optimistic concurrency control - retries when underlying data changes during the operation.
	/// </summary>
	/// <typeparam name="T">The return type of the operation.</typeparam>
	/// <param name="operation">The async operation to execute within a transaction.</param>
	/// <param name="maxRetries">Maximum number of retry attempts (default: 3).</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>The result of the operation.</returns>
	/// <remarks>
	/// Automatically handles:
	/// - DbUpdateConcurrencyException (optimistic concurrency conflicts)
	/// - DbUpdateException with duplicate key violations (race conditions on insert)
	/// - Transaction rollback on failure
	/// - Exponential backoff between retries
	/// </remarks>
	public Task<T> ExecuteInTransactionAsync<T>(
		Func<CancellationToken, Task<T>> operation,
		int maxRetries = 3,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Executes an operation within a transaction with automatic retry on concurrency conflicts.
	/// Void return version for operations that don't return a value.
	/// </summary>
	/// <param name="operation">The async operation to execute within a transaction.</param>
	/// <param name="maxRetries">Maximum number of retry attempts (default: 3).</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>A task representing the async operation.</returns>
	public Task ExecuteInTransactionAsync(
		Func<CancellationToken, Task> operation,
		int maxRetries = 3,
		CancellationToken cancellationToken = default);
}
