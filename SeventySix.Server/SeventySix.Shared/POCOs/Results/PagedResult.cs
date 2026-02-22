// <copyright file="PagedResult.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.POCOs;

/// <summary>
/// Paged result for queries.
/// </summary>
/// <typeparam name="T">
/// The type of items in the paged result.
/// </typeparam>
public record PagedResult<T>
{
	/// <summary>
	/// The items for the current page.
	/// </summary>
	public required IReadOnlyList<T> Items { get; init; }

	/// <summary>
	/// Total number of items across all pages.
	/// </summary>
	public int TotalCount { get; init; }

	/// <summary>
	/// Current page number (1-based).
	/// </summary>
	public int Page { get; init; }

	/// <summary>
	/// Number of items per page.
	/// </summary>
	public int PageSize { get; init; }

	/// <summary>
	/// Total number of pages based on <see cref="TotalCount"/> and <see cref="PageSize"/>.
	/// </summary>
	public int TotalPages => (int)Math.Ceiling((decimal)TotalCount / PageSize);

	/// <summary>
	/// True when there is a previous page available.
	/// </summary>
	public bool HasPrevious => Page > 1;

	/// <summary>
	/// True when there is a next page available.
	/// </summary>
	public bool HasNext => Page < TotalPages;
}