// <copyright file="LogChartResponseTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.BusinessLogic.DTOs.LogCharts;

namespace SeventySix.Core.Tests.DTOs.LogCharts;

/// <summary>
/// Unit tests for Log Chart DTOs.
/// </summary>
public class LogChartResponseTests
{
	[Fact]
	public void LogsByLevelResponse_Constructor_ShouldInitializeWithEmptyDictionary()
	{
		// Arrange & Act
		LogsByLevelResponse response = new();

		// Assert
		Assert.NotNull(response.LogCounts);
		Assert.Empty(response.LogCounts);
	}

	[Fact]
	public void LogsByLevelResponse_LogCounts_ShouldStoreMultipleLevels()
	{
		// Arrange & Act
		LogsByLevelResponse response = new()
		{
			LogCounts = new Dictionary<string, int>
			{
				{ "Information", 150 },
				{ "Warning", 25 },
				{ "Error", 5 },
				{ "Critical", 1 },
			},
		};

		// Assert
		Assert.Equal(4, response.LogCounts.Count);
		Assert.Equal(150, response.LogCounts["Information"]);
		Assert.Equal(25, response.LogCounts["Warning"]);
		Assert.Equal(5, response.LogCounts["Error"]);
		Assert.Equal(1, response.LogCounts["Critical"]);
	}

	[Fact]
	public void LogsByHourResponse_Constructor_ShouldInitializeWithEmptyList()
	{
		// Arrange & Act
		LogsByHourResponse response = new();

		// Assert
		Assert.NotNull(response.HourlyData);
		Assert.Empty(response.HourlyData);
	}

	[Fact]
	public void LogsByHourResponse_HourlyData_ShouldStoreMultipleDataPoints()
	{
		// Arrange
		DateTime now = DateTime.UtcNow;
		LogsByHourResponse response = new()
		{
			HourlyData =
			[
				new() { Hour = now.AddHours(-2), Count = 100 },
				new() { Hour = now.AddHours(-1), Count = 150 },
				new() { Hour = now, Count = 75 },
			],
		};

		// Assert
		Assert.Equal(3, response.HourlyData.Count);
		Assert.Equal(100, response.HourlyData[0].Count);
		Assert.Equal(150, response.HourlyData[1].Count);
		Assert.Equal(75, response.HourlyData[2].Count);
	}

	[Fact]
	public void HourlyLogData_Constructor_ShouldInitializeWithDefaults()
	{
		// Arrange & Act
		HourlyLogData data = new();

		// Assert
		Assert.Equal(default(DateTime), data.Hour);
		Assert.Equal(0, data.Count);
	}

	[Fact]
	public void HourlyLogData_Properties_ShouldSetAndGetCorrectly()
	{
		// Arrange
		DateTime hour = DateTime.UtcNow;
		HourlyLogData data = new()
		{
			Hour = hour,
			Count = 250,
		};

		// Assert
		Assert.Equal(hour, data.Hour);
		Assert.Equal(250, data.Count);
	}

	[Fact]
	public void LogsBySourceResponse_Constructor_ShouldInitializeWithEmptyDictionary()
	{
		// Arrange & Act
		LogsBySourceResponse response = new();

		// Assert
		Assert.NotNull(response.SourceCounts);
		Assert.Empty(response.SourceCounts);
	}

	[Fact]
	public void LogsBySourceResponse_SourceCounts_ShouldStoreMultipleSources()
	{
		// Arrange & Act
		LogsBySourceResponse response = new()
		{
			SourceCounts = new Dictionary<string, int>
			{
				{ "WeatherController", 500 },
				{ "UserService", 300 },
				{ "ErrorQueueService", 50 },
			},
		};

		// Assert
		Assert.Equal(3, response.SourceCounts.Count);
		Assert.Equal(500, response.SourceCounts["WeatherController"]);
		Assert.Equal(300, response.SourceCounts["UserService"]);
		Assert.Equal(50, response.SourceCounts["ErrorQueueService"]);
	}

	[Fact]
	public void RecentErrorsResponse_Constructor_ShouldInitializeWithEmptyList()
	{
		// Arrange & Act
		RecentErrorsResponse response = new();

		// Assert
		Assert.NotNull(response.Errors);
		Assert.Empty(response.Errors);
	}

	[Fact]
	public void RecentErrorsResponse_Errors_ShouldStoreMultipleErrors()
	{
		// Arrange
		DateTime now = DateTime.UtcNow;
		RecentErrorsResponse response = new()
		{
			Errors =
			[
				new() {
					Timestamp = now.AddMinutes(-5),
					Level = "Error",
					Message = "Database connection failed",
					Source = "DatabaseService",
				},
				new() {
					Timestamp = now.AddMinutes(-2),
					Level = "Critical",
					Message = "API rate limit exceeded",
					Source = "OpenWeatherService",
				},
			],
		};

		// Assert
		Assert.Equal(2, response.Errors.Count);
		Assert.Equal("Error", response.Errors[0].Level);
		Assert.Equal("Critical", response.Errors[1].Level);
		Assert.Equal("Database connection failed", response.Errors[0].Message);
	}

	[Fact]
	public void ErrorLogSummary_Constructor_ShouldInitializeWithDefaults()
	{
		// Arrange & Act
		ErrorLogSummary error = new();

		// Assert
		Assert.Equal(default(DateTime), error.Timestamp);
		Assert.Equal(string.Empty, error.Level);
		Assert.Equal(string.Empty, error.Message);
		Assert.Equal(string.Empty, error.Source);
	}

	[Fact]
	public void ErrorLogSummary_Properties_ShouldSetAndGetCorrectly()
	{
		// Arrange
		DateTime timestamp = DateTime.UtcNow;
		ErrorLogSummary error = new()
		{
			Timestamp = timestamp,
			Level = "Warning",
			Message = "Cache miss",
			Source = "CacheService",
		};

		// Assert
		Assert.Equal(timestamp, error.Timestamp);
		Assert.Equal("Warning", error.Level);
		Assert.Equal("Cache miss", error.Message);
		Assert.Equal("CacheService", error.Source);
	}
}