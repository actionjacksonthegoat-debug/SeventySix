// <copyright file="LogsControllerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.Logging;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.TestBases;
using Xunit;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Integration tests for LogsController.
/// </summary>
/// <remarks>
/// Tests the HTTP API endpoints for retrieving and managing log data.
/// Uses WebApplicationFactory to create a test server with real database.
///
/// Test Coverage:
/// - GET /api/logs with various filters
/// - GET /api/logs/statistics for aggregated data
/// - DELETE /api/logs/cleanup for maintenance
/// - Pagination validation (max 100 records)
/// - Filter combinations
///
/// SOLID Principles:
/// - SRP: Each test validates one specific behavior
/// - OCP: Test fixtures extensible for new scenarios
/// </remarks>
[Collection("PostgreSQL")]
public class LogsControllerTests(TestcontainersPostgreSqlFixture fixture) : ApiPostgreSqlTestBase<Program>(fixture), IAsyncLifetime
{
	private WebApplicationFactory<Program>? Factory;
	private HttpClient? Client;
	private ILogRepository? LogRepository;

	/// <inheritdoc/>
	public override async Task InitializeAsync()
	{
		// DO NOT call base.InitializeAsync() to avoid truncating logs
		// These tests expect logs from API requests to accumulate
		// Only truncate non-logging tables for isolation
		await TruncateTablesAsync(
			"\"ApiTracking\".\"ThirdPartyApiRequests\"",
			"\"Identity\".\"Users\"");

		// Create factory and client
		Factory = CreateWebApplicationFactory();
		Client = Factory.CreateClient();

		// Get repository to seed test data
		using IServiceScope scope = Factory!.Services.CreateScope();
		LogRepository = scope.ServiceProvider.GetRequiredService<ILogRepository>();

		// Seed test data using LogBuilder
		Log[] testLogs =
		[
			LogBuilder.CreateWarning()
				.WithMessage("Test warning message")
				.WithSourceContext("SeventySix.Api.Controllers.UsersController")
				.WithHttpRequest("GET", "/api/users", 200, 150)
				.WithTimestamp(DateTime.UtcNow.AddHours(-1))
				.Build(),
			LogBuilder.CreateError()
				.WithMessage("Test error message")
				.WithExceptionMessage("Exception occurred")
				.WithBaseExceptionMessage("Base exception")
				.WithStackTrace("at SeventySix.Api.Controllers.UsersController.GetUser()")
				.WithSourceContext("SeventySix.Api.Controllers.UsersController")
				.WithHttpRequest("POST", "/api/users", 500, 250)
				.WithTimestamp(DateTime.UtcNow.AddHours(-2))
				.Build(),
			LogBuilder.CreateFatal()
				.WithMessage("Test fatal message")
				.WithExceptionMessage("Fatal exception")
				.WithStackTrace("at SeventySix.Api.Program.Main()")
				.WithSourceContext("SeventySix.Api.Program")
				.WithHttpRequest("GET", "/api/test", 500, 500)
				.WithTimestamp(DateTime.UtcNow.AddHours(-3))
				.Build(),
			LogBuilder.CreateWarning()
				.WithMessage("Old warning message")
				.WithSourceContext("SeventySix.Api.Controllers.TestController")
				.WithHttpRequest("GET", "/api/test", 200, 100)
				.WithTimestamp(DateTime.UtcNow.AddDays(-31)) // Older than 30 days
				.Build(),
		];

		foreach (Log? log in testLogs)
		{
			await LogRepository.CreateAsync(log);
		}
	}

	/// <inheritdoc/>
	public new Task DisposeAsync()
	{
		Client?.Dispose();
		Factory?.Dispose();
		return Task.CompletedTask;
	}

	/// <summary>
	/// Tests that GET /api/logs returns all logs when no filters are applied.
	/// </summary>
	[Fact]
	public async Task GetPagedAsync_NoFilters_ReturnsAllLogsAsync()
	{
		// Act
		HttpResponseMessage response = await Client!.GetAsync("/api/v1/logs");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		PagedLogResponse? pagedResponse = await response.Content.ReadFromJsonAsync<PagedLogResponse>();
		Assert.NotNull(pagedResponse);
		Assert.NotNull(pagedResponse.Data);
		Assert.True(pagedResponse.Data.Count >= 4, "Should return at least the 4 seeded logs");
	}

