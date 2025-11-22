// <copyright file="LogRepositoryTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using SeventySix.BusinessLogic.Entities;
using SeventySix.Data;
using SeventySix.Data.Repositories;
using SeventySix.TestUtilities.TestBases;

namespace SeventySix.Data.Tests.Repositories;

/// <summary>
/// Integration tests for <see cref="LogRepository"/>.
/// </summary>
/// <remarks>
/// Uses Testcontainers with PostgreSQL for realistic integration testing.
/// Follows TDD principles and ensures repository implements contract correctly.
///
/// Test Coverage:
/// - CRUD operations
/// - Filtering and pagination
/// - Statistics generation
/// - Cleanup operations
/// </remarks>
[Collection("DatabaseTests")]
public class LogRepositoryTests : DataPostgreSqlTestBase, IClassFixture<TestcontainersPostgreSqlFixture>
{
	private readonly LogRepository Repository;

	public LogRepositoryTests(TestcontainersPostgreSqlFixture fixture)
		: base(fixture)
	{
		ApplicationDbContext context = CreateDbContext();
		Repository = new LogRepository(
			context,
			Mock.Of<ILogger<LogRepository>>());
	}

	[Fact]
	public async Task CreateAsync_CreatesLog_SuccessfullyAsync()
	{
		// Arrange
		Log log = new()
		{
			LogLevel = "Error",
			Message = "Test error message",
			Timestamp = DateTime.UtcNow,
		};

		// Act
		Log result = await Repository.CreateAsync(log);

		// Assert
		Assert.NotEqual(0, result.Id);
		Assert.Equal("Error", result.LogLevel);
		Assert.Equal("Test error message", result.Message);
	}

	[Fact]
	public async Task CreateAsync_ThrowsArgumentNullException_WhenEntityIsNullAsync()
	{
		// Act & Assert
		await Assert.ThrowsAsync<ArgumentNullException>(
			async () => await Repository.CreateAsync(null!));
	}

	[Fact]
	public async Task GetLogsAsync_ReturnsAllLogs_WhenNoFiltersAsync()
	{
		// Arrange
		await SeedTestLogsAsync();

		// Act
		IEnumerable<Log> result = await Repository.GetLogsAsync();

		// Assert
		Assert.NotEmpty(result);
		Assert.True(result.Count() >= 3);
	}

	[Fact]
	public async Task GetLogsAsync_FiltersByLogLevel_SuccessfullyAsync()
	{
		// Arrange
		await SeedTestLogsAsync();

		// Act
		IEnumerable<Log> result = await Repository.GetLogsAsync(logLevel: "Error");

		// Assert
		Assert.All(result, log => Assert.Equal("Error", log.LogLevel));
	}

	[Fact]
	public async Task GetLogsAsync_FiltersByDateRange_SuccessfullyAsync()
	{
		// Arrange
		await SeedTestLogsAsync();
		DateTime startDate = DateTime.UtcNow.AddHours(-1);
		DateTime endDate = DateTime.UtcNow.AddHours(1);

		// Act
		IEnumerable<Log> result = await Repository.GetLogsAsync(startDate: startDate, endDate: endDate);

		// Assert
		Assert.All(result, log =>
		{
			Assert.True(log.Timestamp >= startDate);
			Assert.True(log.Timestamp <= endDate);
		});
	}

	[Fact]
	public async Task GetLogsAsync_FiltersBySourceContext_SuccessfullyAsync()
	{
		// Arrange
		await SeedTestLogsAsync();

		// Act
		IEnumerable<Log> result = await Repository.GetLogsAsync(sourceContext: "UserService");

		// Assert
		Assert.All(result, log => Assert.Contains("UserService", log.SourceContext ?? string.Empty));
	}

	[Fact]
	public async Task GetLogsAsync_FiltersByRequestPath_SuccessfullyAsync()
	{
		// Arrange
		await SeedTestLogsAsync();

		// Act
		IEnumerable<Log> result = await Repository.GetLogsAsync(requestPath: "/api/users");

		// Assert
		Assert.All(result, log => Assert.Contains("/api/users", log.RequestPath ?? string.Empty));
	}

