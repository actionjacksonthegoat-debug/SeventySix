// <copyright file="BaseQueryRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.BusinessLogic.DTOs.Base;

/// <summary>
/// Base request model for paginated queries with common filtering.
/// </summary>
/// <remarks>
/// Contains properties shared across ALL query requests.
/// Provides date range filtering, pagination, search, and sorting capabilities.
///
/// Design Patterns:
/// - DTO Pattern: Immutable data transfer object
/// - Template Pattern: Base class for concrete query requests
///
/// SOLID Principles:
/// - SRP: Only responsible for common query parameters
/// - OCP: Open for extension (inheritance), closed for modification
/// - DIP: Abstracts common query concerns
///
/// Default Values:
/// - Page: 1 (1-based pagination)
/// - PageSize: 50 (optimized for typical table displays)
/// - StartDate: 1 hour ago (sensible default for time-based queries)
/// - EndDate: null (no upper bound - returns all from StartDate forward)
/// - SortBy: "Id" (consistent primary key sorting)
/// - SortDescending: false (ascending by default)
/// </remarks>
public record BaseQueryRequest
{
	/// <summary>
	/// Gets the page number (1-based).
	/// </summary>
	public int Page
	{
		get; init;
	} = 1;

	/// <summary>
	/// Gets the page size.
	/// </summary>
	public int PageSize
	{
		get; init;
	} = 50;

	/// <summary>
	/// Gets the search term to filter by concrete columns.
	/// </summary>
	/// <remarks>
	/// Searches across multiple properties in the concrete instance.
	/// Minimum 3 characters, maximum 200 characters when provided.
	/// Case-insensitive search across entity-specific fields.
	/// </remarks>
	public string? SearchTerm
	{
		get; init;
	}

	/// <summary>
	/// Gets or sets the start date filter (inclusive).
	/// </summary>
	/// <remarks>
	/// Defaults to 1 hour ago (DateTime.UtcNow.AddHours(-1)).
	/// Filters records with timestamps >= StartDate.
	/// Uses UTC for consistency across time zones.
	/// </remarks>
	public DateTime? StartDate
	{
		get; init;
	} = DateTime.UtcNow.AddHours(-1);

	/// <summary>
	/// Gets or sets the end date filter (inclusive).
	/// </summary>
	/// <remarks>
	/// Optional. If null, returns all records from StartDate forward.
	/// If provided, filters records with timestamps &lt;= EndDate.
	/// Uses UTC for consistency across time zones.
	/// </remarks>
	public DateTime? EndDate
	{
		get; init;
	}

	/// <summary>
	/// Gets or sets the field to sort by.
	/// </summary>
	/// <remarks>
	/// Defaults to "Id" for consistent primary key sorting.
	/// Validated against entity properties by concrete validators.
	/// Case-insensitive comparison supported.
	/// </remarks>
	public string? SortBy
	{
		get; init;
	} = "Id";

	/// <summary>
	/// Gets a value indicating whether to sort in descending order.
	/// </summary>
	public bool SortDescending
	{
		get; init;
	} = false;

	/// <summary>
	/// Calculates the skip count for pagination.
	/// </summary>
	/// <returns>Number of records to skip.</returns>
	/// <remarks>
	/// Used by repository layer to calculate OFFSET in SQL queries.
	/// Formula: (Page - 1) * PageSize
	/// </remarks>
	public int GetSkip() => (Page - 1) * PageSize;

	/// <summary>
	/// Gets the validated page size (capped at 100).
	/// </summary>
	/// <returns>Validated page size.</returns>
	/// <remarks>
	/// Prevents excessive database queries by capping at 100 records.
	/// Used by repository layer to calculate LIMIT in SQL queries.
	/// </remarks>
	public int GetValidatedPageSize() => Math.Min(PageSize, 100);
}