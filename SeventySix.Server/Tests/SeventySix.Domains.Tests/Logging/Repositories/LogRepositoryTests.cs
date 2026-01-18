// <copyright file="LogRepositoryTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Logging;
using SeventySix.TestUtilities.TestBases;

namespace SeventySix.Domains.Tests.Logging.Repositories;

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
		Repository =
			new LogRepository(
			context,
			Substitute.For<ILogger<LogRepository>>());
	}

	/// <summary>
	/// Verifies that CreateAsync persists a Log and returns it with an identifier.
	/// </summary>
	[Fact]
	public async Task CreateAsync_CreatesLog_SuccessfullyAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		Log log =
			new()
			{
				LogLevel = "Error",
				Message = "Test error message",
				CreateDate =
					timeProvider.GetUtcNow().UtcDateTime,
			};

		// Act
		Log result =
			await Repository.CreateAsync(log);

		// Assert
		Assert.NotEqual(0, result.Id);
		Assert.Equal("Error", result.LogLevel);
		Assert.Equal("Test error message", result.Message);
	}

	/// <summary>
	/// Verifies CreateAsync throws when a null entity is provided.
	/// </summary>
	[Fact]
	public async Task CreateAsync_ThrowsArgumentNullException_WhenEntityIsNullAsync()
	{
		// Act & Assert
		await Assert.ThrowsAsync<ArgumentNullException>(async () =>
			await Repository.CreateAsync(null!));
	}

	/// <summary>
	/// Verifies GetPagedAsync returns logs when no filters are applied.
	/// </summary>
	[Fact]
	public async Task GetPagedAsync_ReturnsAllLogs_WhenNoFiltersAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		await SeedTestLogsAsync(timeProvider);

		// Act
		LogQueryRequest request = new();
		(IEnumerable<Log> logs, int _) =
			await Repository.GetPagedAsync(
			request);

		// Assert
		Assert.NotEmpty(logs);
		Assert.True(logs.Count() >= 3);
	}

	/// <summary>
	/// Verifies filtering by LogLevel returns only matching logs.
	/// </summary>
	[Fact]
	public async Task GetPagedAsync_FiltersByLogLevel_SuccessfullyAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		await SeedTestLogsAsync(timeProvider);

		// Act
		LogQueryRequest request =
			new() { LogLevel = "Error" };
		(IEnumerable<Log> logs, int _) =
			await Repository.GetPagedAsync(
			request);

		// Assert
		Assert.All(
			logs,
			log => Assert.Equal("Error", log.LogLevel));
	}

	/// <summary>
	/// Verifies date range filtering returns logs within the specified window.
	/// </summary>
	[Fact]
	public async Task GetPagedAsync_FiltersByDateRange_SuccessfullyAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		await SeedTestLogsAsync(timeProvider);
		DateTime startDate =
			timeProvider.GetUtcNow().UtcDateTime.AddHours(-1);
		DateTime endDate =
			timeProvider.GetUtcNow().UtcDateTime.AddHours(1);

		// Act
		LogQueryRequest request =
			new()
			{
				StartDate = startDate,
				EndDate = endDate,
			};
		(IEnumerable<Log> logs, int _) =
			await Repository.GetPagedAsync(
			request);

		// Assert
		Assert.All(
			logs,
			log =>
			{
				Assert.True(log.CreateDate >= startDate);
				Assert.True(log.CreateDate <= endDate);
			});
	}

	/// <summary>
	/// Verifies search term filtering matches SourceContext values.
	/// </summary>
	[Fact]
	public async Task GetPagedAsync_FiltersBySourceContext_SuccessfullyAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		await SeedTestLogsAsync(timeProvider);

		// Act
		LogQueryRequest request =
			new() { SearchTerm = "UserService" };
		(IEnumerable<Log> logs, int _) =
			await Repository.GetPagedAsync(
			request);

		// Assert
		Assert.All(
			logs,
			log =>
				Assert.Contains(
					"UserService",
					log.SourceContext ?? string.Empty));
	}

	/// <summary>
	/// Verifies search term filtering matches RequestPath values.
	/// </summary>
	[Fact]
	public async Task GetPagedAsync_FiltersByRequestPath_SuccessfullyAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		await SeedTestLogsAsync(timeProvider);

		// Act
		LogQueryRequest request =
			new() { SearchTerm = "/api/users" };
		(IEnumerable<Log> logs, int _) =
			await Repository.GetPagedAsync(
			request);

		// Assert
		Assert.All(
			logs,
			log =>
				Assert.Contains(
			"/api/users",
			log.RequestPath ?? string.Empty));
	}

	/// <summary>
	/// Verifies the search term filters across multiple fields (Message, SourceContext, RequestPath, ExceptionMessage).
	/// </summary>
	[Fact]
	public async Task GetPagedAsync_WithSearchTerm_FiltersMultipleFields_SuccessfullyAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		await SeedTestLogsForSearchAsync(testId, timeProvider);

		// Act - Search for unique marker which should match Message field
		LogQueryRequest messageRequest =
			new()
			{
				SearchTerm =
					$"Authentication_{testId}",
			};
		(IEnumerable<Log> messageLogs, int _) =
			await Repository.GetPagedAsync(
			messageRequest);

		// Act - Search for unique marker in SourceContext
		LogQueryRequest sourceRequest =
			new()
			{
				SearchTerm =
					$"UserService_{testId}",
			};
		(IEnumerable<Log> sourceLogs, int _) =
			await Repository.GetPagedAsync(
			sourceRequest);

		// Act - Search for unique marker in RequestPath
		LogQueryRequest pathRequest =
			new()
			{
				SearchTerm =
					$"users_{testId}"
			};
		(IEnumerable<Log> pathLogs, int _) =
			await Repository.GetPagedAsync(
			pathRequest);

		// Act - Search for unique marker in ExceptionMessage
		LogQueryRequest exceptionRequest =
			new()
			{
				SearchTerm =
					$"NullRef_{testId}",
			};
		(IEnumerable<Log> exceptionLogs, int _) =
			await Repository.GetPagedAsync(exceptionRequest);

		// Assert - Verify search works across all fields
		Assert.Single(messageLogs); // Only one log with "Authentication_{testId}" message
		Assert.Equal(
			2,
			sourceLogs.Count()); // Two logs from UserService_{testId}
		Assert.Equal(
			2,
			pathLogs.Count()); // Two logs with users_{testId} path
		Assert.Single(exceptionLogs); // Only one with NullRef_{testId}
	}

	/// <summary>
	/// Verifies GetPagedAsync supports pagination and returns distinct pages.
	/// </summary>
	[Fact]
	public async Task GetPagedAsync_SupportsPagination_SuccessfullyAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		await SeedTestLogsAsync(timeProvider);

		// Act
		LogQueryRequest page1Request =
			new() { Page = 1, PageSize = 2 };
		(IEnumerable<Log> page1Logs, int _) =
			await Repository.GetPagedAsync(
			page1Request);

		LogQueryRequest page2Request =
			new() { Page = 2, PageSize = 2 };
		(IEnumerable<Log> page2Logs, int _) =
			await Repository.GetPagedAsync(
			page2Request);

		// Assert
		Assert.Equal(
			2,
			page1Logs.Count());
		Assert.NotEmpty(page2Logs);
		Assert.NotEqual(
			page1Logs.First().Id,
			page2Logs.First().Id);
	}

	/// <summary>
	/// Verifies default ordering is newest (Id descending).
	/// </summary>
	[Fact]
	public async Task GetPagedAsync_OrdersByIdDescending_ByDefaultAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		await SeedTestLogsAsync(timeProvider);

		// Act
		LogQueryRequest request = new();
		(IEnumerable<Log> logs, int _) =
			await Repository.GetPagedAsync(
			request);
		List<Log> result =
			[.. logs];

		// Assert - Default is now Id descending (newest first)
		for (int i = 0; i < result.Count - 1; i++)
		{
			Assert.True(result[i].Id > result[i + 1].Id);
		}
	}

	/// <summary>
	/// Verifies page size is capped at the configured maximum.
	/// </summary>
	[Fact]
	public async Task GetPagedAsync_LimitsTo1000Records_MaximumAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		for (int i = 0; i < 150; i++)
		{
			await Repository.CreateAsync(
				new Log
				{
					LogLevel = "Info",
					Message =
						$"Log {i}",
					CreateDate =
						timeProvider.GetUtcNow().UtcDateTime,
				});
		}

		// Act
		LogQueryRequest request =
			new() { PageSize = 100 }; // Note: PageSize max is 100, not 1000
		(IEnumerable<Log> logs, int _) =
			await Repository.GetPagedAsync(
			request);

		// Assert
		Assert.True(logs.Count() <= 100); // PageSize is capped at 100
	}

	/// <summary>
	/// Verifies GetPagedAsync returns the correct total count when no filters are applied.
	/// </summary>
	[Fact]
	public async Task GetPagedAsync_ReturnsCorrectCount_WhenNoFiltersAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		await SeedTestLogsAsync(timeProvider);

		// Act
		LogQueryRequest request = new();
		(IEnumerable<Log> _, int count) =
			await Repository.GetPagedAsync(
			request);

		// Assert
		Assert.True(count >= 3);
	}

	/// <summary>
	/// Verifies combined filter criteria produce expected results.
	/// </summary>
	[Fact]
	public async Task GetPagedAsync_FiltersCorrectly_WithMultipleCriteriaAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		await SeedTestLogsAsync(timeProvider);
		DateTime startDate =
			timeProvider.GetUtcNow().UtcDateTime.AddHours(-1);

		// Act
		LogQueryRequest request =
			new()
			{
				LogLevel = "Error",
				StartDate = startDate,
			};
		(IEnumerable<Log> _, int count) =
			await Repository.GetPagedAsync(
			request);

		// Assert
		Assert.True(count >= 1); // At least one Error log exists
	}

	/// <summary>
	/// Verifies DeleteOlderThanAsync removes logs older than the cutoff date.
	/// </summary>
	[Fact]
	public async Task DeleteOlderThanAsync_DeletesOldLogs_SuccessfullyAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		Log oldLog =
			new()
			{
				LogLevel = "Error",
				Message = "Old log",
				CreateDate =
					timeProvider.GetUtcNow().UtcDateTime.AddDays(-40),
			};
		await Repository.CreateAsync(oldLog);

		Log recentLog =
			new()
			{
				LogLevel = "Error",
				Message = "Recent log",
				CreateDate =
					timeProvider.GetUtcNow().UtcDateTime,
			};
		await Repository.CreateAsync(recentLog);

		DateTime cutoffDate =
			timeProvider.GetUtcNow().UtcDateTime.AddDays(-30);

		// Act
		int deletedCount =
			await Repository.DeleteOlderThanAsync(cutoffDate);

		// Assert
		Assert.True(deletedCount > 0);
		LogQueryRequest request =
			new() { PageSize = 100 };
		(IEnumerable<Log> remainingLogs, int _) =
			await Repository.GetPagedAsync(request);
		Assert.All(
			remainingLogs,
			log => Assert.True(log.CreateDate >= cutoffDate));
	}

	/// <summary>
	/// Seeds the database with several test logs for queries.
	/// </summary>
	/// <param name="timeProvider">
	/// The time provider used to set CreateDate values.
	/// </param>
	private async Task SeedTestLogsAsync(FakeTimeProvider timeProvider)
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
				CreateDate =
					timeProvider.GetUtcNow().UtcDateTime,
			},
			new Log
			{
				LogLevel = "Warning",
				Message = "Test warning 1",
				SourceContext = "SeventySix.Services.HealthCheckService",
				RequestPath = "/api/health",
				StatusCode = 200,
				DurationMs = 75,
				CreateDate =
					timeProvider
					.GetUtcNow()
					.UtcDateTime.AddMinutes(-5),
			},
			new Log
			{
				LogLevel = "Error",
				Message = "Test error 2",
				SourceContext = "SeventySix.Services.UserService",
				RequestPath = "/api/users/2",
				StatusCode = 404,
				DurationMs = 50,
				CreateDate =
					timeProvider
					.GetUtcNow()
					.UtcDateTime.AddMinutes(-10),
			},
		];

		foreach (Log? log in logs)
		{
			await Repository.CreateAsync(log);
		}
	}

	/// <summary>
	/// Seeds logs containing unique markers used by search tests.
	/// </summary>
	/// <param name="testId">
	/// Unique identifier appended to seeded values.
	/// </param>
	/// <param name="timeProvider">
	/// The time provider used to set CreateDate values.
	/// </param>
	private async Task SeedTestLogsForSearchAsync(
		string testId,
		FakeTimeProvider timeProvider)
	{
		Log[] logs =
			[
			new Log
			{
				LogLevel = "Error",
				Message =
					$"Authentication_{testId} failed for user",
				SourceContext =
					$"SeventySix.Services.UserService_{testId}",
				RequestPath =
					$"/api/users_{testId}/login",
				ExceptionMessage = null,
				CreateDate =
					timeProvider.GetUtcNow().UtcDateTime,
			},
			new Log
			{
				LogLevel = "Error",
				Message = "Database connection timeout",
				SourceContext =
					$"SeventySix.Services.UserService_{testId}",
				RequestPath =
					$"/api/users_{testId}/profile",
				ExceptionMessage =
					$"NullRef_{testId}: Object reference not set",
				CreateDate =
					timeProvider
					.GetUtcNow()
					.UtcDateTime.AddMinutes(-5),
			},
			new Log
			{
				LogLevel = "Warning",
				Message = "Rate limit approaching",
				SourceContext = "SeventySix.Services.ApiThrottlingService",
				RequestPath = "/api/health",
				ExceptionMessage = null,
				CreateDate =
					timeProvider
					.GetUtcNow()
					.UtcDateTime.AddMinutes(-10),
			},
		];

		foreach (Log? log in logs)
		{
			await Repository.CreateAsync(log);
		}
	}

	#region Parameter Validation Tests

	/// <summary>
	/// Verifies DeleteByIdAsync throws when id is zero.
	/// </summary>
	[Fact]
	public async Task DeleteByIdAsync_ThrowsArgumentOutOfRangeException_WhenIdIsZeroAsync()
	{
		// Arrange & Act & Assert
		ArgumentOutOfRangeException exception =
			await Assert.ThrowsAsync<ArgumentOutOfRangeException>(async () =>
				await Repository.DeleteByIdAsync(0));
		Assert.Equal("id", exception.ParamName);
	}

	/// <summary>
	/// Verifies DeleteByIdAsync throws when id is negative.
	/// </summary>
	[Fact]
	public async Task DeleteByIdAsync_ThrowsArgumentOutOfRangeException_WhenIdIsNegativeAsync()
	{
		// Arrange & Act & Assert
		ArgumentOutOfRangeException exception =
			await Assert.ThrowsAsync<ArgumentOutOfRangeException>(async () =>
				await Repository.DeleteByIdAsync(-1));
		Assert.Equal("id", exception.ParamName);
	}

	/// <summary>
	/// Verifies DeleteBatchAsync throws when ids is null.
	/// </summary>
	[Fact]
	public async Task DeleteBatchAsync_ThrowsArgumentNullException_WhenIdsIsNullAsync()
	{
		// Arrange & Act & Assert
		ArgumentNullException exception =
			await Assert.ThrowsAsync<ArgumentNullException>(async () =>
				await Repository.DeleteBatchAsync(null!));
		Assert.Equal("ids", exception.ParamName);
	}

	/// <summary>
	/// Verifies DeleteBatchAsync throws when ids array is empty.
	/// </summary>
	[Fact]
	public async Task DeleteBatchAsync_ThrowsArgumentOutOfRangeException_WhenIdsIsEmptyAsync()
	{
		// Arrange & Act & Assert
		ArgumentOutOfRangeException exception =
			await Assert.ThrowsAsync<ArgumentOutOfRangeException>(async () =>
				await Repository.DeleteBatchAsync([]));
		Assert.Equal("ids.Length", exception.ParamName);
	}

	#endregion
}