// <copyright file="BaseQueryRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Shared;

/// <summary>Base request for paginated queries with common filtering.</summary>
public record BaseQueryRequest
{
	public int Page { get; init; } = 1;

	public int PageSize { get; init; } = PaginationConstants.DefaultPageSize;

	public string? SearchTerm
	{
		get; init;
	}

	public DateTime? StartDate
	{
		get; init;
	}

	public DateTime? EndDate
	{
		get; init;
	}

	public string? SortBy { get; init; } = "Id";

	public bool SortDescending { get; init; } = true;

	public int GetSkip() => (Page - 1) * PageSize;

	public int GetValidatedPageSize() => Math.Min(PageSize, PaginationConstants.MaxPageSize);
}