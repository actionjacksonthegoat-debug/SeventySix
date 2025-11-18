// <copyright file="ILogChartService.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.BusinessLogic.DTOs.LogCharts;
using SeventySix.BusinessLogic.DTOs.Logs;

namespace SeventySix.BusinessLogic.Interfaces;

/// <summary>
/// Service interface for log chart data operations.
/// </summary>
/// <remarks>
/// Provides methods to retrieve aggregated log data for visualization.
/// Follows ISP by defining only log chart operations.
/// </remarks>
public interface ILogChartService
{
	/// <summary>
	/// Retrieves log counts grouped by severity level.
	/// </summary>
	/// <param name="startDate">Optional start date for filtering.</param>
	/// <param name="endDate">Optional end date for filtering.</param>
	/// <param name="cancellationToken">Cancellation token for the async operation.</param>
	/// <returns>Log counts by level.</returns>
	public Task<LogsByLevelResponse> GetLogsByLevelAsync(
		DateTime? startDate,
		DateTime? endDate,
		CancellationToken cancellationToken);

	/// <summary>
	/// Retrieves log counts grouped by hour.
	/// </summary>
	/// <param name="hoursBack">Number of hours to look back from current time.</param>
	/// <param name="cancellationToken">Cancellation token for the async operation.</param>
	/// <returns>Hourly log counts.</returns>
	public Task<LogsByHourResponse> GetLogsByHourAsync(
		int hoursBack,
		CancellationToken cancellationToken);

	/// <summary>
	/// Retrieves log counts grouped by source component.
	/// </summary>
	/// <param name="topN">Number of top sources to return.</param>
	/// <param name="cancellationToken">Cancellation token for the async operation.</param>
	/// <returns>Log counts by source.</returns>
	public Task<LogsBySourceResponse> GetLogsBySourceAsync(
		int topN,
		CancellationToken cancellationToken);

	/// <summary>
	/// Retrieves recent error and warning log entries.
	/// </summary>
	/// <param name="count">Number of recent errors to return.</param>
	/// <param name="cancellationToken">Cancellation token for the async operation.</param>
	/// <returns>Recent error log summaries.</returns>
	public Task<RecentErrorsResponse> GetRecentErrorsAsync(
		int count,
		CancellationToken cancellationToken);

	/// <summary>
	/// Retrieves time-series log data for charting.
	/// </summary>
	/// <param name="period">Time period for the chart (24h, 7d, 30d).</param>
	/// <param name="cancellationToken">Cancellation token for the async operation.</param>
	/// <returns>Chart data with time-series log counts.</returns>
	public Task<LogChartDataResponse> GetChartDataAsync(
		string period,
		CancellationToken cancellationToken);
}