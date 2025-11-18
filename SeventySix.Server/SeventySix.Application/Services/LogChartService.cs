// <copyright file="LogChartService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Application.DTOs.LogCharts;
using SeventySix.Application.DTOs.Logs;
using SeventySix.Application.Entities;
using SeventySix.Application.Interfaces;

namespace SeventySix.Application.Services;

/// <summary>
/// Service for log chart data operations.
/// </summary>
/// <remarks>
/// Provides business logic for retrieving aggregated log data for visualization.
/// Follows SRP by handling only log chart business logic.
/// Follows DIP by depending on IlogRepository abstraction.
/// </remarks>
/// <remarks>
/// Initializes a new instance of the <see cref="LogChartService"/> class.
/// </remarks>
/// <param name="logRepository">The log repository.</param>
public class LogChartService(ILogRepository logRepository) : ILogChartService
{
	/// <inheritdoc/>
	public async Task<LogsByLevelResponse> GetLogsByLevelAsync(
		DateTime? startDate,
		DateTime? endDate,
		CancellationToken cancellationToken)
	{
		IEnumerable<Log> logs = await logRepository.GetLogsAsync(
			logLevel: null,
			startDate: startDate,
			endDate: endDate,
			sourceContext: null,
			requestPath: null,
			skip: 0,
			take: int.MaxValue,
			cancellationToken);

		Dictionary<string, int> logCounts = logs
			.GroupBy(l => l.LogLevel)
			.ToDictionary(g => g.Key, g => g.Count());

		return new LogsByLevelResponse
		{
			LogCounts = logCounts,
		};
	}

	/// <inheritdoc/>
	public async Task<LogsByHourResponse> GetLogsByHourAsync(
		int hoursBack,
		CancellationToken cancellationToken)
	{
		DateTime endDate = DateTime.UtcNow;
		DateTime startDate = endDate.AddHours(-hoursBack);

		IEnumerable<Log> logs = await logRepository.GetLogsAsync(
			logLevel: null,
			startDate: startDate,
			endDate: endDate,
			sourceContext: null,
			requestPath: null,
			skip: 0,
			take: int.MaxValue,
			cancellationToken);

		// Group logs by hour
		List<HourlyLogData> hourlyData = [.. logs
			.GroupBy(l => new DateTime(
				l.Timestamp.Year,
				l.Timestamp.Month,
				l.Timestamp.Day,
				l.Timestamp.Hour,
				0,
				0,
				DateTimeKind.Utc))
			.Select(g => new HourlyLogData
			{
				Hour = g.Key,
				Count = g.Count(),
			})
			.OrderBy(h => h.Hour)];

		return new LogsByHourResponse
		{
			HourlyData = hourlyData,
		};
	}

	/// <inheritdoc/>
	public async Task<LogsBySourceResponse> GetLogsBySourceAsync(
		int topN,
		CancellationToken cancellationToken)
	{
		IEnumerable<Log> logs = await logRepository.GetLogsAsync(
			logLevel: null,
			startDate: null,
			endDate: null,
			sourceContext: null,
			requestPath: null,
			skip: 0,
			take: int.MaxValue,
			cancellationToken);

		Dictionary<string, int> sourceCounts = logs
			.Where(l => !string.IsNullOrEmpty(l.SourceContext))
			.GroupBy(l => l.SourceContext)
			.OrderByDescending(g => g.Count())
			.Take(topN)
			.ToDictionary(g => g.Key!, g => g.Count());

		return new LogsBySourceResponse
		{
			SourceCounts = sourceCounts,
		};
	}

	/// <inheritdoc/>
	public async Task<RecentErrorsResponse> GetRecentErrorsAsync(
		int count,
		CancellationToken cancellationToken)
	{
		IEnumerable<Log> logs = await logRepository.GetLogsAsync(
			logLevel: null,
			startDate: null,
			endDate: null,
			sourceContext: null,
			requestPath: null,
			skip: 0,
			take: int.MaxValue,
			cancellationToken);

		List<ErrorLogSummary> recentErrors = [.. logs
			.Where(l => l.LogLevel == "Warning" || l.LogLevel == "Error" || l.LogLevel == "Critical")
			.OrderByDescending(l => l.Timestamp)
			.Take(count)
			.Select(l => new ErrorLogSummary
			{
				Timestamp = l.Timestamp,
				Level = l.LogLevel,
				Message = l.Message ?? string.Empty,
				Source = l.SourceContext ?? string.Empty,
			})];

		return new RecentErrorsResponse
		{
			Errors = recentErrors,
		};
	}

	/// <inheritdoc/>
	public async Task<LogChartDataResponse> GetChartDataAsync(
		string period,
		CancellationToken cancellationToken)
	{
		// Validate period
		if (period != "24h" && period != "7d" && period != "30d")
		{
			throw new ArgumentException($"Invalid period: {period}. Must be '24h', '7d', or '30d'.", nameof(period));
		}

		// Calculate time range based on period
		DateTime endDate = DateTime.UtcNow;
		DateTime startDate;
		TimeSpan intervalSize;

		switch (period)
		{
			case "24h":
				startDate = endDate.AddHours(-24);
				intervalSize = TimeSpan.FromHours(1); // Hourly intervals
				break;
			case "7d":
				startDate = endDate.AddDays(-7);
				intervalSize = TimeSpan.FromHours(6); // 6-hour intervals
				break;
			case "30d":
				startDate = endDate.AddDays(-30);
				intervalSize = TimeSpan.FromDays(1); // Daily intervals
				break;
			default:
				throw new ArgumentException($"Invalid period: {period}", nameof(period));
		}

		// Fetch logs within the time range
		IEnumerable<Log> logs = await logRepository.GetLogsAsync(
			logLevel: null,
			startDate: startDate,
			endDate: endDate,
			sourceContext: null,
			requestPath: null,
			skip: 0,
			take: int.MaxValue,
			cancellationToken);

		// Generate time intervals
		List<DateTime> intervals = [];
		DateTime currentTime = startDate;
		while (currentTime <= endDate)
		{
			intervals.Add(currentTime);
			currentTime = currentTime.Add(intervalSize);
		}

		// Group logs by interval
		List<LogChartDataPoint> dataPoints = [.. intervals.Select(intervalStart =>
		{
			DateTime intervalEnd = intervalStart.Add(intervalSize);
			List<Log> intervalLogs = [.. logs.Where(l => l.Timestamp >= intervalStart && l.Timestamp < intervalEnd)];

			return new LogChartDataPoint
			{
				Timestamp = intervalStart,
				ErrorCount = intervalLogs.Count(l => l.LogLevel == "Error"),
				WarningCount = intervalLogs.Count(l => l.LogLevel == "Warning"),
				FatalCount = intervalLogs.Count(l => l.LogLevel == "Critical" || l.LogLevel == "Fatal"),
				TotalCount = intervalLogs.Count,
			};
		})];

		return new LogChartDataResponse
		{
			Period = period,
			DataPoints = dataPoints,
		};
	}
}