	/// <summary>
	/// Tests that GET /api/logs filters by log level correctly.
	/// </summary>
	[Fact]
	public async Task GetPagedAsync_FilterByLogLevel_ReturnsMatchingLogsAsync()
	{
		// Act
		HttpResponseMessage response = await Client!.GetAsync("/api/v1/logs?logLevel=Error");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		PagedLogResponse? pagedResponse = await response.Content.ReadFromJsonAsync<PagedLogResponse>();
		Assert.NotNull(pagedResponse);
		Assert.NotNull(pagedResponse.Data);
		Assert.All(pagedResponse.Data, log => Assert.Equal("Error", log.LogLevel));
	}

	/// <summary>
	/// Tests that GET /api/logs filters by date range correctly.
	/// </summary>
	[Fact]
	public async Task GetPagedAsync_FilterByDateRange_ReturnsLogsInRangeAsync()
	{
		// Arrange
		DateTime startDate = DateTime.UtcNow.AddHours(-4);
		DateTime endDate = DateTime.UtcNow;

		// Act
		HttpResponseMessage response = await Client!.GetAsync(
			$"/api/v1/logs?startDate={startDate:O}&endDate={endDate:O}");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		PagedLogResponse? pagedResponse = await response.Content.ReadFromJsonAsync<PagedLogResponse>();
		Assert.NotNull(pagedResponse);
		Assert.NotNull(pagedResponse.Data);
		Assert.All(pagedResponse.Data, log =>
		{
			Assert.True(log.CreateDate >= startDate);
			Assert.True(log.CreateDate <= endDate);
		});
	}

	/// <summary>
	/// Tests that GET /api/logs filters by source context correctly via searchTerm.
	/// </summary>
	[Fact]
	public async Task GetPagedAsync_FilterBySourceContext_ReturnsMatchingLogsAsync()
	{
		// Arrange - Use time range to get seeded test data only
		DateTime startDate = DateTime.UtcNow.AddHours(-4);
		DateTime endDate = DateTime.UtcNow;

		// Act - Use searchTerm for SourceContext filtering
		HttpResponseMessage response = await Client!.GetAsync(
			$"/api/v1/logs?searchTerm=UsersController&startDate={startDate:O}&endDate={endDate:O}");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		PagedLogResponse? pagedResponse = await response.Content.ReadFromJsonAsync<PagedLogResponse>();
		Assert.NotNull(pagedResponse);
		Assert.NotNull(pagedResponse.Data);
		Assert.True(pagedResponse.Data.Count >= 2, "Should find at least 2 logs with UsersController in SourceContext");
		Assert.All(pagedResponse.Data, log =>
			Assert.Contains("UsersController", log.SourceContext ?? string.Empty));
	}

	/// <summary>
	/// Tests that GET /api/logs filters by request path correctly via searchTerm.
	/// </summary>
	[Fact]
	public async Task GetPagedAsync_FilterByRequestPath_ReturnsMatchingLogsAsync()
	{
		// Arrange - Use time range to get seeded test data only
		DateTime startDate = DateTime.UtcNow.AddHours(-4);
		DateTime endDate = DateTime.UtcNow;

		// Act - Use searchTerm for RequestPath filtering
		HttpResponseMessage response = await Client!.GetAsync(
			$"/api/v1/logs?searchTerm=/api/users&startDate={startDate:O}&endDate={endDate:O}");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		PagedLogResponse? pagedResponse = await response.Content.ReadFromJsonAsync<PagedLogResponse>();
		Assert.NotNull(pagedResponse);
		Assert.NotNull(pagedResponse.Data);
		Assert.True(pagedResponse.Data.Count >= 2, "Should find at least 2 logs with /api/users in RequestPath");
		Assert.All(pagedResponse.Data, log => Assert.Contains("/api/users", log.RequestPath ?? string.Empty));
	}

