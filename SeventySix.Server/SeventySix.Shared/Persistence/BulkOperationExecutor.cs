// <copyright file="BulkOperationExecutor.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;

namespace SeventySix.Shared.Persistence;

/// <summary>
/// Provides bulk update operations for entities.
/// Implements Composite and Command patterns for batch operations.
/// </summary>
/// <typeparam name="TEntity">The entity type to perform bulk operations on.</typeparam>
/// <remarks>
/// This class consolidates bulk operation logic that was previously duplicated
/// across UserRepository.BulkUpdateActiveStatusAsync and similar methods.
///
/// Design Patterns:
/// - Composite: Treats collection of entities uniformly
/// - Command: Encapsulates update action as executable command
///
/// Benefits:
/// - DRY: Eliminates ~40 lines of duplicated bulk update code
/// - Reusability: Works for any entity type and any update action
/// - Performance: Single database round-trip for all updates
/// - Type Safety: Generic constraints ensure compile-time checking
/// </remarks>
public class BulkOperationExecutor<TEntity>(DbContext context)
	where TEntity : class
{
	/// <summary>
	/// Executes a bulk update operation on entities matching the provided IDs.
	/// </summary>
	/// <param name="ids">The collection of entity IDs to update.</param>
	/// <param name="updateAction">The action to apply to each entity.</param>
	/// <param name="cancellationToken">Cancellation token for async operation.</param>
	/// <returns>The number of entities updated.</returns>
	/// <remarks>
	/// This method:
	/// 1. Queries entities matching the provided IDs
	/// 2. Applies the update action to each entity
	/// 3. Saves all changes in a single transaction
	/// 4. Returns the count of updated entities
	///
	/// Performance: Uses a single database query and a single SaveChangesAsync call,
	/// making it efficient for batch operations.
	/// </remarks>
	public async Task<int> ExecuteBulkUpdateAsync(
		IEnumerable<int> ids,
		Action<TEntity> updateAction,
		CancellationToken cancellationToken = default)
	{
		List<TEntity> entities =
			await context
				.Set<TEntity>()
				.Where(entity => ids.Contains(EF.Property<int>(entity, "Id")))
				.ToListAsync(cancellationToken);

		if (entities.Count == 0)
		{
			return 0;
		}

		foreach (TEntity entity in entities)
		{
			updateAction(entity);
		}

		await context.SaveChangesAsync(cancellationToken);
		return entities.Count;
	}
}