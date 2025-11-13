// <copyright file="LogChartService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Core.DTOs.LogCharts;
using SeventySix.Core.DTOs.Logs;
using SeventySix.Core.Interfaces;

namespace SeventySix.BusinessLogic.Services;

/// <summary>
/// Service for log chart data operations.
/// </summary>
/// <remarks>
/// Provides business logic for retrieving aggregated log data for visualization.
/// Follows SRP by handling only log chart business logic.
/// Follows DIP by depending on ILogRepository abstraction.
/// </remarks>
public class LogChartService : ILogChartService
{
	private readonly ILogRepository LogRepository;

	/// <summary>
	/// Initializes a new instance of the <see cref="LogChartService"/> class.
	/// </summary>
	/// <param name="logRepository">The log repository.</param>
	public LogChartService(ILogRepository logRepository)
	{
		this.LogRepository = logRepository ?? throw new ArgumentNullException(nameof(logRepository));
	}

	/// <inheritdoc/>
	public async Task<LogsByLevelResponse> GetLogsByLevelAsync(
		DateTime? startDate,
		DateTime? endDate,
		CancellationToken cancellationToken)
	{
		var logs = await LogRepository.GetLogsAsync(
			logLevel: null,
			startDate: startDate,
			endDate: endDate,
			sourceContext: null,
			requestPath: null,
			skip: 0,
			take: int.MaxValue);

		var logCounts = logs
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
		var endDate = DateTime.UtcNow;
		var startDate = endDate.AddHours(-hoursBack);

		var logs = await LogRepository.GetLogsAsync(
			logLevel: null,
			startDate: startDate,
			endDate: endDate,
			sourceContext: null,
			requestPath: null,
			skip: 0,
			take: int.MaxValue);

		// Group logs by hour
		var hourlyData = logs
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
			.OrderBy(h => h.Hour)
			.ToList();

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
		var logs = await LogRepository.GetLogsAsync(
			logLevel: null,
			startDate: null,
			endDate: null,
			sourceContext: null,
			requestPath: null,
			skip: 0,
			take: int.MaxValue);

		var sourceCounts = logs
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
		var logs = await LogRepository.GetLogsAsync(
			logLevel: null,
			startDate: null,
			endDate: null,
			sourceContext: null,
			requestPath: null,
			skip: 0,
			take: int.MaxValue);

		var recentErrors = logs
			.Where(l => l.LogLevel == "Warning" || l.LogLevel == "Error" || l.LogLevel == "Critical")
			.OrderByDescending(l => l.Timestamp)
			.Take(count)
			.Select(l => new ErrorLogSummary
			{
				Timestamp = l.Timestamp,
				Level = l.LogLevel,
				Message = l.Message ?? string.Empty,
				Source = l.SourceContext ?? string.Empty,
			})
			.ToList();

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
		var endDate = DateTime.UtcNow;
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
		var logs = await LogRepository.GetLogsAsync(
			logLevel: null,
			startDate: startDate,
			endDate: endDate,
			sourceContext: null,
			requestPath: null,
			skip: 0,
			take: int.MaxValue);

		// Generate time intervals
		var intervals = new List<DateTime>();
		var currentTime = startDate;
		while (currentTime <= endDate)
		{
			intervals.Add(currentTime);
			currentTime = currentTime.Add(intervalSize);
		}

		// Group logs by interval
		var dataPoints = intervals.Select(intervalStart =>
		{
			var intervalEnd = intervalStart.Add(intervalSize);
			var intervalLogs = logs.Where(l => l.Timestamp >= intervalStart && l.Timestamp < intervalEnd).ToList();

			return new LogChartDataPoint
			{
				Timestamp = intervalStart,
				ErrorCount = intervalLogs.Count(l => l.LogLevel == "Error"),
				WarningCount = intervalLogs.Count(l => l.LogLevel == "Warning"),
				FatalCount = intervalLogs.Count(l => l.LogLevel == "Critical" || l.LogLevel == "Fatal"),
				TotalCount = intervalLogs.Count,
			};
		}).ToList();

		return new LogChartDataResponse
		{
			Period = period,
			DataPoints = dataPoints,
		};
	}
}