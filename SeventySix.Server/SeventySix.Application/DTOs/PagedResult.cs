// <copyright file="PagedResult.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Application.DTOs;

/// <summary>
/// Generic paged result container with pagination metadata.
/// </summary>
/// <typeparam name="T">The type of items in the result.</typeparam>
public record PagedResult<T>
{
	/// <summary>
	/// Gets the items for the current page.
	/// </summary>
	public IEnumerable<T> Items { get; init; } = [];

	/// <summary>
	/// Gets the current page number (1-based).
	/// </summary>
	public int Page
	{
		get; init;
	}

	/// <summary>
	/// Gets the page size (number of items per page).
	/// </summary>
	public int PageSize
	{
		get; init;
	}

	/// <summary>
	/// Gets the total number of items across all pages.
	/// </summary>
	public int TotalCount
	{
		get; init;
	}

	/// <summary>
	/// Gets the total number of pages.
	/// </summary>
	public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);

	/// <summary>
	/// Gets a value indicating whether there is a previous page.
	/// </summary>
	public bool HasPrevious => Page > 1;

	/// <summary>
	/// Gets a value indicating whether there is a next page.
	/// </summary>
	public bool HasNext => Page < TotalPages;
}
