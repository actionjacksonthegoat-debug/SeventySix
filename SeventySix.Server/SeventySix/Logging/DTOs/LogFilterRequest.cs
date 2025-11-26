// <copyright file="LogFilterRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared;

namespace SeventySix.Logging;

/// <summary>
/// Request DTO for filtering log entries.
/// </summary>
/// <remarks>
/// Inherits common query properties from BaseQueryRequest.
/// ONLY adds domain-specific LogLevel filter.
/// Uses base defaults: PageSize=50, SortBy="Id", StartDate=1 hour ago.
///
/// Supports filtering by log level, date range, and full-text search.
/// Includes pagination support with configurable page size (max 100 records).
///
/// Design Patterns:
/// - DTO: Data Transfer Object for API request
/// - Template: Inherits from BaseQueryRequest
///
/// SOLID Principles:
/// - SRP: Only responsible for log-specific filter criteria
/// - OCP: Extends base without modification
/// </remarks>
public record LogFilterRequest : BaseQueryRequest
{
	/// <summary>
	/// Gets the log level filter (Warning, Error, Fatal).
	/// </summary>
	/// <remarks>
	/// LogFilterRequest-specific property - ONLY custom value added to base.
	/// Searches across: Message, ExceptionMessage, SourceContext, RequestPath, and StackTrace.
	/// </remarks>
	/// <example>Error</example>
	public string? LogLevel
	{
		get; init;
	}
}
