// <copyright file="LogsByLevelResponse.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Application.DTOs.LogCharts;

/// <summary>
/// Represents log count statistics grouped by severity level.
/// </summary>
/// <remarks>
/// Used for visualizing log distribution across severity levels (Information, Warning, Error, Critical).
/// Follows SRP by representing only level-based log aggregation data.
/// </remarks>
public class LogsByLevelResponse
{
	/// <summary>
	/// Gets or sets the log counts keyed by severity level.
	/// </summary>
	/// <value>
	/// Dictionary where key is log level (e.g., "Information", "Warning") and value is the count.
	/// </value>
	public Dictionary<string, int> LogCounts { get; set; } = [];
}

/// <summary>
/// Represents log count statistics grouped by hour.
/// </summary>
/// <remarks>
/// Used for visualizing log trends over time with hourly granularity.
/// Follows SRP by representing only time-based log aggregation data.
/// </remarks>
public class LogsByHourResponse
{
	/// <summary>
	/// Gets or sets the collection of hourly log data points.
	/// </summary>
	public List<HourlyLogData> HourlyData { get; set; } = [];
}

/// <summary>
/// Represents log count data for a specific hour.
/// </summary>
/// <remarks>
/// Contains a timestamp and count pair for time-series visualization.
/// Follows SRP by representing a single data point in the time series.
/// </remarks>
public class HourlyLogData
{
	/// <summary>
	/// Gets or sets the hour timestamp.
	/// </summary>
	/// <value>
	/// Timestamp representing the start of the hour.
	/// </value>
	public DateTime Hour
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the number of logs recorded during this hour.
	/// </summary>
	public int Count
	{
		get; set;
	}
}

/// <summary>
/// Represents log count statistics grouped by source component.
/// </summary>
/// <remarks>
/// Used for identifying which components generate the most logs.
/// Follows SRP by representing only source-based log aggregation data.
/// </remarks>
public class LogsBySourceResponse
{
	/// <summary>
	/// Gets or sets the log counts keyed by source component name.
	/// </summary>
	/// <value>
	/// Dictionary where key is source name (e.g., "WeatherController") and value is the count.
	/// </value>
	public Dictionary<string, int> SourceCounts { get; set; } = [];
}

/// <summary>
/// Represents a collection of recent error and warning log entries.
/// </summary>
/// <remarks>
/// Used for displaying the most recent problematic log entries in the dashboard.
/// Follows SRP by representing only recent error log data.
/// </remarks>
public class RecentErrorsResponse
{
	/// <summary>
	/// Gets or sets the collection of recent error log summaries.
	/// </summary>
	public List<ErrorLogSummary> Errors { get; set; } = [];
}

/// <summary>
/// Represents a summary of a single error or warning log entry.
/// </summary>
/// <remarks>
/// Contains essential information about an error for quick identification.
/// Follows SRP by representing only error log summary data.
/// </remarks>
public class ErrorLogSummary
{
	/// <summary>
	/// Gets or sets the timestamp when the error occurred.
	/// </summary>
	public DateTime Timestamp
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the severity level of the log entry.
	/// </summary>
	/// <value>
	/// Log level such as "Warning", "Error", or "Critical".
	/// </value>
	public string Level { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the error message.
	/// </summary>
	public string Message { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the source component that generated the error.
	/// </summary>
	/// <value>
	/// Source identifier such as controller or service name.
	/// </value>
	public string Source { get; set; } = string.Empty;
}