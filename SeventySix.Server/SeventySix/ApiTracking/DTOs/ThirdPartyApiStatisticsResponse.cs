// <copyright file="ThirdPartyApiStatisticsResponse.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

namespace SeventySix.ApiTracking;

/// <summary>
/// Response DTO for aggregated third-party API statistics.
/// </summary>
/// <remarks>
/// Provides summary statistics for all tracked third-party APIs.
/// Used for dashboard display of API usage metrics.
///
/// Design Patterns:
/// - DTO: Data Transfer Object for API response
///
/// SOLID Principles:
/// - SRP: Only responsible for aggregated API statistics data transfer
/// </remarks>
public class ThirdPartyApiStatisticsResponse
{
	/// <summary>
	/// Gets or sets the total number of API calls made today across all APIs.
	/// </summary>
	public int TotalCallsToday
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the total number of distinct APIs being tracked.
	/// </summary>
	public int TotalApisTracked
	{
		get; set;
	}

	/// <summary>
	/// Gets or sets the number of calls made to each API today.
	/// Key: API name, Value: Call count.
	/// </summary>
	public Dictionary<string, int> CallsByApi { get; set; } = [];

	/// <summary>
	/// Gets or sets the last time each API was called.
	/// Key: API name, Value: Last called timestamp (null if never called).
	/// </summary>
	public Dictionary<string, DateTime?> LastCalledByApi { get; set; } = [];
}