	/// <summary>
	/// Tests that GET /api/logs respects pagination with default page size.
	/// </summary>
	[Fact]
	public async Task GetPagedAsync_WithPagination_ReturnsCorrectPageAsync()
	{
		// Act - Get page 1
		HttpResponseMessage response1 = await Client!.GetAsync("/api/v1/logs?page=1&pageSize=2");
		PagedLogResponse? pagedResponse1 = await response1.Content.ReadFromJsonAsync<PagedLogResponse>();

		// Act - Get page 2
		HttpResponseMessage response2 = await Client!.GetAsync("/api/v1/logs?page=2&pageSize=2");
		PagedLogResponse? pagedResponse2 = await response2.Content.ReadFromJsonAsync<PagedLogResponse>();

		// Assert
		Assert.Equal(HttpStatusCode.OK, response1.StatusCode);
		Assert.Equal(HttpStatusCode.OK, response2.StatusCode);
		Assert.NotNull(pagedResponse1);
		Assert.NotNull(pagedResponse1.Data);
		Assert.NotNull(pagedResponse2);
		Assert.NotNull(pagedResponse2.Data);
		Assert.True(pagedResponse1.Data.Count <= 2);
		Assert.True(pagedResponse2.Data.Count <= 2);

		// Verify no duplicates between pages
		HashSet<int> ids1 = [.. pagedResponse1.Data.Select(l => l.Id)];
		HashSet<int> ids2 = [.. pagedResponse2.Data.Select(l => l.Id)];
		Assert.Empty(ids1.Intersect(ids2));
	}

	/// <summary>
	/// Tests that GET /api/logs validates maximum page size of 100.
	/// </summary>
	[Fact]
	public async Task GetPagedAsync_ExceedsMaxPageSize_ReturnsMaxRecordsAsync()
	{
		// Act
		HttpResponseMessage response = await Client!.GetAsync("/api/v1/logs?pageSize=200");

		// Assert - Validator now rejects invalid PageSize
		Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
	}

	/// <summary>
	/// Tests that GET /api/logs combines multiple filters correctly.
	/// </summary>
	[Fact]
	public async Task GetPagedAsync_MultipleFilters_ReturnsMatchingLogsAsync()
	{
		// Arrange
		DateTime startDate = DateTime.UtcNow.AddHours(-4);
		DateTime endDate = DateTime.UtcNow;

		// Act - Use searchTerm for RequestPath filtering
		HttpResponseMessage response = await Client!.GetAsync(
			$"/api/v1/logs?logLevel=Warning&startDate={startDate:O}&endDate={endDate:O}&searchTerm=/api/users");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		PagedLogResponse? pagedResponse = await response.Content.ReadFromJsonAsync<PagedLogResponse>();
		Assert.NotNull(pagedResponse);
		Assert.NotNull(pagedResponse.Data);
		Assert.True(pagedResponse.Data.Count >= 1, "Should find at least 1 Warning log with /api/users");
		Assert.All(pagedResponse.Data, log =>
		{
			Assert.Equal("Warning", log.LogLevel);
			Assert.True(log.CreateDate >= startDate);
			Assert.True(log.CreateDate <= endDate);
			Assert.Contains("/api/users", log.RequestPath ?? string.Empty);
		});
	}

	/// <summary>
	/// Tests that DELETE /api/logs/cleanup removes old logs.
	/// </summary>
	[Fact]
	public async Task CleanupLogsAsync_WithCutoffDate_DeletesOldLogsAsync()
	{
		// Arrange
		DateTime cutoffDate = DateTime.UtcNow.AddDays(-30);

		// Act
		HttpResponseMessage response = await Client!.DeleteAsync(
			$"/api/v1/logs/cleanup?cutoffDate={cutoffDate:O}");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		int deletedCount = await response.Content.ReadFromJsonAsync<int>();
		Assert.True(deletedCount >= 1, "Should delete at least the 31-day-old log");
	}

	/// <summary>
	/// Tests that DELETE /api/logs/cleanup requires cutoff date parameter.
	/// </summary>
	[Fact]
	public async Task CleanupLogsAsync_NoCutoffDate_ReturnsBadRequestAsync()
	{
		// Act
		HttpResponseMessage response = await Client!.DeleteAsync("/api/v1/logs/cleanup");

		// Assert
		Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
	}

