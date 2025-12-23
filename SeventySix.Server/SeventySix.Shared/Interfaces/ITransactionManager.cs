// <copyright file="ITransactionManager.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Interfaces;

/// <summary>Database transaction management with automatic retry on concurrency conflicts.</summary>
public interface ITransactionManager
{
	/// <summary>
	/// Executes the provided operation inside a database transaction with automatic retry
	/// on concurrency-related failures.
	/// </summary>
	/// <param name="operation">
	/// The asynchronous operation to execute within the transaction. Receives a <see cref="CancellationToken"/>.
	/// </param>
	/// <param name="maxRetries">
	/// Maximum number of retry attempts on concurrency-related failures.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token to cancel the operation.
	/// </param>
	/// <returns>
	/// The operation result.
	/// </returns>
	public Task<T> ExecuteInTransactionAsync<T>(
		Func<CancellationToken, Task<T>> operation,
		int maxRetries = 3,
		CancellationToken cancellationToken = default);

	/// <summary>
	/// Executes the provided operation inside a database transaction with automatic retry
	/// on concurrency-related failures. Use this overload for operations that return no value.
	/// </summary>
	/// <param name="operation">
	/// The asynchronous operation to execute within the transaction. Receives a <see cref="CancellationToken"/>.
	/// </param>
	/// <param name="maxRetries">
	/// Maximum number of retry attempts on concurrency-related failures.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token to cancel the operation.
	/// </param>
	public Task ExecuteInTransactionAsync(
		Func<CancellationToken, Task> operation,
		int maxRetries = 3,
		CancellationToken cancellationToken = default);
}