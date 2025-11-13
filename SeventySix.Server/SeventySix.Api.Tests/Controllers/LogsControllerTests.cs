// <copyright file="LogsControllerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.Core.DTOs.Logs;
using SeventySix.Core.Entities;
using SeventySix.Core.Interfaces;
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
public class LogsControllerTests : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime
{
	private readonly WebApplicationFactory<Program> Factory;
	private readonly HttpClient Client;
	private ILogRepository? LogRepository;

	/// <summary>
	/// Initializes a new instance of the <see cref="LogsControllerTests"/> class.
	/// </summary>
	/// <param name="factory">The web application factory.</param>
	public LogsControllerTests(WebApplicationFactory<Program> factory)
	{
		Factory = factory;
		Client = Factory.CreateClient();
	}

	/// <inheritdoc/>
	public async Task InitializeAsync()
	{
		// Get repository to seed test data
		using var scope = Factory.Services.CreateScope();
		LogRepository = scope.ServiceProvider.GetRequiredService<ILogRepository>();

		// Seed test data
		var testLogs = new[]
		{
			new Log
			{
				LogLevel = "Warning",
				Message = "Test warning message",
				SourceContext = "SeventySix.Api.Controllers.WeatherController",
				RequestMethod = "GET",
				RequestPath = "/api/weather",
				StatusCode = 200,
				DurationMs = 150,
				Timestamp = DateTime.UtcNow.AddHours(-1),
				MachineName = "test-machine",
				Environment = "Test",
			},
			new Log
			{
				LogLevel = "Error",
				Message = "Test error message",
				ExceptionMessage = "Exception occurred",
				BaseExceptionMessage = "Base exception",
				StackTrace = "at SeventySix.Api.Controllers.WeatherController.GetWeather()",
				SourceContext = "SeventySix.Api.Controllers.WeatherController",
				RequestMethod = "POST",
				RequestPath = "/api/weather",
				StatusCode = 500,
				DurationMs = 250,
				Timestamp = DateTime.UtcNow.AddHours(-2),
				MachineName = "test-machine",
				Environment = "Test",
			},
			new Log
			{
				LogLevel = "Fatal",
				Message = "Test fatal message",
				ExceptionMessage = "Fatal exception",
				StackTrace = "at SeventySix.Api.Program.Main()",
				SourceContext = "SeventySix.Api.Program",
				RequestMethod = "GET",
				RequestPath = "/api/test",
				StatusCode = 500,
				DurationMs = 500,
				Timestamp = DateTime.UtcNow.AddHours(-3),
				MachineName = "test-machine",
				Environment = "Test",
			},
			new Log
			{
				LogLevel = "Warning",
				Message = "Old warning message",
				SourceContext = "SeventySix.Api.Controllers.TestController",
				RequestMethod = "GET",
				RequestPath = "/api/test",
				StatusCode = 200,
				DurationMs = 100,
				Timestamp = DateTime.UtcNow.AddDays(-31), // Older than 30 days
				MachineName = "test-machine",
				Environment = "Test",
			},
		};

		foreach (var log in testLogs)
		{
			await LogRepository.CreateAsync(log);
		}
	}

	/// <inheritdoc/>
	public Task DisposeAsync()
	{
		Client.Dispose();
		return Task.CompletedTask;
	}

	/// <summary>
	/// Tests that GET /api/logs returns all logs when no filters are applied.
	/// </summary>
	[Fact]
	public async Task GetLogsAsync_NoFilters_ReturnsAllLogsAsync()
	{
		// Act
		var response = await Client.GetAsync("/api/logs");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		var logs = await response.Content.ReadFromJsonAsync<LogResponse[]>();
		Assert.NotNull(logs);
		Assert.True(logs.Length >= 4, "Should return at least the 4 seeded logs");
	}

