// <copyright file="LogRepositoryTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using SeventySix.Logging;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.TestBases;

namespace SeventySix.Tests.Logging;

/// <summary>
/// Integration tests for <see cref="LogRepository"/>.
/// </summary>
/// <remarks>
/// Uses Testcontainers with PostgreSQL for realistic integration testing.
/// Follows TDD principles and ensures repository implements contract correctly.
/// Each test class gets its own isolated database for parallel execution.
///
/// Test Coverage:
/// - CRUD operations
/// - Filtering and pagination
/// - Statistics generation
/// - Cleanup operations
/// </remarks>
public class LogRepositoryTests : DataPostgreSqlTestBase, IClassFixture<TestcontainersPostgreSqlFixture>
{
	private readonly LogRepository Repository;

	public LogRepositoryTests(TestcontainersPostgreSqlFixture fixture)
		: base(fixture)
	{
		LoggingDbContext context = CreateLoggingDbContext();
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
			CreateDate = DateTime.UtcNow,
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
	public async Task GetPagedAsync_ReturnsAllLogs_WhenNoFiltersAsync()
	{
		// Arrange
		await SeedTestLogsAsync();

		// Act
		LogFilterRequest request = new();
		(IEnumerable<Log> logs, int _) = await Repository.GetPagedAsync(request);

		// Assert
		Assert.NotEmpty(logs);
		Assert.True(logs.Count() >= 3);
	}

	[Fact]
	public async Task GetPagedAsync_FiltersByLogLevel_SuccessfullyAsync()
	{
		// Arrange
		await SeedTestLogsAsync();

		// Act
		LogFilterRequest request = new() { LogLevel = "Error" };
		(IEnumerable<Log> logs, int _) = await Repository.GetPagedAsync(request);

		// Assert
		Assert.All(logs, log => Assert.Equal("Error", log.LogLevel));
	}

	[Fact]
	public async Task GetPagedAsync_FiltersByDateRange_SuccessfullyAsync()
	{
		// Arrange
		await SeedTestLogsAsync();
		DateTime startDate = DateTime.UtcNow.AddHours(-1);
		DateTime endDate = DateTime.UtcNow.AddHours(1);

		// Act
		LogFilterRequest request = new() { StartDate = startDate, EndDate = endDate };
		(IEnumerable<Log> logs, int _) = await Repository.GetPagedAsync(request);

		// Assert
		Assert.All(logs, log =>
		{
			Assert.True(log.CreateDate >= startDate);
			Assert.True(log.CreateDate <= endDate);
		});
	}

	[Fact]
	public async Task GetPagedAsync_FiltersBySourceContext_SuccessfullyAsync()
	{
		// Arrange
		await SeedTestLogsAsync();

		// Act
		LogFilterRequest request = new() { SearchTerm = "UserService" };
		(IEnumerable<Log> logs, int _) = await Repository.GetPagedAsync(request);

		// Assert
		Assert.All(logs, log => Assert.Contains("UserService", log.SourceContext ?? string.Empty));
	}

	[Fact]
	public async Task GetPagedAsync_FiltersByRequestPath_SuccessfullyAsync()
	{
		// Arrange
		await SeedTestLogsAsync();

		// Act
		LogFilterRequest request = new() { SearchTerm = "/api/users" };
		(IEnumerable<Log> logs, int _) = await Repository.GetPagedAsync(request);

		// Assert
		Assert.All(logs, log => Assert.Contains("/api/users", log.RequestPath ?? string.Empty));
	}

	[Fact]
	public async Task GetPagedAsync_WithSearchTerm_FiltersMultipleFields_SuccessfullyAsync()
	{
		// Arrange
		await SeedTestLogsForSearchAsync();

		// Act - Search for "Authentication" which should match Message field
		LogFilterRequest messageRequest = new() { SearchTerm = "Authentication" };
		(IEnumerable<Log> messageLogs, int _) = await Repository.GetPagedAsync(messageRequest);

		// Act - Search for "UserService" which should match SourceContext field
		LogFilterRequest sourceRequest = new() { SearchTerm = "UserService" };
		(IEnumerable<Log> sourceLogs, int _) = await Repository.GetPagedAsync(sourceRequest);

		// Act - Search for "users" which should match RequestPath field
		LogFilterRequest pathRequest = new() { SearchTerm = "users" };
		(IEnumerable<Log> pathLogs, int _) = await Repository.GetPagedAsync(pathRequest);

		// Act - Search for "NullReference" which should match ExceptionMessage field
		LogFilterRequest exceptionRequest = new() { SearchTerm = "NullReference" };
		(IEnumerable<Log> exceptionLogs, int _) = await Repository.GetPagedAsync(exceptionRequest);

		// Assert - Verify search works across all fields
		Assert.Single(messageLogs); // Only "Authentication failed" message
		Assert.Equal(2, sourceLogs.Count()); // Two logs from UserService
		Assert.Equal(2, pathLogs.Count()); // Two logs with /api/users path
		Assert.Single(exceptionLogs); // Only one NullReferenceException
	}

	[Fact]
	public async Task GetPagedAsync_SupportsPagination_SuccessfullyAsync()
	{
		// Arrange
		await SeedTestLogsAsync();

		// Act
		LogFilterRequest page1Request = new() { Page = 1, PageSize = 2 };
		(IEnumerable<Log> page1Logs, int _) = await Repository.GetPagedAsync(page1Request);

		LogFilterRequest page2Request = new() { Page = 2, PageSize = 2 };
		(IEnumerable<Log> page2Logs, int _) = await Repository.GetPagedAsync(page2Request);

		// Assert
		Assert.Equal(2, page1Logs.Count());
		Assert.NotEmpty(page2Logs);
		Assert.NotEqual(page1Logs.First().Id, page2Logs.First().Id);
	}

	[Fact]
	public async Task GetPagedAsync_OrdersByTimestampDescending_SuccessfullyAsync()
	{
		// Arrange
		await SeedTestLogsAsync();

		// Act
		LogFilterRequest request = new();
		(IEnumerable<Log> logs, int _) = await Repository.GetPagedAsync(request);
		List<Log> result = [.. logs];

		// Assert
		for (int i = 0; i < result.Count - 1; i++)
		{
			Assert.True(result[i].CreateDate >= result[i + 1].CreateDate);
		}
	}

	[Fact]
	public async Task GetPagedAsync_LimitsTo1000Records_MaximumAsync()
	{
		// Arrange
		for (int i = 0; i < 1100; i++)
		{
			await Repository.CreateAsync(new Log
			{
				LogLevel = "Info",
				Message = $"Log {i}",
				CreateDate = DateTime.UtcNow,
			});
		}

		// Act
		LogFilterRequest request = new() { PageSize = 100 }; // Note: PageSize max is 100, not 1000
		(IEnumerable<Log> logs, int _) = await Repository.GetPagedAsync(request);

		// Assert
		Assert.True(logs.Count() <= 100); // PageSize is capped at 100
	}

	[Fact]
	public async Task GetPagedAsync_ReturnsCorrectCount_WhenNoFiltersAsync()
	{
		// Arrange
		await SeedTestLogsAsync();

		// Act
		LogFilterRequest request = new();
		(IEnumerable<Log> _, int count) = await Repository.GetPagedAsync(request);

		// Assert
		Assert.True(count >= 3);
	}

	[Fact]
	public async Task GetPagedAsync_FiltersCorrectly_WithMultipleCriteriaAsync()
	{
		// Arrange
		await SeedTestLogsAsync();
		DateTime startDate = DateTime.UtcNow.AddHours(-1);

		// Act
		LogFilterRequest request = new()
		{
			LogLevel = "Error",
			StartDate = startDate,
		};
		(IEnumerable<Log> _, int count) = await Repository.GetPagedAsync(request);

		// Assert
		Assert.True(count >= 1); // At least one Error log exists
	}

	[Fact]
	public async Task DeleteOlderThanAsync_DeletesOldLogs_SuccessfullyAsync()
	{
		// Arrange
		Log oldLog = new()
		{
			LogLevel = "Error",
			Message = "Old log",
			CreateDate = DateTime.UtcNow.AddDays(-40),
		};
		await Repository.CreateAsync(oldLog);

		Log recentLog = new()
		{
			LogLevel = "Error",
			Message = "Recent log",
			CreateDate = DateTime.UtcNow,
		};
		await Repository.CreateAsync(recentLog);

		DateTime cutoffDate = DateTime.UtcNow.AddDays(-30);

		// Act
		int deletedCount = await Repository.DeleteOlderThanAsync(cutoffDate);

		// Assert
		Assert.True(deletedCount > 0);
		LogFilterRequest request = new() { PageSize = 100 };
		(IEnumerable<Log> remainingLogs, int _) = await Repository.GetPagedAsync(request);
		Assert.All(remainingLogs, log => Assert.True(log.CreateDate >= cutoffDate));
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
				CreateDate = DateTime.UtcNow,
			},
			new Log
			{
				LogLevel = "Warning",
				Message = "Test warning 1",
				SourceContext = "SeventySix.Services.HealthCheckService",
				RequestPath = "/api/health",
				StatusCode = 200,
				DurationMs = 75,
				CreateDate = DateTime.UtcNow.AddMinutes(-5),
			},
			new Log
			{
				LogLevel = "Error",
				Message = "Test error 2",
				SourceContext = "SeventySix.Services.UserService",
				RequestPath = "/api/users/2",
				StatusCode = 404,
				DurationMs = 50,
				CreateDate = DateTime.UtcNow.AddMinutes(-10),
			},
		];