	/// <summary>
	/// Tests that POST /api/logs/client creates a client-side error log.
	/// </summary>
	[Fact]
	public async Task LogClientErrorAsync_WithValidRequest_ReturnsNoContentAsync()
	{
		// Arrange
		ClientLogRequest request = new()
		{
			LogLevel = "Error",
			Message = "Client-side error occurred",
			ExceptionMessage = "TypeError: Cannot read property 'id' of undefined",
			StackTrace = "at UserComponent.saveUser (user.component.ts:45:12)",
			SourceContext = "UserComponent",
			RequestUrl = "/admin/users/123",
			RequestMethod = "POST",
			StatusCode = 500,
			UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
			ClientTimestamp = DateTime.UtcNow.ToString("O"),
			AdditionalContext = new Dictionary<string, object>
			{
				{ "userId", 123 },
				{ "action", "save" },
			},
		};

		// Act
		HttpResponseMessage response = await Client!.PostAsJsonAsync("/api/v1/logs/client", request);

		// Assert
		Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

		// Verify log was created
		using IServiceScope scope = Factory!.Services.CreateScope();
		ILogRepository logRepo = scope.ServiceProvider.GetRequiredService<ILogRepository>();
		LogFilterRequest filterRequest = new()
		{
			LogLevel = "Error",
			SearchTerm = "UserComponent",
			Page = 1,
			PageSize = 10,
		};
		(IEnumerable<Log> logs, int _) = await logRepo.GetPagedAsync(filterRequest);
		Log? clientLog = logs.FirstOrDefault(l => l.Message == "Client-side error occurred");

		Assert.NotNull(clientLog);
		Assert.Equal("Error", clientLog.LogLevel);
		Assert.Equal("Client-side error occurred", clientLog.Message);
		Assert.Equal("TypeError: Cannot read property 'id' of undefined", clientLog.ExceptionMessage);
		Assert.Contains("UserComponent.saveUser", clientLog.StackTrace);
		Assert.Equal("UserComponent", clientLog.SourceContext);
		Assert.Equal("/admin/users/123", clientLog.RequestPath);
		Assert.Equal("POST", clientLog.RequestMethod);
		Assert.Equal(500, clientLog.StatusCode);
		Assert.Equal("Browser", clientLog.MachineName);
		Assert.Equal("Client", clientLog.Environment);
		Assert.NotNull(clientLog.Properties);
		Assert.Contains("Mozilla/5.0", clientLog.Properties);
	}

	/// <summary>
	/// Tests that POST /api/logs/client validates required fields.
	/// </summary>
	[Fact]
	public async Task LogClientErrorAsync_WithMissingLogLevel_ReturnsBadRequestAsync()
	{
		// Arrange - Create request with missing LogLevel using anonymous object
		var invalidRequest = new
		{
			Message = "Test message",
		};

		// Act
		HttpResponseMessage response = await Client!.PostAsJsonAsync("/api/v1/logs/client", invalidRequest);

		// Assert
		Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
	}

	/// <summary>
	/// Tests that POST /api/logs/client validates required Message field.
	/// </summary>
	[Fact]
	public async Task LogClientErrorAsync_WithMissingMessage_ReturnsBadRequestAsync()
	{
		// Arrange - Create request with missing Message using anonymous object
		var invalidRequest = new
		{
			LogLevel = "Error",
		};

		// Act
		HttpResponseMessage response = await Client!.PostAsJsonAsync("/api/v1/logs/client", invalidRequest);

		// Assert
		Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
	}

	/// <summary>
	/// Tests that POST /api/logs/client accepts minimal required fields.
	/// </summary>
	[Fact]
	public async Task LogClientErrorAsync_WithMinimalRequest_ReturnsNoContentAsync()
	{
		// Arrange
		ClientLogRequest request = new()
		{
			LogLevel = "Warning",
			Message = "Simple client warning",
		};

		// Act
		HttpResponseMessage response = await Client!.PostAsJsonAsync("/api/v1/logs/client", request);

		// Assert
		Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

		// Verify log was created with defaults
		using IServiceScope scope = Factory!.Services.CreateScope();
		ILogRepository logRepo = scope.ServiceProvider.GetRequiredService<ILogRepository>();
		LogFilterRequest filterRequest = new()
		{
			LogLevel = "Warning",
			Page = 1,
			PageSize = 10,
		};
		(IEnumerable<Log> logs, int _) = await logRepo.GetPagedAsync(filterRequest);
		Log? clientLog = logs.FirstOrDefault(l => l.Message == "Simple client warning");

		Assert.NotNull(clientLog);
		Assert.Equal("Warning", clientLog.LogLevel);
		Assert.Equal("Simple client warning", clientLog.Message);
		Assert.Equal("Browser", clientLog.MachineName);
		Assert.Equal("Client", clientLog.Environment);
	}