	/// <summary>
	/// Tests that GET /api/logs filters by log level correctly.
	/// </summary>
	[Fact]
	public async Task GetLogsAsync_FilterByLogLevel_ReturnsMatchingLogsAsync()
	{
		// Act
		var response = await Client.GetAsync("/api/logs?logLevel=Error");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		var logs = await response.Content.ReadFromJsonAsync<LogResponse[]>();
		Assert.NotNull(logs);
		Assert.All(logs, log => Assert.Equal("Error", log.LogLevel));
	}

	/// <summary>
	/// Tests that GET /api/logs filters by date range correctly.
	/// </summary>
	[Fact]
	public async Task GetLogsAsync_FilterByDateRange_ReturnsLogsInRangeAsync()
	{
		// Arrange
		var startDate = DateTime.UtcNow.AddHours(-4);
		var endDate = DateTime.UtcNow;

		// Act
		var response = await Client.GetAsync(
			$"/api/logs?startDate={startDate:O}&endDate={endDate:O}");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		var logs = await response.Content.ReadFromJsonAsync<LogResponse[]>();
		Assert.NotNull(logs);
		Assert.All(logs, log =>
		{
			Assert.True(log.Timestamp >= startDate);
			Assert.True(log.Timestamp <= endDate);
		});
	}

	/// <summary>
	/// Tests that GET /api/logs filters by source context correctly.
	/// </summary>
	[Fact]
	public async Task GetLogsAsync_FilterBySourceContext_ReturnsMatchingLogsAsync()
	{
		// Act
		var response = await Client.GetAsync(
			"/api/logs?sourceContext=SeventySix.Api.Controllers.WeatherController");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		var logs = await response.Content.ReadFromJsonAsync<LogResponse[]>();
		Assert.NotNull(logs);
		Assert.All(logs, log =>
			Assert.Equal("SeventySix.Api.Controllers.WeatherController", log.SourceContext));
	}

	/// <summary>
	/// Tests that GET /api/logs filters by request path correctly.
	/// </summary>
	[Fact]
	public async Task GetLogsAsync_FilterByRequestPath_ReturnsMatchingLogsAsync()
	{
		// Act
		var response = await Client.GetAsync("/api/logs?requestPath=/api/weather");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		var logs = await response.Content.ReadFromJsonAsync<LogResponse[]>();
		Assert.NotNull(logs);
		Assert.All(logs, log => Assert.Equal("/api/weather", log.RequestPath));
	}

	/// <summary>
	/// Tests that GET /api/logs respects pagination with default page size.
	/// </summary>
	[Fact]
	public async Task GetLogsAsync_WithPagination_ReturnsCorrectPageAsync()
	{
		// Act - Get page 1
		var response1 = await Client.GetAsync("/api/logs?page=1&pageSize=2");
		var logs1 = await response1.Content.ReadFromJsonAsync<LogResponse[]>();

		// Act - Get page 2
		var response2 = await Client.GetAsync("/api/logs?page=2&pageSize=2");
		var logs2 = await response2.Content.ReadFromJsonAsync<LogResponse[]>();

		// Assert
		Assert.Equal(HttpStatusCode.OK, response1.StatusCode);
		Assert.Equal(HttpStatusCode.OK, response2.StatusCode);
		Assert.NotNull(logs1);
		Assert.NotNull(logs2);
		Assert.True(logs1.Length <= 2);
		Assert.True(logs2.Length <= 2);

		// Verify no duplicates between pages
		var ids1 = logs1.Select(l => l.Id).ToHashSet();
		var ids2 = logs2.Select(l => l.Id).ToHashSet();
		Assert.Empty(ids1.Intersect(ids2));
	}

	/// <summary>
	/// Tests that GET /api/logs enforces maximum page size of 100.
	/// </summary>
	[Fact]
	public async Task GetLogsAsync_ExceedsMaxPageSize_ReturnsMaxRecordsAsync()
	{
		// Act
		var response = await Client.GetAsync("/api/logs?pageSize=200");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		var logs = await response.Content.ReadFromJsonAsync<LogResponse[]>();
		Assert.NotNull(logs);
		Assert.True(logs.Length <= 100, "Should not exceed maximum page size of 100");
	}