		foreach (Log? log in logs)
		{
			await Repository.CreateAsync(log);
		}
	}

	private async Task SeedTestLogsForSearchAsync()
	{
		Log[] logs =
		[
			new Log
			{
				LogLevel = "Error",
				Message = "Authentication failed for user",
				SourceContext = "SeventySix.Services.UserService",
				RequestPath = "/api/users/login",
				ExceptionMessage = null,
				CreateDate = DateTime.UtcNow,
			},
			new Log
			{
				LogLevel = "Error",
				Message = "Database connection timeout",
				SourceContext = "SeventySix.Services.UserService",
				RequestPath = "/api/users/profile",
				ExceptionMessage = "NullReferenceException: Object reference not set",
				CreateDate = DateTime.UtcNow.AddMinutes(-5),
			},
			new Log
			{
				LogLevel = "Warning",
				Message = "Rate limit approaching",
				SourceContext = "SeventySix.Services.ApiThrottlingService",
				RequestPath = "/api/health",
				ExceptionMessage = null,
				CreateDate = DateTime.UtcNow.AddMinutes(-10),
			},
		];

		foreach (Log? log in logs)
		{
			await Repository.CreateAsync(log);
		}
	}

	#region Parameter Validation Tests

	[Fact]
	public async Task DeleteByIdAsync_ThrowsArgumentOutOfRangeException_WhenIdIsZeroAsync()
	{
		// Arrange & Act
		Func<Task> act = async () => await Repository.DeleteByIdAsync(0);

		// Assert
		await act.Should().ThrowAsync<ArgumentOutOfRangeException>()
			.WithParameterName("id");
	}

	[Fact]
	public async Task DeleteByIdAsync_ThrowsArgumentOutOfRangeException_WhenIdIsNegativeAsync()
	{
		// Arrange & Act
		Func<Task> act = async () => await Repository.DeleteByIdAsync(-1);

		// Assert
		await act.Should().ThrowAsync<ArgumentOutOfRangeException>()
			.WithParameterName("id");
	}

	[Fact]
	public async Task DeleteBatchAsync_ThrowsArgumentNullException_WhenIdsIsNullAsync()
	{
		// Arrange & Act
		Func<Task> act = async () => await Repository.DeleteBatchAsync(null!);

		// Assert
		await act.Should().ThrowAsync<ArgumentNullException>()
			.WithParameterName("ids");
	}

	[Fact]
	public async Task DeleteBatchAsync_ThrowsArgumentOutOfRangeException_WhenIdsIsEmptyAsync()
	{
		// Arrange & Act
		Func<Task> act = async () => await Repository.DeleteBatchAsync([]);

		// Assert
		await act.Should().ThrowAsync<ArgumentOutOfRangeException>()
			.WithParameterName("ids.Length");
	}

	#endregion
}