	[Fact]
	public async Task GetLogsAsync_SupportsPagination_SuccessfullyAsync()
	{
		// Arrange
		await SeedTestLogsAsync();

		// Act
		IEnumerable<Log> page1 = await Repository.GetLogsAsync(skip: 0, take: 2);
		IEnumerable<Log> page2 = await Repository.GetLogsAsync(skip: 2, take: 2);

		// Assert
		Assert.Equal(2, page1.Count());
		Assert.NotEmpty(page2);
		Assert.NotEqual(page1.First().Id, page2.First().Id);
	}

	[Fact]
	public async Task GetLogsAsync_OrdersByTimestampDescending_SuccessfullyAsync()
	{
		// Arrange
		await SeedTestLogsAsync();

		// Act
		List<Log> result = [.. (await Repository.GetLogsAsync())];

		// Assert
		for (int i = 0; i < result.Count - 1; i++)
		{
			Assert.True(result[i].Timestamp >= result[i + 1].Timestamp);
		}
	}

	[Fact]
	public async Task GetLogsAsync_LimitsTo1000Records_MaximumAsync()
	{
		// Arrange
		for (int i = 0; i < 1100; i++)
		{
			await Repository.CreateAsync(new Log
			{
				LogLevel = "Info",
				Message = $"Log {i}",
				Timestamp = DateTime.UtcNow,
			});
		}

		// Act
		IEnumerable<Log> result = await Repository.GetLogsAsync(take: 2000);

		// Assert
		Assert.True(result.Count() <= 1000);
	}

	[Fact]
	public async Task GetLogsCountAsync_ReturnsCorrectCount_WhenNoFiltersAsync()
	{
		// Arrange
		await SeedTestLogsAsync();

		// Act
		int count = await Repository.GetLogsCountAsync();

		// Assert
		Assert.True(count >= 3);
	}

	[Fact]
	public async Task GetLogsCountAsync_FiltersCorrectly_WithMultipleCriteriaAsync()
	{
		// Arrange
		await SeedTestLogsAsync();
		DateTime startDate = DateTime.UtcNow.AddHours(-1);

		// Act
		int count = await Repository.GetLogsCountAsync(
			logLevel: "Error",
			startDate: startDate);

		// Assert
		Assert.True(count > 0);
	}

	[Fact]
	public async Task DeleteOlderThanAsync_DeletesOldLogs_SuccessfullyAsync()
	{
		// Arrange
		Log oldLog = new()
		{
			LogLevel = "Error",
			Message = "Old log",
			Timestamp = DateTime.UtcNow.AddDays(-40),
		};
		await Repository.CreateAsync(oldLog);

		Log recentLog = new()
		{
			LogLevel = "Error",
			Message = "Recent log",
			Timestamp = DateTime.UtcNow,
		};
		await Repository.CreateAsync(recentLog);

		DateTime cutoffDate = DateTime.UtcNow.AddDays(-30);

		// Act
		int deletedCount = await Repository.DeleteOlderThanAsync(cutoffDate);

		// Assert
		Assert.True(deletedCount > 0);
		IEnumerable<Log> remainingLogs = await Repository.GetLogsAsync();
		Assert.All(remainingLogs, log => Assert.True(log.Timestamp >= cutoffDate));
	}

	[Fact]
	public async Task GetStatisticsAsync_ReturnsCorrectStatistics_SuccessfullyAsync()
	{
		// Arrange
		await SeedTestLogsAsync();
		DateTime startDate = DateTime.UtcNow.AddHours(-2);
		DateTime endDate = DateTime.UtcNow.AddHours(2);

		// Act
		LogStatistics stats = await Repository.GetStatisticsAsync(startDate, endDate);

		// Assert
		Assert.NotNull(stats);
		Assert.True(stats.TotalLogs > 0);
		Assert.True(stats.ErrorCount >= 0);
		Assert.True(stats.WarningCount >= 0);
		Assert.NotNull(stats.TopErrorSources);
		Assert.NotNull(stats.RequestsByPath);
	}