	/// <summary>
	/// Tests that GET /api/logs combines multiple filters correctly.
	/// </summary>
	[Fact]
	public async Task GetLogsAsync_MultipleFilters_ReturnsMatchingLogsAsync()
	{
		// Arrange
		var startDate = DateTime.UtcNow.AddHours(-4);
		var endDate = DateTime.UtcNow;

		// Act
		var response = await Client.GetAsync(
			$"/api/logs?logLevel=Warning&startDate={startDate:O}&endDate={endDate:O}&requestPath=/api/weather");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		var logs = await response.Content.ReadFromJsonAsync<LogResponse[]>();
		Assert.NotNull(logs);
		Assert.All(logs, log =>
		{
			Assert.Equal("Warning", log.LogLevel);
			Assert.True(log.Timestamp >= startDate);
			Assert.True(log.Timestamp <= endDate);
			Assert.Equal("/api/weather", log.RequestPath);
		});
	}

	/// <summary>
	/// Tests that GET /api/logs/statistics returns aggregated statistics.
	/// </summary>
	[Fact]
	public async Task GetStatisticsAsync_NoFilters_ReturnsAggregatedDataAsync()
	{
		// Act
		var response = await Client.GetAsync("/api/logs/statistics");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		var stats = await response.Content.ReadFromJsonAsync<LogStatisticsResponse>();
		Assert.NotNull(stats);
		Assert.True(stats.TotalLogs >= 4);
		Assert.True(stats.ErrorCount >= 1);
		Assert.True(stats.WarningCount >= 2);
		Assert.True(stats.FatalCount >= 1);
		Assert.True(stats.AverageResponseTimeMs > 0);
		Assert.NotEmpty(stats.TopErrorSources);
		Assert.NotEmpty(stats.RequestsByPath);
	}

	/// <summary>
	/// Tests that GET /api/logs/statistics filters by date range correctly.
	/// </summary>
	[Fact]
	public async Task GetStatisticsAsync_FilterByDateRange_ReturnsFilteredStatsAsync()
	{
		// Arrange
		var startDate = DateTime.UtcNow.AddHours(-4);
		var endDate = DateTime.UtcNow;

		// Act
		var response = await Client.GetAsync(
			$"/api/logs/statistics?startDate={startDate:O}&endDate={endDate:O}");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		var stats = await response.Content.ReadFromJsonAsync<LogStatisticsResponse>();
		Assert.NotNull(stats);
		Assert.Equal(startDate.Date, stats.StartDate.Date);
		Assert.Equal(endDate.Date, stats.EndDate.Date);
		// Should not include the 31-day-old log
		Assert.True(stats.TotalLogs >= 3);
	}

	/// <summary>
	/// Tests that DELETE /api/logs/cleanup removes old logs.
	/// </summary>
	[Fact]
	public async Task CleanupLogsAsync_WithCutoffDate_DeletesOldLogsAsync()
	{
		// Arrange
		var cutoffDate = DateTime.UtcNow.AddDays(-30);

		// Act
		var response = await Client.DeleteAsync(
			$"/api/logs/cleanup?cutoffDate={cutoffDate:O}");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		var deletedCount = await response.Content.ReadFromJsonAsync<int>();
		Assert.True(deletedCount >= 1, "Should delete at least the 31-day-old log");
	}

