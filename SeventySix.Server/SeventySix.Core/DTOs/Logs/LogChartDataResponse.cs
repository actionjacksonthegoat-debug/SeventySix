// <copyright file="LogChartDataResponse.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.Core.DTOs.Logs;

/// <summary>
/// Response DTO for log chart data time-series.
/// Contains aggregated log counts grouped by time intervals for visualization.
/// </summary>
public class LogChartDataResponse
{
	/// <summary>
	/// Gets or sets the time period for the chart data.
	/// </summary>
	/// <remarks>
	/// Supported values: "24h", "7d", "30d"
	/// </remarks>
	public string Period { get; set; } = string.Empty;

	/// <summary>
	/// Gets or sets the list of data points for the chart.
	/// </summary>
	public List<LogChartDataPoint> DataPoints { get; set; } = new();
}

/// <summary>
/// Represents a single data point in the log chart time-series.
/// </summary>
public class LogChartDataPoint
{
	/// <summary>
	/// Gets or sets the timestamp for this data point.
	/// </summary>
	public DateTime Timestamp
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the count of error-level logs at this time.
	/// </summary>
	public int ErrorCount
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the count of warning-level logs at this time.
	/// </summary>
	public int WarningCount
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the count of fatal/critical-level logs at this time.
	/// </summary>
	public int FatalCount
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the total count of all logs at this time.
	/// </summary>
	public int TotalCount
	{
		get; set;
	}
}