	[Fact]
	public async Task GetStatisticsAsync_CalculatesAverageResponseTime_CorrectlyAsync()
	{
		// Arrange
		await Repository.CreateAsync(new Log
		{
			LogLevel = "Info",
			Message = "Request 1",
			DurationMs = 100,
			RequestPath = "/api/test",
			Timestamp = DateTime.UtcNow,
		});

		await Repository.CreateAsync(new Log
		{
			LogLevel = "Info",
			Message = "Request 2",
			DurationMs = 200,
			RequestPath = "/api/test",
			Timestamp = DateTime.UtcNow,
		});

		DateTime startDate = DateTime.UtcNow.AddHours(-1);
		DateTime endDate = DateTime.UtcNow.AddHours(1);

		// Act
		LogStatistics stats = await Repository.GetStatisticsAsync(startDate, endDate);

		// Assert
		Assert.Equal(150, stats.AverageResponseTimeMs);
	}

	[Fact]
	public async Task GetStatisticsAsync_CountsFailedRequests_CorrectlyAsync()
	{
		// Arrange
		await Repository.CreateAsync(new Log
		{
			LogLevel = "Error",
			Message = "Failed request",
			StatusCode = 500,
			RequestPath = "/api/test",
			Timestamp = DateTime.UtcNow,
		});

		await Repository.CreateAsync(new Log
		{
			LogLevel = "Info",
			Message = "Successful request",
			StatusCode = 200,
			RequestPath = "/api/test",
			Timestamp = DateTime.UtcNow,
		});

		DateTime startDate = DateTime.UtcNow.AddHours(-1);
		DateTime endDate = DateTime.UtcNow.AddHours(1);

		// Act
		LogStatistics stats = await Repository.GetStatisticsAsync(startDate, endDate);

		// Assert
		Assert.True(stats.FailedRequests > 0);
	}

	[Fact]
	public async Task GetStatisticsAsync_LimitsTopErrorSources_To10Async()
	{
		// Arrange
		for (int i = 0; i < 15; i++)
		{
			await Repository.CreateAsync(new Log
			{
				LogLevel = "Error",
				Message = $"Error {i}",
				SourceContext = $"Service{i}",
				Timestamp = DateTime.UtcNow,
			});
		}

		DateTime startDate = DateTime.UtcNow.AddHours(-1);
		DateTime endDate = DateTime.UtcNow.AddHours(1);

		// Act
		LogStatistics stats = await Repository.GetStatisticsAsync(startDate, endDate);

		// Assert
		Assert.True(stats.TopErrorSources.Count <= 10);
	}

	private async Task SeedTestLogsAsync()
	{
		Log[] logs =
		[
			new Log
			{
				LogLevel = "Error",
				Message = "Test error 1",
				SourceContext = "SeventySix.Services.UserService",
				RequestPath = "/api/users/1",
				StatusCode = 500,
				DurationMs = 150,
				Timestamp = DateTime.UtcNow,
			},
			new Log
			{
				LogLevel = "Warning",
				Message = "Test warning 1",
				SourceContext = "SeventySix.Services.WeatherService",
				RequestPath = "/api/weather",
				StatusCode = 200,
				DurationMs = 75,
				Timestamp = DateTime.UtcNow.AddMinutes(-5),
			},
			new Log
			{
				LogLevel = "Error",
				Message = "Test error 2",
				SourceContext = "SeventySix.Services.UserService",
				RequestPath = "/api/users/2",
				StatusCode = 404,
				DurationMs = 50,
				Timestamp = DateTime.UtcNow.AddMinutes(-10),
			},
		];

		foreach (Log? log in logs)
		{
			await Repository.CreateAsync(log);
		}
	}
}