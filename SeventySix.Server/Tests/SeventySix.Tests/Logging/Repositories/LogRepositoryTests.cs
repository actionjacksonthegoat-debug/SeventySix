// <copyright file="LogRepositoryTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;
using NSubstitute;
using SeventySix.Logging;
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
[Collection("DatabaseTests")]
public class LogRepositoryTests : DataPostgreSqlTestBase
{
	private readonly LogRepository Repository;

	public LogRepositoryTests(TestcontainersPostgreSqlFixture fixture)
		: base(fixture)
	{
		LoggingDbContext context = CreateLoggingDbContext();
		Repository = new LogRepository(
			context,
			Substitute.For<ILogger<LogRepository>>());
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
		LogQueryRequest request = new();
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
		LogQueryRequest request = new() { LogLevel = "Error" };
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
		LogQueryRequest request = new() { StartDate = startDate, EndDate = endDate };
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
		LogQueryRequest request = new() { SearchTerm = "UserService" };
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
		LogQueryRequest request = new() { SearchTerm = "/api/users" };
		(IEnumerable<Log> logs, int _) = await Repository.GetPagedAsync(request);

		// Assert
		Assert.All(logs, log => Assert.Contains("/api/users", log.RequestPath ?? string.Empty));
	}

	[Fact]
	public async Task GetPagedAsync_WithSearchTerm_FiltersMultipleFields_SuccessfullyAsync()
	{
		// Arrange
		string testId = Guid.NewGuid().ToString("N")[..8];
		await SeedTestLogsForSearchAsync(testId);

		// Act - Search for unique marker which should match Message field
		LogQueryRequest messageRequest = new() { SearchTerm = $"Authentication_{testId}" };
		(IEnumerable<Log> messageLogs, int _) = await Repository.GetPagedAsync(messageRequest);

		// Act - Search for unique marker in SourceContext
		LogQueryRequest sourceRequest = new() { SearchTerm = $"UserService_{testId}" };
		(IEnumerable<Log> sourceLogs, int _) = await Repository.GetPagedAsync(sourceRequest);

		// Act - Search for unique marker in RequestPath
		LogQueryRequest pathRequest = new() { SearchTerm = $"users_{testId}" };
		(IEnumerable<Log> pathLogs, int _) = await Repository.GetPagedAsync(pathRequest);

		// Act - Search for unique marker in ExceptionMessage
		LogQueryRequest exceptionRequest = new() { SearchTerm = $"NullRef_{testId}" };
		(IEnumerable<Log> exceptionLogs, int _) = await Repository.GetPagedAsync(exceptionRequest);

		// Assert - Verify search works across all fields
		Assert.Single(messageLogs); // Only one log with "Authentication_{testId}" message
		Assert.Equal(2, sourceLogs.Count()); // Two logs from UserService_{testId}
		Assert.Equal(2, pathLogs.Count()); // Two logs with users_{testId} path
		Assert.Single(exceptionLogs); // Only one with NullRef_{testId}
	}

	[Fact]
	public async Task GetPagedAsync_SupportsPagination_SuccessfullyAsync()
	{
		// Arrange
		await SeedTestLogsAsync();

		// Act
		LogQueryRequest page1Request = new() { Page = 1, PageSize = 2 };
		(IEnumerable<Log> page1Logs, int _) = await Repository.GetPagedAsync(page1Request);

		LogQueryRequest page2Request = new() { Page = 2, PageSize = 2 };
		(IEnumerable<Log> page2Logs, int _) = await Repository.GetPagedAsync(page2Request);

		// Assert
		Assert.Equal(2, page1Logs.Count());
		Assert.NotEmpty(page2Logs);
		Assert.NotEqual(page1Logs.First().Id, page2Logs.First().Id);
	}

	[Fact]
	public async Task GetPagedAsync_OrdersByIdDescending_ByDefaultAsync()
	{
		// Arrange
		await SeedTestLogsAsync();

		// Act
		LogQueryRequest request = new();
		(IEnumerable<Log> logs, int _) = await Repository.GetPagedAsync(request);
		List<Log> result = [.. logs];

		// Assert - Default is now Id descending (newest first)
		for (int i = 0; i < result.Count - 1; i++)
		{
			Assert.True(result[i].Id > result[i + 1].Id);
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
		LogQueryRequest request = new() { PageSize = 100 }; // Note: PageSize max is 100, not 1000
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
		LogQueryRequest request = new();
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
		LogQueryRequest request = new()
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
		LogQueryRequest request = new() { PageSize = 100 };
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

	private async Task SeedTestLogsForSearchAsync(string testId)
	{
		Log[] logs =
		[
			new Log
			{
				LogLevel = "Error",
				Message = $"Authentication_{testId} failed for user",
				SourceContext = $"SeventySix.Services.UserService_{testId}",
				RequestPath = $"/api/users_{testId}/login",
				ExceptionMessage = null,
				CreateDate = DateTime.UtcNow,
			},
			new Log
			{
				LogLevel = "Error",
				Message = "Database connection timeout",
				SourceContext = $"SeventySix.Services.UserService_{testId}",
				RequestPath = $"/api/users_{testId}/profile",
				ExceptionMessage = $"NullRef_{testId}: Object reference not set",
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
		// Arrange & Act & Assert
		ArgumentOutOfRangeException exception = await Assert.ThrowsAsync<ArgumentOutOfRangeException>(
			async () => await Repository.DeleteByIdAsync(0));
		Assert.Equal("id", exception.ParamName);
	}

	[Fact]
	public async Task DeleteByIdAsync_ThrowsArgumentOutOfRangeException_WhenIdIsNegativeAsync()
	{
		// Arrange & Act & Assert
		ArgumentOutOfRangeException exception = await Assert.ThrowsAsync<ArgumentOutOfRangeException>(
			async () => await Repository.DeleteByIdAsync(-1));
		Assert.Equal("id", exception.ParamName);
	}

	[Fact]
	public async Task DeleteBatchAsync_ThrowsArgumentNullException_WhenIdsIsNullAsync()
	{
		// Arrange & Act & Assert
		ArgumentNullException exception = await Assert.ThrowsAsync<ArgumentNullException>(
			async () => await Repository.DeleteBatchAsync(null!));
		Assert.Equal("ids", exception.ParamName);
	}

	[Fact]
	public async Task DeleteBatchAsync_ThrowsArgumentOutOfRangeException_WhenIdsIsEmptyAsync()
	{
		// Arrange & Act & Assert
		ArgumentOutOfRangeException exception = await Assert.ThrowsAsync<ArgumentOutOfRangeException>(
			async () => await Repository.DeleteBatchAsync([]));
		Assert.Equal("ids.Length", exception.ParamName);
	}

	#endregion
}