	/// <summary>
	/// Tests that DELETE /api/logs/cleanup requires cutoff date parameter.
	/// </summary>
	[Fact]
	public async Task CleanupLogsAsync_NoCutoffDate_ReturnsBadRequestAsync()
	{
		// Act
		var response = await Client.DeleteAsync("/api/logs/cleanup");

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
		var request = new ClientLogRequest
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
		var response = await Client.PostAsJsonAsync("/api/logs/client", request);

		// Assert
		Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

		// Verify log was created
		using var scope = Factory.Services.CreateScope();
		var logRepo = scope.ServiceProvider.GetRequiredService<ILogRepository>();
		var logs = await logRepo.GetLogsAsync(
			logLevel: "Error",
			sourceContext: "UserComponent",
			skip: 0,
			take: 10);
		var clientLog = logs.FirstOrDefault(l => l.Message == "Client-side error occurred");

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
		var response = await Client.PostAsJsonAsync("/api/logs/client", invalidRequest);

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
		var response = await Client.PostAsJsonAsync("/api/logs/client", invalidRequest);

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
		var request = new ClientLogRequest
		{
			LogLevel = "Warning",
			Message = "Simple client warning",
		};

		// Act
		var response = await Client.PostAsJsonAsync("/api/logs/client", request);

		// Assert
		Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

		// Verify log was created with defaults
		using var scope = Factory.Services.CreateScope();
		var logRepo = scope.ServiceProvider.GetRequiredService<ILogRepository>();
		var logs = await logRepo.GetLogsAsync(
			logLevel: "Warning",
			skip: 0,
			take: 10);
		var clientLog = logs.FirstOrDefault(l => l.Message == "Simple client warning");

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
		var request = new ClientLogRequest
		{
			LogLevel = logLevel,
			Message = $"Test {logLevel} message",
		};

		// Act
		var response = await Client.PostAsJsonAsync("/api/logs/client", request);

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
		var request = new ClientLogRequest
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
		var response = await Client.PostAsJsonAsync("/api/logs/client", request);

		// Assert
		Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

		// Verify context was preserved in Properties JSON
		using var scope = Factory.Services.CreateScope();
		var logRepo = scope.ServiceProvider.GetRequiredService<ILogRepository>();
		var logs = await logRepo.GetLogsAsync(
			logLevel: "Error",
			skip: 0,
			take: 10);
		var clientLog = logs.FirstOrDefault(l => l.Message == "Error with context");

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
		var requests = new[]
		{
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
		};

		// Act
		var response = await Client.PostAsJsonAsync("/api/logs/client/batch", requests);

		// Assert
		Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

		// Verify all logs were created
		using var scope = Factory.Services.CreateScope();
		var logRepo = scope.ServiceProvider.GetRequiredService<ILogRepository>();
		var logs = await logRepo.GetLogsAsync(skip: 0, take: 100);

		var log1 = logs.FirstOrDefault(l => l.Message == "Batch error 1");
		var log2 = logs.FirstOrDefault(l => l.Message == "Batch warning 2");
		var log3 = logs.FirstOrDefault(l => l.Message == "Batch info 3");

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
		var requests = Array.Empty<ClientLogRequest>();

		// Act
		var response = await Client.PostAsJsonAsync("/api/logs/client/batch", requests);

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
		var requests = new object[]
		{
			new { LogLevel = "Error", Message = "Valid error" },
			new { LogLevel = "Warning" }, // Missing Message
		};

		// Act
		var response = await Client.PostAsJsonAsync("/api/logs/client/batch", requests);

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
		var requests = Enumerable.Range(1, 50)
			.Select(i => new ClientLogRequest
			{
				LogLevel = "Error",
				Message = $"Batch error {i}",
				SourceContext = $"Component{i}",
			})
			.ToArray();

		// Act
		var response = await Client.PostAsJsonAsync("/api/logs/client/batch", requests);

		// Assert
		Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

		// Verify logs were created
		using var scope = Factory.Services.CreateScope();
		var logRepo = scope.ServiceProvider.GetRequiredService<ILogRepository>();
		var logs = await logRepo.GetLogsAsync(logLevel: "Error", skip: 0, take: 100);
		var batchLogs = logs.Where(l => l.Message.StartsWith("Batch error ")).ToList();

		Assert.True(batchLogs.Count >= 50, $"Expected at least 50 batch logs, found {batchLogs.Count}");
	}

	/// <summary>
	/// Tests that GET /api/logs/chart-data returns chart data for valid period.
	/// </summary>
	[Theory]
	[InlineData("24h")]
	[InlineData("7d")]
	[InlineData("30d")]
	public async Task GetChartDataAsync_WithValidPeriod_ReturnsOkAsync(string period)
	{
		// Act
		var response = await Client.GetAsync($"/api/logs/chart-data?period={period}");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		var chartData = await response.Content.ReadFromJsonAsync<LogChartDataResponse>();
		Assert.NotNull(chartData);
		Assert.Equal(period, chartData.Period);
		Assert.NotNull(chartData.DataPoints);
	}