	/// <summary>
	/// Tests that POST /api/logs/client handles all log levels.
	/// </summary>
	[Theory]
	[InlineData("Error")]
	[InlineData("Warning")]
	[InlineData("Info")]
	[InlineData("Debug")]
	[InlineData("Critical")]
	public async Task LogClientErrorAsync_WithDifferentLogLevels_ReturnsNoContentAsync(string logLevel)
	{
		// Arrange
		ClientLogRequest request = new()
		{
			LogLevel = logLevel,
			Message = $"Test {logLevel} message",
		};

		// Act
		HttpResponseMessage response = await Client!.PostAsJsonAsync("/api/v1/logs/client", request);

		// Assert
		Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
	}

	/// <summary>
	/// Tests that POST /api/logs/client preserves additional context.
	/// </summary>
	[Fact]
	public async Task LogClientErrorAsync_WithAdditionalContext_PreservesContextAsync()
	{
		// Arrange
		ClientLogRequest request = new()
		{
			LogLevel = "Error",
			Message = "Error with context",
			AdditionalContext = new Dictionary<string, object>
			{
				{ "componentState", "loading" },
				{ "retryCount", 3 },
				{ "timestamp", DateTime.UtcNow.ToString("O") },
			},
		};

		// Act
		HttpResponseMessage response = await Client!.PostAsJsonAsync("/api/v1/logs/client", request);

		// Assert
		Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

		// Verify context was preserved in Properties JSON
		using IServiceScope scope = Factory!.Services.CreateScope();
		ILogRepository logRepo = scope.ServiceProvider.GetRequiredService<ILogRepository>();
		LogFilterRequest filterRequest = new()
		{
			SearchTerm = "Error with context", // Search for specific message
			Page = 1,
			PageSize = 10,
			StartDate = null,
		};
		(IEnumerable<Log> logs, int _) = await logRepo.GetPagedAsync(filterRequest);
		Log? clientLog = logs.FirstOrDefault(l => l.Message == "Error with context");

		Assert.NotNull(clientLog);
		Assert.NotNull(clientLog.Properties);
		Assert.Contains("componentState", clientLog.Properties);
		Assert.Contains("retryCount", clientLog.Properties);
	}

	/// <summary>
	/// Tests that POST /api/logs/client/batch creates multiple client-side error logs.
	/// </summary>
	[Fact]
	public async Task LogClientErrorBatchAsync_WithValidRequests_ReturnsNoContentAsync()
	{
		// Arrange
		ClientLogRequest[] requests =
		[
			new ClientLogRequest
			{
				LogLevel = "Error",
				Message = "Batch error 1",
				SourceContext = "Component1",
			},
			new ClientLogRequest
			{
				LogLevel = "Warning",
				Message = "Batch warning 2",
				SourceContext = "Component2",
			},
			new ClientLogRequest
			{
				LogLevel = "Info",
				Message = "Batch info 3",
				SourceContext = "Component3",
			},
		];

		// Act
		HttpResponseMessage response = await Client!.PostAsJsonAsync("/api/v1/logs/client/batch", requests);

		// Assert
		Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

		// Verify all logs were created
		using IServiceScope scope = Factory!.Services.CreateScope();
		ILogRepository logRepo = scope.ServiceProvider.GetRequiredService<ILogRepository>();
		LogFilterRequest request = new() { Page = 1, PageSize = 100 };
		(IEnumerable<Log> logs, int _) = await logRepo.GetPagedAsync(request);

		Log? log1 = logs.FirstOrDefault(l => l.Message == "Batch error 1");
		Log? log2 = logs.FirstOrDefault(l => l.Message == "Batch warning 2");
		Log? log3 = logs.FirstOrDefault(l => l.Message == "Batch info 3");

		Assert.NotNull(log1);
		Assert.NotNull(log2);
		Assert.NotNull(log3);
		Assert.Equal("Error", log1.LogLevel);
		Assert.Equal("Warning", log2.LogLevel);
		Assert.Equal("Info", log3.LogLevel);
		Assert.Equal("Client", log1.Environment);
		Assert.Equal("Client", log2.Environment);
		Assert.Equal("Client", log3.Environment);
	}

