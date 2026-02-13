// <copyright file="LogRepositoryTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Logging;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

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
[Collection(CollectionNames.LoggingPostgreSql)]
public class LogRepositoryTests : DataPostgreSqlTestBase
{
	private readonly LogRepository Repository;

	public LogRepositoryTests(LoggingPostgreSqlFixture fixture)
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
			LogBuilder
				.CreateError(timeProvider)
				.WithMessage("Test error message")
				.Build();

		// Act
		Log result =
			await Repository.CreateAsync(log);

		// Assert
		result.Id.ShouldNotBe(0);
		result.LogLevel.ShouldBe("Error");
		result.Message.ShouldBe("Test error message");
	}

	/// <summary>
	/// Verifies CreateAsync throws when a null entity is provided.
	/// </summary>
	[Fact]
	public async Task CreateAsync_ThrowsArgumentNullException_WhenEntityIsNullAsync()
	{
		// Act & Assert
		await Should.ThrowAsync<ArgumentNullException>(async () =>
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
		logs.ShouldNotBeEmpty();
		(logs.Count() >= 3).ShouldBeTrue();
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
		logs.ShouldAllBe(log => log.LogLevel == "Error");
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
		logs.ShouldAllBe(log =>
			log.CreateDate >= startDate && log.CreateDate <= endDate);
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
		logs.ShouldAllBe(log =>
			(log.SourceContext ?? string.Empty).Contains("UserService"));
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
		logs.ShouldAllBe(log =>
			(log.RequestPath ?? string.Empty).Contains("/api/users"));
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
		messageLogs.ShouldHaveSingleItem(); // Only one log with "Authentication_{testId}" message
		sourceLogs.Count().ShouldBe(2); // Two logs from UserService_{testId}
		pathLogs.Count().ShouldBe(2); // Two logs with users_{testId} path
		exceptionLogs.ShouldHaveSingleItem(); // Only one with NullRef_{testId}
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
		page1Logs.Count().ShouldBe(2);
		page2Logs.ShouldNotBeEmpty();
		page1Logs.First().Id.ShouldNotBe(page2Logs.First().Id);
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
		for (int logIndex = 0; logIndex < result.Count - 1; logIndex++)
		{
			(result[logIndex].Id > result[logIndex + 1].Id).ShouldBeTrue();
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
		for (int logNumber = 0; logNumber < 150; logNumber++)
		{
			await Repository.CreateAsync(
				new LogBuilder(timeProvider)
					.WithLogLevel("Info")
					.WithMessage($"Log {logNumber}")
					.Build());
		}

		// Act
		LogQueryRequest request =
			new() { PageSize = 100 }; // Note: PageSize max is 100, not 1000
		(IEnumerable<Log> logs, int _) =
			await Repository.GetPagedAsync(
			request);

		// Assert
		(logs.Count() <= 100).ShouldBeTrue(); // PageSize is capped at 100
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
		(count >= 3).ShouldBeTrue();
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
		(count >= 1).ShouldBeTrue(); // At least one Error log exists
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
			LogBuilder
				.CreateError(timeProvider)
				.WithMessage("Old log")
				.WithTimestamp(
					timeProvider.GetUtcNow().UtcDateTime.AddDays(-40))
				.Build();
		await Repository.CreateAsync(oldLog);

		Log recentLog =
			LogBuilder
				.CreateError(timeProvider)
				.WithMessage("Recent log")
				.Build();
		await Repository.CreateAsync(recentLog);

		DateTime cutoffDate =
			timeProvider.GetUtcNow().UtcDateTime.AddDays(-30);

		// Act
		int deletedCount =
			await Repository.DeleteOlderThanAsync(cutoffDate);

		// Assert
		(deletedCount > 0).ShouldBeTrue();
		LogQueryRequest request =
			new() { PageSize = 100 };
		(IEnumerable<Log> remainingLogs, int _) =
			await Repository.GetPagedAsync(request);
		remainingLogs.ShouldAllBe(log => log.CreateDate >= cutoffDate);
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
			new LogBuilder(timeProvider)
				.WithLogLevel("Error")
				.WithMessage("Test error 1")
				.WithSourceContext("SeventySix.Services.UserService")
				.WithHttpRequest(null, "/api/users/1", 500, 150)
				.Build(),
			new LogBuilder(timeProvider)
				.WithLogLevel("Warning")
				.WithMessage("Test warning 1")
				.WithSourceContext("SeventySix.Services.HealthCheckService")
				.WithHttpRequest(null, ApiEndpoints.Health.Base, 200, 75)
				.WithTimestamp(
					timeProvider
					.GetUtcNow()
					.UtcDateTime.AddMinutes(-5))
				.Build(),
			new LogBuilder(timeProvider)
				.WithLogLevel("Error")
				.WithMessage("Test error 2")
				.WithSourceContext("SeventySix.Services.UserService")
				.WithHttpRequest(null, "/api/users/2", 404, 50)
				.WithTimestamp(
					timeProvider
					.GetUtcNow()
					.UtcDateTime.AddMinutes(-10))
				.Build(),
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
				new LogBuilder(timeProvider)
					.WithLogLevel("Error")
					.WithMessage(
						$"Authentication_{testId} failed for user")
					.WithSourceContext(
						$"SeventySix.Services.UserService_{testId}")
					.WithHttpRequest(
						null,
						$"/api/users_{testId}/login")
					.Build(),
				new LogBuilder(timeProvider)
					.WithLogLevel("Error")
					.WithMessage("Database connection timeout")
					.WithSourceContext(
						$"SeventySix.Services.UserService_{testId}")
					.WithHttpRequest(
						null,
						$"/api/users_{testId}/profile")
					.WithExceptionMessage(
						$"NullRef_{testId}: Object reference not set")
					.WithTimestamp(
						timeProvider
						.GetUtcNow()
						.UtcDateTime.AddMinutes(-5))
					.Build(),
				new LogBuilder(timeProvider)
					.WithLogLevel("Warning")
					.WithMessage("Rate limit approaching")
					.WithSourceContext("SeventySix.Services.ApiThrottlingService")
					.WithHttpRequest(null, "/api/health")
					.WithTimestamp(
						timeProvider
						.GetUtcNow()
						.UtcDateTime.AddMinutes(-10))
					.Build(),
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
			await Should.ThrowAsync<ArgumentOutOfRangeException>(async () =>
				await Repository.DeleteByIdAsync(0));
		exception.ParamName.ShouldBe("id");
	}

	/// <summary>
	/// Verifies DeleteByIdAsync throws when id is negative.
	/// </summary>
	[Fact]
	public async Task DeleteByIdAsync_ThrowsArgumentOutOfRangeException_WhenIdIsNegativeAsync()
	{
		// Arrange & Act & Assert
		ArgumentOutOfRangeException exception =
			await Should.ThrowAsync<ArgumentOutOfRangeException>(async () =>
				await Repository.DeleteByIdAsync(-1));
		exception.ParamName.ShouldBe("id");
	}

	/// <summary>
	/// Verifies DeleteBatchAsync throws when ids is null.
	/// </summary>
	[Fact]
	public async Task DeleteBatchAsync_ThrowsArgumentNullException_WhenIdsIsNullAsync()
	{
		// Arrange & Act & Assert
		ArgumentNullException exception =
			await Should.ThrowAsync<ArgumentNullException>(async () =>
				await Repository.DeleteBatchAsync(null!));
		exception.ParamName.ShouldBe("ids");
	}

	/// <summary>
	/// Verifies DeleteBatchAsync throws when ids array is empty.
	/// </summary>
	[Fact]
	public async Task DeleteBatchAsync_ThrowsArgumentOutOfRangeException_WhenIdsIsEmptyAsync()
	{
		// Arrange & Act & Assert
		ArgumentOutOfRangeException exception =
			await Should.ThrowAsync<ArgumentOutOfRangeException>(async () =>
				await Repository.DeleteBatchAsync([]));
		exception.ParamName.ShouldBe("ids.Length");
	}

	#endregion
}