	/// <summary>
	/// Tests that GET /api/logs/chart-data returns BadRequest for invalid period.
	/// </summary>
	[Fact]
	public async Task GetChartDataAsync_WithInvalidPeriod_ReturnsBadRequestAsync()
	{
		// Act
		var response = await Client.GetAsync("/api/logs/chart-data?period=invalid");

		// Assert
		Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
	}

	/// <summary>
	/// Tests that GET /api/logs/chart-data uses default period when not specified.
	/// </summary>
	[Fact]
	public async Task GetChartDataAsync_WithNoPeriod_UsesDefaultAsync()
	{
		// Act
		var response = await Client.GetAsync("/api/logs/chart-data");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		var chartData = await response.Content.ReadFromJsonAsync<LogChartDataResponse>();
		Assert.NotNull(chartData);
		Assert.Equal("24h", chartData.Period); // Default should be 24h
	}

	/// <summary>
	/// Tests that GET /api/logs/count returns total count with no filters.
	/// </summary>
	[Fact]
	public async Task GetCountAsync_NoFilters_ReturnsTotalCountAsync()
	{
		// Act
		var response = await Client.GetAsync("/api/logs/count");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		var countResponse = await response.Content.ReadFromJsonAsync<LogCountResponse>();
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
		var response = await Client.GetAsync("/api/logs/count?logLevel=Error");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		var countResponse = await response.Content.ReadFromJsonAsync<LogCountResponse>();
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
		var startDate = DateTime.UtcNow.AddHours(-2.5);
		var endDate = DateTime.UtcNow.AddMinutes(-30);

		// Act
		var response = await Client.GetAsync(
			$"/api/logs/count?startDate={startDate:O}&endDate={endDate:O}");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		var countResponse = await response.Content.ReadFromJsonAsync<LogCountResponse>();
		Assert.NotNull(countResponse);
		Assert.True(countResponse.Total >= 1); // At least one log in this range
	}

	/// <summary>
	/// Tests that GET /api/logs/count filters by source context.
	/// </summary>
	[Fact]
	public async Task GetCountAsync_FilterBySourceContext_ReturnsMatchingCountAsync()
	{
		// Act
		var response = await Client.GetAsync(
			"/api/logs/count?sourceContext=SeventySix.Api.Controllers.WeatherController");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		var countResponse = await response.Content.ReadFromJsonAsync<LogCountResponse>();
		Assert.NotNull(countResponse);
		Assert.True(countResponse.Total >= 2); // At least 2 logs from WeatherController
	}

	/// <summary>
	/// Tests that GET /api/logs/count filters by request path.
	/// </summary>
	[Fact]
	public async Task GetCountAsync_FilterByRequestPath_ReturnsMatchingCountAsync()
	{
		// Act
		var response = await Client.GetAsync("/api/logs/count?requestPath=/api/weather");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		var countResponse = await response.Content.ReadFromJsonAsync<LogCountResponse>();
		Assert.NotNull(countResponse);
		Assert.True(countResponse.Total >= 2); // At least 2 logs for /api/weather
	}

	/// <summary>
	/// Tests that GET /api/logs/count applies multiple filters.
	/// </summary>
	[Fact]
	public async Task GetCountAsync_MultipleFilters_ReturnsMatchingCountAsync()
	{
		// Act
		var response = await Client.GetAsync(
			"/api/logs/count?logLevel=Warning&sourceContext=SeventySix.Api.Controllers.WeatherController");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		var countResponse = await response.Content.ReadFromJsonAsync<LogCountResponse>();
		Assert.NotNull(countResponse);
		Assert.True(countResponse.Total >= 1); // At least 1 Warning from WeatherController
	}

