// <copyright file="LogFilterRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Core.DTOs.Logs;

/// <summary>
/// Request DTO for filtering log entries.
/// </summary>
/// <remarks>
/// Supports filtering by log level, date range, source context, and request path.
/// Includes pagination support with configurable page size (max 100 records).
///
/// Design Patterns:
/// - DTO: Data Transfer Object for API request
///
/// SOLID Principles:
/// - SRP: Only responsible for log filter criteria
/// </remarks>
public class LogFilterRequest
{
	/// <summary>
	/// Gets or sets the log level filter (Warning, Error, Fatal).
	/// </summary>
	/// <example>Error</example>
	public string? LogLevel
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the start date filter (inclusive).
	/// </summary>
	public DateTime? StartDate
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the end date filter (inclusive).
	/// </summary>
	public DateTime? EndDate
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the source context filter (partial match).
	/// </summary>
	/// <example>SeventySix.Services.UserService</example>
	public string? SourceContext
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the request path filter (partial match).
	/// </summary>
	/// <example>/api/users</example>
	public string? RequestPath
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the page number (1-based).
	/// </summary>
	public int Page { get; set; } = 1;

	/// <summary>
	/// Gets or sets the page size (max 100).
	/// </summary>
	public int PageSize { get; set; } = 50;

	/// <summary>
	/// Calculates the skip count for pagination.
	/// </summary>
	/// <returns>Number of records to skip.</returns>
	public int GetSkip() => (Page - 1) * PageSize;

	/// <summary>
	/// Gets the validated page size (capped at 100).
	/// </summary>
	/// <returns>Validated page size.</returns>
	public int GetValidatedPageSize() => Math.Min(PageSize, 100);
}