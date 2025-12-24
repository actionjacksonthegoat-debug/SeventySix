// <copyright file="LogQueryRequest.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.DTOs;

namespace SeventySix.Logging;

/// <summary>
/// Request DTO for querying log entries with filtering and pagination.
/// </summary>
public record LogQueryRequest : BaseQueryRequest
{
	/// <summary>
	/// Gets the log level filter (Error, Warning, Information, etc.).
	/// </summary>
	public string? LogLevel { get; init; }
}