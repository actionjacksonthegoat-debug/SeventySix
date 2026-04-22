// <copyright file="QueryableExtensions.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Linq.Expressions;

namespace SeventySix.Shared.Persistence;

/// <summary>
/// LINQ helpers for conditional and safe query composition.
/// </summary>
public static class QueryableExtensions
{
	/// <summary>
	/// Applies <paramref name="predicate"/> only when <paramref name="condition"/> is <see langword="true"/>.
	/// Returns the original query unchanged when <paramref name="condition"/> is <see langword="false"/>.
	/// </summary>
	/// <typeparam name="T">The entity type being queried.</typeparam>
	/// <param name="query">
	/// The source query.
	/// </param>
	/// <param name="condition">
	/// Whether to apply the predicate.
	/// </param>
	/// <param name="predicate">
	/// The filter predicate to apply when condition is true.
	/// </param>
	/// <returns>The filtered or original query.</returns>
	public static IQueryable<T> WhereIf<T>(
		this IQueryable<T> query,
		bool condition,
		Expression<Func<T, bool>> predicate)
	{
		return condition ? query.Where(predicate) : query;
	}
}