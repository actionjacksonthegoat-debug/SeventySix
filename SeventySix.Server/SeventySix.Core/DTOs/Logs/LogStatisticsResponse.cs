// <copyright file="LogStatisticsResponse.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Core.DTOs.Logs;

/// <summary>
/// Response DTO for log statistics.
/// </summary>
/// <remarks>
/// Provides aggregated statistics for dashboard display including:
/// - Total log counts by level
/// - Average response times
/// - Failed request counts
/// - Top error sources
/// - Request distribution by path
///
/// Design Patterns:
/// - DTO: Data Transfer Object for API response
///
/// SOLID Principles:
/// - SRP: Only responsible for statistics data transfer
/// </remarks>
public class LogStatisticsResponse
{
	/// <summary>
	/// Gets or sets the total number of logs in the period.
	/// </summary>
	public int TotalLogs
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the number of error level logs.
	/// </summary>
	public int ErrorCount
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the number of warning level logs.
	/// </summary>
	public int WarningCount
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the number of fatal level logs.
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
	/// Gets or sets the number of failed requests (HTTP 400+).
	/// </summary>
	public int FailedRequests
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the top 10 error sources by frequency.
	/// </summary>
	public Dictionary<string, int> TopErrorSources { get; set; } = [];

	/// <summary>
	/// Gets or sets the top 10 request paths by frequency.
	/// </summary>
	public Dictionary<string, int> RequestsByPath { get; set; } = [];

	/// <summary>
	/// Gets or sets the date range start for the statistics.
	/// </summary>
	public DateTime StartDate
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the date range end for the statistics.
	/// </summary>
	public DateTime EndDate
	{
		get; set;
	}
}