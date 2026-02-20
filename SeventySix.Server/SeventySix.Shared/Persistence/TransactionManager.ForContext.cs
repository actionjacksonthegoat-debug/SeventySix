using Microsoft.EntityFrameworkCore;
using SeventySix.Shared.Interfaces;

namespace SeventySix.Shared.Persistence;

/// <summary>
/// Generic adapter that provides an ITransactionManager bound to a specific DbContext type.
/// Delegates to the existing TransactionManager implementation to avoid duplicating complex logic.
/// </summary>
/// <param name="context">
/// The <see cref="DbContext"/> instance used by the transaction manager.
/// </param>
public sealed class TransactionManagerForContext<TContext>(TContext context)
	: ITransactionManager
		where TContext : DbContext
{
	private readonly TransactionManager InnerTransactionManager =
		new(context);

	/// <summary>
	/// Executes the provided operation within a database transaction with retry semantics and returns a result.
	/// </summary>
	/// <typeparam name="T">
	/// The type returned by the operation.
	/// </typeparam>
	/// <param name="operation">
	/// A function that performs work inside the transaction. It receives a <see cref="CancellationToken"/>.
	/// </param>
	/// <param name="maxRetries">
	/// Maximum number of retries for transient failures.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token to cancel the operation.
	/// </param>
	/// <returns>
	/// A <see cref="Task{T}"/> representing the asynchronous operation result.
	/// </returns>
	public Task<T> ExecuteInTransactionAsync<T>(
		Func<CancellationToken, Task<T>> operation,
		int maxRetries = 3,
		CancellationToken cancellationToken = default) =>
		InnerTransactionManager.ExecuteInTransactionAsync(
			operation,
			maxRetries,
			cancellationToken);

	/// <summary>
	/// Executes the provided non-returning operation within a database transaction with retry semantics.
	/// </summary>
	/// <param name="operation">
	/// A function that performs work inside the transaction. It receives a <see cref="CancellationToken"/>.
	/// </param>
	/// <param name="maxRetries">
	/// Maximum number of retries for transient failures.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token to cancel the operation.
	/// </param>
	/// <returns>
	/// A <see cref="Task"/> representing the asynchronous operation.
	/// </returns>
	public async Task ExecuteInTransactionAsync(
		Func<CancellationToken, Task> operation,
		int maxRetries = 3,
		CancellationToken cancellationToken = default)
	{
		await ExecuteInTransactionAsync(
			async cancellation =>
			{
				await operation(cancellation);
				return true;
			},
			maxRetries,
			cancellationToken);
	}
}