	/// <summary>
	/// Tests that DELETE /api/logs/{id} deletes a log and returns 204 No Content.
	/// </summary>
	[Fact]
	public async Task DeleteLogAsync_WithValidId_ReturnsNoContentAsync()
	{
		// Arrange - Create a log to delete
		using var scope = Factory.Services.CreateScope();
		var logRepo = scope.ServiceProvider.GetRequiredService<ILogRepository>();
		var log = await logRepo.CreateAsync(new Log
		{
			LogLevel = "Error",
			Message = "Test log for deletion",
			Timestamp = DateTime.UtcNow,
			MachineName = "test",
			Environment = "Test",
		});

		// Act
		var response = await Client.DeleteAsync($"/api/logs/{log.Id}");

		// Assert
		Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

		// Verify log is deleted
		var logs = await logRepo.GetLogsAsync(take: 1000);
		Assert.DoesNotContain(logs, l => l.Id == log.Id);
	}

	/// <summary>
	/// Tests that DELETE /api/logs/{id} returns 404 for non-existent log.
	/// </summary>
	[Fact]
	public async Task DeleteLogAsync_WithInvalidId_ReturnsNotFoundAsync()
	{
		// Act
		var response = await Client.DeleteAsync("/api/logs/999999999");

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
		using var scope = Factory.Services.CreateScope();
		var logRepo = scope.ServiceProvider.GetRequiredService<ILogRepository>();

		var log1 = await logRepo.CreateAsync(new Log
		{
			LogLevel = "Error",
			Message = "Batch delete test 1",
			Timestamp = DateTime.UtcNow,
			MachineName = "test",
			Environment = "Test",
		});

		var log2 = await logRepo.CreateAsync(new Log
		{
			LogLevel = "Warning",
			Message = "Batch delete test 2",
			Timestamp = DateTime.UtcNow,
			MachineName = "test",
			Environment = "Test",
		});

		var log3 = await logRepo.CreateAsync(new Log
		{
			LogLevel = "Fatal",
			Message = "Batch delete test 3",
			Timestamp = DateTime.UtcNow,
			MachineName = "test",
			Environment = "Test",
		});

		var idsToDelete = new[] { log1.Id, log2.Id, log3.Id };

		// Act
		var request = new HttpRequestMessage(HttpMethod.Delete, "/api/logs/batch")
		{
			Content = JsonContent.Create(idsToDelete),
		};
		var response = await Client.SendAsync(request);

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		var deletedCount = await response.Content.ReadFromJsonAsync<int>();
		Assert.Equal(3, deletedCount);

		// Verify logs are deleted
		var remainingLogs = await logRepo.GetLogsAsync(take: 1000);
		Assert.DoesNotContain(remainingLogs, l => idsToDelete.Contains(l.Id));
	}

	/// <summary>
	/// Tests that DELETE /api/logs/batch with empty array returns 400 Bad Request.
	/// </summary>
	[Fact]
	public async Task DeleteLogBatchAsync_WithEmptyArray_ReturnsBadRequestAsync()
	{
		// Arrange
		var emptyIds = Array.Empty<int>();

		// Act
		var request = new HttpRequestMessage(HttpMethod.Delete, "/api/logs/batch")
		{
			Content = JsonContent.Create(emptyIds),
		};
		var response = await Client.SendAsync(request);

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
		using var scope = Factory.Services.CreateScope();
		var logRepo = scope.ServiceProvider.GetRequiredService<ILogRepository>();

		var log = await logRepo.CreateAsync(new Log
		{
			LogLevel = "Error",
			Message = "Partial batch delete test",
			Timestamp = DateTime.UtcNow,
			MachineName = "test",
			Environment = "Test",
		});

		// Include one valid and two invalid IDs
		var idsToDelete = new[] { log.Id, 999999998, 999999999 };

		// Act
		var request = new HttpRequestMessage(HttpMethod.Delete, "/api/logs/batch")
		{
			Content = JsonContent.Create(idsToDelete),
		};
		var response = await Client.SendAsync(request);

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		var deletedCount = await response.Content.ReadFromJsonAsync<int>();
		Assert.Equal(1, deletedCount); // Only 1 valid ID was deleted
	}
}