// <copyright file="QueryBuilder.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Linq.Expressions;

namespace SeventySix.Shared.Persistence;

/// <summary>
/// Provides a fluent API for building complex queries with filtering, sorting, and pagination.
/// Implements Builder pattern for composable query construction.
/// </summary>
/// <typeparam name="T">The entity type being queried.</typeparam>
/// <remarks>
/// This class provides:
/// - Fluent filtering with Where conditions
/// - Multi-level sorting with OrderBy, OrderByDescending, ThenBy, ThenByDescending
/// - Pagination with Skip, Take, and Paginate helpers
/// - Method chaining for readable query composition
/// </remarks>
public sealed class QueryBuilder<T>
{
	private IQueryable<T> Query;
	private bool IsOrdered;

	/// <summary>
	/// Initializes a new instance of the QueryBuilder class.
	/// </summary>
	/// <param name="initialQuery">The initial query.</param>
	public QueryBuilder(IQueryable<T> initialQuery)
	{
		Query = initialQuery;
		IsOrdered = false;
	}

	/// <summary>
	/// Creates a new QueryBuilder for the specified query.
	/// </summary>
	/// <param name="initialQuery">The initial query.</param>
	/// <returns>A new QueryBuilder instance.</returns>
	public static QueryBuilder<T> For(IQueryable<T> initialQuery)
	{
		return new QueryBuilder<T>(initialQuery);
	}

	/// <summary>
	/// Applies a filter condition to the query.
	/// </summary>
	/// <param name="predicate">The filter predicate.</param>
	/// <returns>The QueryBuilder for method chaining.</returns>
	public QueryBuilder<T> Where(Expression<Func<T, bool>> predicate)
	{
		Query =
			Query.Where(predicate);
		return this;
	}

	/// <summary>
	/// Applies ascending ordering to the query.
	/// </summary>
	/// <typeparam name="TKey">The type of the property to order by.</typeparam>
	/// <param name="keySelector">The property selector.</param>
	/// <returns>The QueryBuilder for method chaining.</returns>
	public QueryBuilder<T> OrderBy<TKey>(Expression<Func<T, TKey>> keySelector)
	{
		Query =
			Query.OrderBy(keySelector);
		IsOrdered = true;
		return this;
	}

	/// <summary>
	/// Applies descending ordering to the query.
	/// </summary>
	/// <typeparam name="TKey">The type of the property to order by.</typeparam>
	/// <param name="keySelector">The property selector.</param>
	/// <returns>The QueryBuilder for method chaining.</returns>
	public QueryBuilder<T> OrderByDescending<TKey>(
		Expression<Func<T, TKey>> keySelector)
	{
		Query =
			Query.OrderByDescending(keySelector);
		IsOrdered = true;
		return this;
	}

	/// <summary>
	/// Applies a secondary ascending sort to an already ordered query.
	/// </summary>
	/// <typeparam name="TKey">The type of the property to order by.</typeparam>
	/// <param name="keySelector">The property selector.</param>
	/// <returns>The QueryBuilder for method chaining.</returns>
	/// <exception cref="InvalidOperationException">Thrown when ThenBy is called before OrderBy or OrderByDescending.</exception>
	public QueryBuilder<T> ThenBy<TKey>(Expression<Func<T, TKey>> keySelector)
	{
		if (!IsOrdered)
		{
			throw new InvalidOperationException(
				"ThenBy requires an OrderBy or OrderByDescending call first.");
		}
		Query =
			((IOrderedQueryable<T>)Query).ThenBy(keySelector);
		return this;
	}

	/// <summary>
	/// Applies a secondary descending sort to an already ordered query.
	/// </summary>
	/// <typeparam name="TKey">The type of the property to order by.</typeparam>
	/// <param name="keySelector">The property selector.</param>
	/// <returns>The QueryBuilder for method chaining.</returns>
	/// <exception cref="InvalidOperationException">Thrown when ThenByDescending is called before OrderBy or OrderByDescending.</exception>
	public QueryBuilder<T> ThenByDescending<TKey>(
		Expression<Func<T, TKey>> keySelector)
	{
		if (!IsOrdered)
		{
			throw new InvalidOperationException(
				"ThenByDescending requires an OrderBy or OrderByDescending call first.");
		}
		Query =
			((IOrderedQueryable<T>)Query).ThenByDescending(keySelector);
		return this;
	}

	/// <summary>
	/// Skips the specified number of elements.
	/// </summary>
	/// <param name="count">The number of elements to skip.</param>
	/// <returns>The QueryBuilder for method chaining.</returns>
	/// <exception cref="ArgumentOutOfRangeException">Thrown when count is negative.</exception>
	public QueryBuilder<T> Skip(int count)
	{
		if (count < 0)
		{
			throw new ArgumentOutOfRangeException(
				nameof(count),
				"Skip count cannot be negative.");
		}
		Query =
			Query.Skip(count);
		return this;
	}

	/// <summary>
	/// Takes the specified number of elements.
	/// </summary>
	/// <param name="count">The number of elements to take.</param>
	/// <returns>The QueryBuilder for method chaining.</returns>
	/// <exception cref="ArgumentOutOfRangeException">Thrown when count is negative.</exception>
	public QueryBuilder<T> Take(int count)
	{
		if (count < 0)
		{
			throw new ArgumentOutOfRangeException(
				nameof(count),
				"Take count cannot be negative.");
		}
		Query =
			Query.Take(count);
		return this;
	}

	/// <summary>
	/// Applies pagination to the query (Skip and Take combined).
	/// </summary>
	/// <param name="page">The page number (1-based).</param>
	/// <param name="pageSize">The number of items per page.</param>
	/// <returns>The QueryBuilder for method chaining.</returns>
	/// <exception cref="ArgumentOutOfRangeException">Thrown when page or pageSize is less than 1.</exception>
	public QueryBuilder<T> Paginate(int page, int pageSize)
	{
		if (page < 1)
		{
			throw new ArgumentOutOfRangeException(
				nameof(page),
				"Page must be greater than or equal to 1.");
		}
		if (pageSize < 1)
		{
			throw new ArgumentOutOfRangeException(
				nameof(pageSize),
				"Page size must be greater than or equal to 1.");
		}
		Query =
			Query.Skip((page - 1) * pageSize).Take(pageSize);
		return this;
	}

	/// <summary>
	/// Builds and returns the final query.
	/// </summary>
	/// <returns>The constructed IQueryable.</returns>
	public IQueryable<T> Build()
	{
		return Query;
	}
}

/// <summary>
/// Extension methods for applying QueryBuilder to IQueryable.
/// </summary>
public static class QueryBuilderExtensions
{
	/// <summary>
	/// Applies a QueryBuilder configuration to an IQueryable.
	/// </summary>
	/// <typeparam name="T">The entity type.</typeparam>
	/// <param name="initialQuery">The query to apply the builder to.</param>
	/// <param name="builderAction">The builder configuration action.</param>
	/// <returns>The configured query.</returns>
	public static IQueryable<T> ApplyQueryBuilder<T>(
		this IQueryable<T> initialQuery,
		Func<QueryBuilder<T>, QueryBuilder<T>> builderAction)
	{
		QueryBuilder<T> builder =
			QueryBuilder<T>.For(initialQuery);
		return builderAction(builder).Build();
	}
}
