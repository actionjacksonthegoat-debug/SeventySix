// <copyright file="BaseQueryRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Constants;

namespace SeventySix.Shared.DTOs;

/// <summary>Base request for paginated queries with common filtering.</summary>
public record BaseQueryRequest
{
	/// <summary>
	/// Page number (1-based).
	/// </summary>
	public int Page { get; init; } = 1;

	/// <summary>
	/// Number of items per page.
	/// </summary>
	public int PageSize { get; init; } = PaginationConstants.DefaultPageSize;

	/// <summary>
	/// Optional search term used to filter results.
	/// </summary>
	public string? SearchTerm { get; init; }

	/// <summary>
	/// Optional start date filter (inclusive).
	/// </summary>
	public DateTime? StartDate { get; init; }

	/// <summary>
	/// Optional end date filter (inclusive).
	/// </summary>
	public DateTime? EndDate { get; init; }

	/// <summary>
	/// Field name to sort by (defaults to "Id").
	/// </summary>
	public string? SortBy { get; init; } = "Id";

	/// <summary>
	/// When true, sorts descending; otherwise ascending.
	/// </summary>
	public bool SortDescending { get; init; } = true;

	/// <summary>
	/// Computes the number of items to skip for pagination.
	/// </summary>
	/// <returns>
	/// The number of items to skip based on <see cref="Page"/> and <see cref="PageSize"/>.
	/// </returns>
	public int GetSkip() => (Page - 1) * PageSize;

	/// <summary>
	/// Returns the page size constrained by the configured maximum.
	/// </summary>
	/// <returns>
	/// The validated page size (not greater than <see cref="PaginationConstants.MaxPageSize"/>).
	/// </returns>
	public int GetValidatedPageSize() =>
		Math.Min(PageSize, PaginationConstants.MaxPageSize);
}