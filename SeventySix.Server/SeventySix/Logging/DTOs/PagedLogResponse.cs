// <copyright file="PagedLogResponse.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging;

/// <summary>
/// Paginated response DTO for log entries.
/// </summary>
/// <remarks>
/// Represents a paginated collection of log entries with metadata.
/// Contains pagination information and the actual data.
///
/// Design Patterns:
/// - DTO: Data Transfer Object for API response
/// - Wrapper: Wraps collection with pagination metadata
///
/// SOLID Principles:
/// - SRP: Only responsible for paginated log data transfer
/// </remarks>
public class PagedLogResponse
{
	/// <summary>
	/// Gets or sets the collection of log entries for the current page.
	/// </summary>
	public List<LogResponse> Data { get; set; } = [];

	/// <summary>
	/// Gets or sets the total count of logs matching the filter criteria.
	/// </summary>
	public int TotalCount
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the current page number (1-based).
	/// </summary>
	public int PageNumber
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the page size (number of items per page).
	/// </summary>
	public int PageSize
	{
		get; set;
	}

	/// <summary>
	/// Gets the total number of pages.
	/// </summary>
	public int TotalPages => PageSize > 0 ? (int)Math.Ceiling(TotalCount / (double)PageSize) : 0;

	/// <summary>
	/// Gets a value indicating whether there is a previous page.
	/// </summary>
	public bool HasPreviousPage => PageNumber > 1;

	/// <summary>
	/// Gets a value indicating whether there is a next page.
	/// </summary>
	public bool HasNextPage => PageNumber < TotalPages;
}
