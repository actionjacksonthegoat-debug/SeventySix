// <copyright file="PagedResult.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared.DTOs;

/// <summary>
/// Paged result for queries.
/// </summary>
public class PagedResult<T>
{
	public required IReadOnlyList<T> Items
	{
		get; init;
	}
	public int TotalCount
	{
		get; init;
	}
	public int Page
	{
		get; init;
	}
	public int PageSize
	{
		get; init;
	}
	public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
	public bool HasPrevious => Page > 1;
	public bool HasNext => Page < TotalPages;
}