	/// <summary>
	/// Tests that POST /api/logs/client/batch handles empty array.
	/// </summary>
	[Fact]
	public async Task LogClientErrorBatchAsync_WithEmptyArray_ReturnsNoContentAsync()
	{
		// Arrange
		ClientLogRequest[] requests = [];

		// Act
		HttpResponseMessage response = await Client!.PostAsJsonAsync("/api/v1/logs/client/batch", requests);

		// Assert
		Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
	}

	/// <summary>
	/// Tests that POST /api/logs/client/batch validates individual requests.
	/// </summary>
	[Fact]
	public async Task LogClientErrorBatchAsync_WithInvalidRequest_ReturnsBadRequestAsync()
	{
		// Arrange - One invalid request in batch (missing required fields)
		object[] requests =
		[
			new { LogLevel = "Error", Message = "Valid error" },
			new { LogLevel = "Warning" }, // Missing Message
		];

		// Act
		HttpResponseMessage response = await Client!.PostAsJsonAsync("/api/v1/logs/client/batch", requests);

		// Assert
		Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
	}

	/// <summary>
	/// Tests that POST /api/logs/client/batch handles large batches.
	/// </summary>
	[Fact]
	public async Task LogClientErrorBatchAsync_WithLargeBatch_ReturnsNoContentAsync()
	{
		// Arrange - Create 50 log requests
		ClientLogRequest[] requests = [.. Enumerable.Range(1, 50)
			.Select(i => new ClientLogRequest
			{
				LogLevel = "Error",
				Message = $"Batch error {i}",
				SourceContext = $"Component{i}",
			})];

		// Act
		HttpResponseMessage response = await Client!.PostAsJsonAsync("/api/v1/logs/client/batch", requests);

		// Assert
		Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

		// Verify logs were created
		using IServiceScope scope = Factory!.Services.CreateScope();
		ILogRepository logRepo = scope.ServiceProvider.GetRequiredService<ILogRepository>();
		LogFilterRequest request = new() { LogLevel = "Error", Page = 1, PageSize = 100 };
		(IEnumerable<Log> logs, int _) = await logRepo.GetPagedAsync(request);
		List<Log> batchLogs = [.. logs.Where(l => l.Message.StartsWith("Batch error "))];

		Assert.True(batchLogs.Count >= 50, $"Expected at least 50 batch logs, found {batchLogs.Count}");
	}

	/// <summary>
	/// Tests that GET /api/logs/count returns total count with no filters.
	/// </summary>
	[Fact]
	public async Task GetCountAsync_NoFilters_ReturnsTotalCountAsync()
	{
		// Act
		HttpResponseMessage response = await Client!.GetAsync("/api/v1/logs/count");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		LogCountResponse? countResponse = await response.Content.ReadFromJsonAsync<LogCountResponse>();
		Assert.NotNull(countResponse);
		Assert.True(countResponse.Total >= 3); // At least the 3 seeded logs
	}

	/// <summary>
	/// Tests that GET /api/logs/count filters by log level.
	/// </summary>
	[Fact]
	public async Task GetCountAsync_FilterByLogLevel_ReturnsMatchingCountAsync()
	{
		// Act
		HttpResponseMessage response = await Client!.GetAsync("/api/v1/logs/count?logLevel=Error&startDate=");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		LogCountResponse? countResponse = await response.Content.ReadFromJsonAsync<LogCountResponse>();
		Assert.NotNull(countResponse);
		Assert.True(countResponse.Total >= 1); // At least one Error log
	}

