// <copyright file="LogChartResponseTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Core.DTOs.LogCharts;

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
		var response = new LogsByLevelResponse();

		// Assert
		Assert.NotNull(response.LogCounts);
		Assert.Empty(response.LogCounts);
	}

	[Fact]
	public void LogsByLevelResponse_LogCounts_ShouldStoreMultipleLevels()
	{
		// Arrange & Act
		var response = new LogsByLevelResponse
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
		var response = new LogsByHourResponse();

		// Assert
		Assert.NotNull(response.HourlyData);
		Assert.Empty(response.HourlyData);
	}

	[Fact]
	public void LogsByHourResponse_HourlyData_ShouldStoreMultipleDataPoints()
	{
		// Arrange
		var now = DateTime.UtcNow;
		var response = new LogsByHourResponse
		{
			HourlyData = new List<HourlyLogData>
			{
				new HourlyLogData { Hour = now.AddHours(-2), Count = 100 },
				new HourlyLogData { Hour = now.AddHours(-1), Count = 150 },
				new HourlyLogData { Hour = now, Count = 75 },
			},
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
		var data = new HourlyLogData();

		// Assert
		Assert.Equal(default(DateTime), data.Hour);
		Assert.Equal(0, data.Count);
	}

	[Fact]
	public void HourlyLogData_Properties_ShouldSetAndGetCorrectly()
	{
		// Arrange
		var hour = DateTime.UtcNow;
		var data = new HourlyLogData
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
		var response = new LogsBySourceResponse();

		// Assert
		Assert.NotNull(response.SourceCounts);
		Assert.Empty(response.SourceCounts);
	}

	[Fact]
	public void LogsBySourceResponse_SourceCounts_ShouldStoreMultipleSources()
	{
		// Arrange & Act
		var response = new LogsBySourceResponse
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
		var response = new RecentErrorsResponse();

		// Assert
		Assert.NotNull(response.Errors);
		Assert.Empty(response.Errors);
	}

	[Fact]
	public void RecentErrorsResponse_Errors_ShouldStoreMultipleErrors()
	{
		// Arrange
		var now = DateTime.UtcNow;
		var response = new RecentErrorsResponse
		{
			Errors = new List<ErrorLogSummary>
			{
				new ErrorLogSummary
				{
					Timestamp = now.AddMinutes(-5),
					Level = "Error",
					Message = "Database connection failed",
					Source = "DatabaseService",
				},
				new ErrorLogSummary
				{
					Timestamp = now.AddMinutes(-2),
					Level = "Critical",
					Message = "API rate limit exceeded",
					Source = "OpenWeatherService",
				},
			},
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
		var error = new ErrorLogSummary();

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
		var timestamp = DateTime.UtcNow;
		var error = new ErrorLogSummary
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