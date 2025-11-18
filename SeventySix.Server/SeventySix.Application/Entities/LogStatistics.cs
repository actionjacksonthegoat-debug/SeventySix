// <copyright file="LogStatistics.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Application.Entities;

/// <summary>
/// Statistics data for log dashboard.
/// </summary>
/// <remarks>
/// Aggregated metrics for monitoring and analytics dashboard.
/// Provides counts, averages, and top error sources.
///
/// Design Patterns:
/// - Value Object: Represents immutable statistical data
///
/// SOLID Principles:
/// - SRP: Only responsible for statistics data
/// - No framework dependencies (pure POCO)
/// </remarks>
public class LogStatistics
{
	/// <summary>
	/// Gets or sets the total number of logs in the date range.
	/// </summary>
	public int TotalLogs
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the number of Error level logs.
	/// </summary>
	public int ErrorCount
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the number of Warning level logs.
	/// </summary>
	public int WarningCount
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the number of Fatal level logs.
	/// </summary>
	public int FatalCount
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the average response time in milliseconds.
	/// </summary>
	public double AverageResponseTimeMs
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the total number of HTTP requests logged.
	/// </summary>
	public int TotalRequests
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the number of failed requests (HTTP 4xx/5xx).
	/// </summary>
	public int FailedRequests
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the top error sources (class names) with their counts.
	/// </summary>
	/// <remarks>
	/// Dictionary where key is SourceContext and value is error count.
	/// Limited to top 10 sources.
	/// </remarks>
	public Dictionary<string, int> TopErrorSources
	{
		get; set;
	} = [];

	/// <summary>
	/// Gets or sets the request counts by path.
	/// </summary>
	/// <remarks>
	/// Dictionary where key is RequestPath and value is request count.
	/// Limited to top 10 paths.
	/// </remarks>
	public Dictionary<string, int> RequestsByPath
	{
		get; set;
	} = [];
}