	/// <summary>
	/// Tests that GET /api/logs/count filters by date range.
	/// </summary>
	[Fact]
	public async Task GetCountAsync_FilterByDateRange_ReturnsMatchingCountAsync()
	{
		// Arrange
		DateTime startDate = DateTime.UtcNow.AddHours(-2.5);
		DateTime endDate = DateTime.UtcNow.AddMinutes(-30);

		// Act
		HttpResponseMessage response = await Client!.GetAsync(
			$"/api/v1/logs/count?startDate={startDate:O}&endDate={endDate:O}");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		LogCountResponse? countResponse = await response.Content.ReadFromJsonAsync<LogCountResponse>();
		Assert.NotNull(countResponse);
		Assert.True(countResponse.Total >= 1); // At least one log in this range
	}

	/// <summary>
	/// Tests that GET /api/logs/count filters by source context using searchTerm.
	/// </summary>
	[Fact]
	public async Task GetCountAsync_FilterBySourceContext_ReturnsMatchingCountAsync()
	{
		// Act - Override StartDate to include test data created 1-3 hours ago
		DateTime startDate = DateTime.UtcNow.AddHours(-4);
		HttpResponseMessage response = await Client!.GetAsync(
			$"/api/v1/logs/count?searchTerm=SeventySix.Api.Controllers.UsersController&startDate={startDate:O}");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		LogCountResponse? countResponse = await response.Content.ReadFromJsonAsync<LogCountResponse>();
		Assert.NotNull(countResponse);
		Assert.True(countResponse.Total >= 2, $"Expected at least 2 logs with UsersController in SourceContext, got {countResponse.Total}");
	}

	/// <summary>
	/// Tests that GET /api/logs/count filters by request path using searchTerm.
	/// </summary>
	[Fact]
	public async Task GetCountAsync_FilterByRequestPath_ReturnsMatchingCountAsync()
	{
		// Act - Override StartDate to include test data created 1-3 hours ago
		DateTime startDate = DateTime.UtcNow.AddHours(-4);
		HttpResponseMessage response = await Client!.GetAsync(
			$"/api/v1/logs/count?searchTerm=/api/users&startDate={startDate:O}");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		LogCountResponse? countResponse = await response.Content.ReadFromJsonAsync<LogCountResponse>();
		Assert.NotNull(countResponse);
		Assert.True(countResponse.Total >= 2, $"Expected at least 2 logs with /api/users in RequestPath, got {countResponse.Total}");
	}

	/// <summary>
	/// Tests that GET /api/logs/count applies multiple filters.
	/// </summary>
	[Fact]
	public async Task GetCountAsync_MultipleFilters_ReturnsMatchingCountAsync()
	{
		// Act - Override StartDate to include test data created 1-3 hours ago
		DateTime startDate = DateTime.UtcNow.AddHours(-4);
		HttpResponseMessage response = await Client!.GetAsync(
			$"/api/v1/logs/count?logLevel=Warning&searchTerm=SeventySix.Api.Controllers.UsersController&startDate={startDate:O}");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		LogCountResponse? countResponse = await response.Content.ReadFromJsonAsync<LogCountResponse>();
		Assert.NotNull(countResponse);
		Assert.True(countResponse.Total >= 1, $"Expected at least 1 Warning log with UsersController in SourceContext, got {countResponse.Total}");
	}

	/// <summary>
	/// Tests that DELETE /api/logs/{id} deletes a log and returns 204 No Content.
	/// </summary>
	[Fact]
	public async Task DeleteLogAsync_WithValidId_ReturnsNoContentAsync()
	{
		// Arrange - Create a log to delete
		using IServiceScope scope = Factory!.Services.CreateScope();
		ILogRepository logRepo = scope.ServiceProvider.GetRequiredService<ILogRepository>();
		Log log = await logRepo.CreateAsync(new Log
		{
			LogLevel = "Error",
			Message = "Test log for deletion",
			CreateDate = DateTime.UtcNow,
			MachineName = "test",
			Environment = "Test",
		});

		// Act
		HttpResponseMessage response = await Client!.DeleteAsync($"/api/v1/logs/{log.Id}");

		// Assert
		Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

		// Verify log is deleted
		LogFilterRequest request = new() { PageSize = 1000 };
		(IEnumerable<Log> logs, int _) = await logRepo.GetPagedAsync(request);
		Assert.DoesNotContain(logs, l => l.Id == log.Id);
	}

