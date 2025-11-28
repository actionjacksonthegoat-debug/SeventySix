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
/// Tests the HTTP API endpoints for log management.
/// Uses WebApplicationFactory to create a test server with real database.
/// Focuses on verifying API contract behavior (routes, status codes).
/// Service-layer logic is tested separately in repository/service tests.
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

		// Seed minimal test data needed for remaining tests
		Log[] testLogs =
		[
			LogBuilder.CreateWarning()
				.WithMessage("Test warning message")
				.WithSourceContext("SeventySix.Api.Controllers.UsersController")
				.WithTimestamp(DateTime.UtcNow.AddHours(-1))
				.Build(),
			LogBuilder.CreateError()
				.WithMessage("Test error message")
				.WithTimestamp(DateTime.UtcNow.AddDays(-31)) // Older than 30 days for cleanup test
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
	/// Tests that GET /api/logs returns logs when no filters are applied.
	/// </summary>
	[Fact]
	public async Task GetPagedAsync_NoFilters_ReturnsLogsAsync()
	{
		// Act
		HttpResponseMessage response = await Client!.GetAsync("/api/v1/logs");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		PagedLogResponse? pagedResponse = await response.Content.ReadFromJsonAsync<PagedLogResponse>();
		Assert.NotNull(pagedResponse);
		Assert.NotNull(pagedResponse.Data);
		Assert.True(pagedResponse.Data.Count >= 2, "Should return at least the 2 seeded logs");
	}

	/// <summary>
	/// Tests that GET /api/logs returns 400 when page size exceeds maximum.
	/// </summary>
	[Fact]
	public async Task GetPagedAsync_ExceedsMaxPageSize_ReturnsBadRequestAsync()
	{
		// Act
		HttpResponseMessage response = await Client!.GetAsync("/api/v1/logs?pageSize=200");

		// Assert
		Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
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
			SourceContext = "TestComponent",
		};

		// Act
		HttpResponseMessage response = await Client!.PostAsJsonAsync("/api/v1/logs/client", request);

		// Assert
		Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
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
			new ClientLogRequest { LogLevel = "Error", Message = "Batch error 1" },
			new ClientLogRequest { LogLevel = "Warning", Message = "Batch warning 2" },
		];

		// Act
		HttpResponseMessage response = await Client!.PostAsJsonAsync("/api/v1/logs/client/batch", requests);

		// Assert
		Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
	}

	/// <summary>
	/// Tests that GET /api/logs/count returns total count.
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
		Assert.True(countResponse.Total >= 1);
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

		int[] idsToDelete = [log1.Id, log2.Id];

		// Act
		HttpRequestMessage deleteRequest = new(HttpMethod.Delete, "/api/v1/logs/batch")
		{
			Content = JsonContent.Create(idsToDelete),
		};
		HttpResponseMessage response = await Client!.SendAsync(deleteRequest);

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		int deletedCount = await response.Content.ReadFromJsonAsync<int>();
		Assert.Equal(2, deletedCount);
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
}