// <copyright file="GetLogsPagedQuery.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Logging;

/// <summary>
/// Query to retrieve paginated log entries with optional filtering.
/// </summary>
/// <param name="Request">The query request containing pagination and filter parameters.</param>
public record GetLogsPagedQuery(LogQueryRequest Request);