	/// <summary>
	/// Tests that DELETE /api/logs/{id} returns 404 for non-existent log.
	/// </summary>
	[Fact]
	public async Task DeleteLogAsync_WithInvalidId_ReturnsNotFoundAsync()
	{
		// Act
		HttpResponseMessage response = await Client!.DeleteAsync("/api/v1/logs/999999999");

		// Assert
		Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
	}

	/// <summary>
	/// Tests that DELETE /api/logs/batch deletes multiple logs and returns count.
	/// </summary>
	[Fact]
	public async Task DeleteLogBatchAsync_WithValidIds_ReturnsDeletedCountAsync()
	{
		// Arrange - Create logs to delete
		using IServiceScope scope = Factory!.Services.CreateScope();
		ILogRepository logRepo = scope.ServiceProvider.GetRequiredService<ILogRepository>();

		Log log1 = await logRepo.CreateAsync(new Log
		{
			LogLevel = "Error",
			Message = "Batch delete test 1",
			CreateDate = DateTime.UtcNow,
			MachineName = "test",
			Environment = "Test",
		});

		Log log2 = await logRepo.CreateAsync(new Log
		{
			LogLevel = "Warning",
			Message = "Batch delete test 2",
			CreateDate = DateTime.UtcNow,
			MachineName = "test",
			Environment = "Test",
		});

		Log log3 = await logRepo.CreateAsync(new Log
		{
			LogLevel = "Fatal",
			Message = "Batch delete test 3",
			CreateDate = DateTime.UtcNow,
			MachineName = "test",
			Environment = "Test",
		});

		int[] idsToDelete = [log1.Id, log2.Id, log3.Id];

		// Act
		HttpRequestMessage deleteRequest = new(HttpMethod.Delete, "/api/v1/logs/batch")
		{
			Content = JsonContent.Create(idsToDelete),
		};
		HttpResponseMessage response = await Client!.SendAsync(deleteRequest);

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		int deletedCount = await response.Content.ReadFromJsonAsync<int>();
		Assert.Equal(3, deletedCount);

		// Verify logs are deleted
		LogFilterRequest filterRequest = new() { PageSize = 1000 };
		(IEnumerable<Log> remainingLogs, int _) = await logRepo.GetPagedAsync(filterRequest);
		Assert.DoesNotContain(remainingLogs, l => idsToDelete.Contains(l.Id));
	}

	/// <summary>
	/// Tests that DELETE /api/logs/batch with empty array returns 400 Bad Request.
	/// </summary>
	[Fact]
	public async Task DeleteLogBatchAsync_WithEmptyArray_ReturnsBadRequestAsync()
	{
		// Arrange
		int[] emptyIds = [];

		// Act
		HttpRequestMessage deleteRequest = new(HttpMethod.Delete, "/api/v1/logs/batch")
		{
			Content = JsonContent.Create(emptyIds),
		};
		HttpResponseMessage response = await Client!.SendAsync(deleteRequest);

		// Assert
		Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
	}

	/// <summary>
	/// Tests that DELETE /api/logs/batch returns partial count if some IDs don't exist.
	/// </summary>
	[Fact]
	public async Task DeleteLogBatchAsync_WithSomeInvalidIds_ReturnsPartialCountAsync()
	{
		// Arrange - Create one log to delete
		using IServiceScope scope = Factory!.Services.CreateScope();
		ILogRepository logRepo = scope.ServiceProvider.GetRequiredService<ILogRepository>();

		Log log = await logRepo.CreateAsync(new Log
		{
			LogLevel = "Error",
			Message = "Partial batch delete test",
			CreateDate = DateTime.UtcNow,
			MachineName = "test",
			Environment = "Test",
		});

		// Include one valid and two invalid IDs
		int[] idsToDelete = [log.Id, 999999998, 999999999];

		// Act
		HttpRequestMessage request = new(HttpMethod.Delete, "/api/v1/logs/batch")
		{
			Content = JsonContent.Create(idsToDelete),
		};
		HttpResponseMessage response = await Client!.SendAsync(request);

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		int deletedCount = await response.Content.ReadFromJsonAsync<int>();
		Assert.Equal(1, deletedCount); // Only 1 valid ID was deleted
	}
}
