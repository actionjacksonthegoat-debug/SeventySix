// <copyright file="BaseRepository.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SeventySix.Shared;

namespace SeventySix.Shared.Infrastructure;

/// <summary>
/// Base repository providing common error handling and CRUD operations.
/// Implements Template Method pattern for consistent error handling across all repositories.
/// </summary>
/// <typeparam name="TEntity">The entity type managed by this repository.</typeparam>
/// <typeparam name="TContext">The DbContext type for database operations.</typeparam>
/// <remarks>
/// This class centralizes error handling logic that was previously duplicated
/// across UserRepository, LogRepository, and ThirdPartyApiRequestRepository.
///
/// Design Patterns:
/// - Template Method: ExecuteWithErrorHandlingAsync provides consistent error handling
/// - Strategy: Pluggable error handling for different exception types
///
/// SOLID Principles:
/// - SRP: Only responsible for common repository operations and error handling
/// - OCP: Open for extension via inheritance, closed for modification
/// - DIP: Depends on DbContext abstraction, not concrete implementations
///
/// Error Handling:
/// - DbUpdateConcurrencyException: Logs concurrency conflicts
/// - DbUpdateException: Logs database constraint violations
/// - Exception: Logs unexpected errors
/// All exceptions are rethrown after logging for proper error propagation.
/// </remarks>
public abstract class BaseRepository<TEntity, TContext>(
	TContext context,
	ILogger logger)
	where TEntity : class, IEntity
	where TContext : DbContext
{
	protected readonly TContext context = context;

	protected readonly ILogger logger = logger;

	/// <summary>
	/// Gets a queryable for the entity set with transaction-aware tracking.
	/// </summary>
	/// <returns>
	/// Queryable with AsNoTracking if no active transaction, otherwise with default tracking.
	/// </returns>
	/// <remarks>
	/// Automatically detects if running within a transaction and adjusts tracking behavior:
	/// - No transaction: Uses AsNoTracking for read-only optimization
	/// - Inside transaction: Uses default tracking for update operations
	/// This eliminates duplicate transaction-checking logic across repositories.
	/// </remarks>
	protected IQueryable<TEntity> GetQueryable()
	{
		bool hasActiveTransaction = context.Database.CurrentTransaction != null;
		IQueryable<TEntity> query = context.Set<TEntity>().AsQueryable();

		if (!hasActiveTransaction)
		{
			query = query.AsNoTracking();
		}

		return query;
	}

	/// <summary>
	/// Executes a repository operation with consistent error handling and logging.
	/// </summary>
	/// <typeparam name="T">The return type of the operation.</typeparam>
	/// <param name="operation">The async operation to execute.</param>
	/// <param name="operationName">The name of the operation for logging.</param>
	/// <param name="entityIdentifier">A string identifying the entity for logging.</param>
	/// <returns>The result of the operation.</returns>
	/// <exception cref="DbUpdateConcurrencyException">Rethrown after logging.</exception>
	/// <exception cref="DbUpdateException">Rethrown after logging.</exception>
	/// <exception cref="Exception">Rethrown after logging.</exception>
	/// <remarks>
	/// This is the Template Method that provides consistent error handling.
	/// All repository operations should use this method to ensure uniform logging.
	/// </remarks>
	protected async Task<T> ExecuteWithErrorHandlingAsync<T>(
		Func<Task<T>> operation,
		string operationName,
		string entityIdentifier)
	{
		try
		{
			return await operation();
		}
		catch (DbUpdateConcurrencyException ex)
		{
			logger.LogError(
				ex,
				"Concurrency conflict {Operation}: {Entity}",
				operationName,
				entityIdentifier);
			throw;
		}
		catch (DbUpdateException ex)
		{
			logger.LogError(
				ex,
				"Database error {Operation}: {Entity}",
				operationName,
				entityIdentifier);
			throw;
		}
		catch (Exception ex)
		{
			logger.LogError(
				ex,
				"Unexpected error {Operation}: {Entity}",
				operationName,
				entityIdentifier);
			throw;
		}
	}

	/// <summary>
	/// Creates a new entity in the database.
	/// </summary>
	/// <param name="entity">The entity to create.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>The created entity.</returns>
	/// <exception cref="DbUpdateException">If a database constraint is violated.</exception>
	/// <exception cref="Exception">If an unexpected error occurs.</exception>
	/// <remarks>
	/// Uses ExecuteWithErrorHandlingAsync for consistent error handling.
	/// Derived classes can override GetEntityIdentifier to customize logging.
	/// </remarks>
	public virtual async Task<TEntity> CreateAsync(TEntity entity, CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(entity);

		return await ExecuteWithErrorHandlingAsync(
			async () =>
			{
				context.Set<TEntity>().Add(entity);
				await context.SaveChangesAsync(cancellationToken);
				return entity;
			},
			nameof(CreateAsync),
			GetEntityIdentifier(entity));
	}

	/// <summary>
	/// Updates an existing entity in the database.
	/// </summary>
	/// <param name="entity">The entity to update.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>The updated entity.</returns>
	/// <exception cref="DbUpdateConcurrencyException">If a concurrency conflict occurs.</exception>
	/// <exception cref="DbUpdateException">If a database constraint is violated.</exception>
	/// <exception cref="Exception">If an unexpected error occurs.</exception>
	/// <remarks>
	/// Handles entity tracking to avoid conflicts:
	/// - If entity is already tracked: Updates properties using SetValues
	/// - If entity is not tracked: Attaches and marks as modified
	///
	/// This eliminates ~30 lines of duplicated tracking logic across
	/// UserRepository and ThirdPartyApiRequestRepository.
	///
	/// Derived classes can override to add custom behavior like timestamp management.
	/// </remarks>
	public virtual async Task<TEntity> UpdateAsync(TEntity entity, CancellationToken cancellationToken = default)
	{
		ArgumentNullException.ThrowIfNull(entity);

		return await ExecuteWithErrorHandlingAsync(
			async () =>
			{
				// Check if entity is already tracked by change tracker
				TEntity? trackedEntity = context.Set<TEntity>().Local
					.FirstOrDefault(e => e.Id == entity.Id);

				if (trackedEntity != null)
				{
					// Entity is already tracked, update its properties
					context.Entry(trackedEntity).CurrentValues.SetValues(entity);
				}
				else
				{
					// Entity is not tracked, attach and mark as modified
					context.Set<TEntity>().Update(entity);
				}

				await context.SaveChangesAsync(cancellationToken);
				return entity;
			},
			nameof(UpdateAsync),
			GetEntityIdentifier(entity));
	}

	/// <summary>
	/// Gets a string identifier for an entity for logging purposes.
	/// </summary>
	/// <param name="entity">The entity to identify.</param>
	/// <returns>A string describing the entity.</returns>
	/// <remarks>
	/// Derived classes must implement this to provide meaningful entity identification
	/// in error logs. Example: "Id=123, Username=john.doe"
	/// </remarks>
	protected abstract string GetEntityIdentifier(TEntity entity);
}