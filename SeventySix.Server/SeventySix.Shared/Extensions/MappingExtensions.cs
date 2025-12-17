// <copyright file="MappingExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.Extensions;

/// <summary>
/// Generic mapping extensions for entity-to-DTO conversions.
/// Eliminates duplicated collection mapping logic across bounded contexts.
/// </summary>
/// <remarks>
/// This class implements the Adapter pattern, providing a generic utility
/// for transforming collections of entities to DTOs.
///
/// Design Benefits:
/// - DRY: Eliminates ~30 lines of duplicated mapping code
/// - Type Safety: Generic constraints ensure compile-time type checking
/// - Deferred Execution: Uses LINQ Select for efficient lazy evaluation
/// - Consistency: All collection mappings use identical null checking
/// </remarks>
public static class MappingExtensions
{
	/// <summary>
	/// Maps a collection of entities to DTOs using the provided mapper function.
	/// </summary>
	/// <typeparam name="TEntity">The source entity type.</typeparam>
	/// <typeparam name="TDto">The destination DTO type.</typeparam>
	/// <param name="entities">The collection of entities to map.</param>
	/// <param name="mapper">The function to map each entity to a DTO.</param>
	/// <returns>A lazily-evaluated collection of mapped DTOs.</returns>
	/// <exception cref="ArgumentNullException">
	/// Thrown when entities or mapper is null.
	/// </exception>
	/// <remarks>
	/// Uses deferred execution - the mapper function is not called until
	/// the result is enumerated (e.g., via ToList(), foreach, etc.).
	/// </remarks>
	public static IEnumerable<TDto> MapToDto<TEntity, TDto>(
		this IEnumerable<TEntity> entities,
		Func<TEntity, TDto> mapper)
	{
		ArgumentNullException.ThrowIfNull(entities);
		ArgumentNullException.ThrowIfNull(mapper);

		return entities.Select(mapper);
	}
}