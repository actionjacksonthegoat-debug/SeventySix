// <copyright file="LogsControllerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Time.Testing;
using SeventySix.Identity;
using SeventySix.Logging;
using SeventySix.Shared.DTOs;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using SeventySix.TestUtilities.TestHelpers;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Integration tests for LogsController.
/// </summary>
/// <remarks>
/// Tests the HTTP API endpoints for log management.
/// Uses shared WebApplicationFactory for improved test performance.
/// Focuses on verifying API contract behavior (routes, status codes).
/// Service-layer logic is tested separately in repository/service tests.
/// </remarks>
[Collection("PostgreSQL")]
public class LogsControllerTests(TestcontainersPostgreSqlFixture fixture) : ApiPostgreSqlTestBase<Program>(fixture), IAsyncLifetime
{
	private readonly string TestId = Guid.NewGuid().ToString("N")[..8];
	private HttpClient? Client;
	private ILogRepository? LogRepository;

	/// <inheritdoc/>
	public override async Task InitializeAsync()
	{
		// DO NOT call base.InitializeAsync() to avoid truncating logs
		// These tests expect logs from API requests to accumulate
		// Only truncate non-logging tables for isolation
		await TruncateTablesAsync([.. TestTables.ApiTracking, .. TestTables.Identity]);

		// Use shared factory's client for better performance
		Client = CreateClient();

		// Create admin user and authenticate
		await AuthenticateAsAdminAsync();

		// Get repository to seed test data from shared factory
		using IServiceScope scope = SharedFactory.Services.CreateScope();
		LogRepository = scope.ServiceProvider.GetRequiredService<ILogRepository>();

		// Seed minimal test data needed for remaining tests
		FakeTimeProvider timeProvider = new();
		Log[] testLogs =
		[
			LogBuilder.CreateWarning(timeProvider)
				.WithMessage("Test warning message")
				.WithSourceContext("SeventySix.Api.Controllers.UsersController")
				.WithTimestamp(timeProvider.GetUtcNow().UtcDateTime.AddHours(-1))
				.Build(),
			LogBuilder.CreateError(timeProvider)
				.WithMessage("Test error message")
				.WithTimestamp(timeProvider.GetUtcNow().UtcDateTime.AddDays(-31)) // Older than 30 days for cleanup test
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
		// Only dispose client, not the shared factory (managed by fixture)
		Client?.Dispose();
		return Task.CompletedTask;
	}

	/// <summary>
	/// Tests that GET /api/logs returns logs when no filters are applied.
	/// </summary>
	[Fact]
	public async Task GetPagedAsync_NoFilters_ReturnsLogsAsync()
	{
		// Act
		HttpResponseMessage response = await Client!.GetAsync(ApiEndpoints.Logs.Base);

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		PagedResult<LogDto>? pagedResponse = await response.Content.ReadFromJsonAsync<PagedResult<LogDto>>();
		Assert.NotNull(pagedResponse);
		Assert.NotNull(pagedResponse.Items);
		Assert.True(pagedResponse.Items.Count >= 2, "Should return at least the 2 seeded logs");
	}

	/// <summary>
	/// Tests that GET /api/logs returns 400 when page size exceeds maximum.
	/// </summary>
	[Fact]
	public async Task GetPagedAsync_ExceedsMaxPageSize_ReturnsBadRequestAsync()
	{
		// Act
		HttpResponseMessage response = await Client!.GetAsync($"{ApiEndpoints.Logs.Base}?pageSize=200");

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
		FakeTimeProvider timeProvider = new();
		DateTime cutoffDate = timeProvider.GetUtcNow().UtcDateTime.AddDays(-30);

		// Act
		HttpResponseMessage response = await Client!.DeleteAsync(
			ApiEndpoints.Logs.CleanupWithDate(cutoffDate));

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
		HttpResponseMessage response = await Client!.DeleteAsync(ApiEndpoints.Logs.Cleanup);

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
		CreateLogRequest request = new()
		{
			LogLevel = "Error",
			Message = "Client-side error occurred",
			SourceContext = "TestComponent",
		};

		// Act
		HttpResponseMessage response = await Client!.PostAsJsonAsync(ApiEndpoints.Logs.Client, request);

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
		CreateLogRequest[] requests =
		[
			new CreateLogRequest { LogLevel = "Error", Message = "Batch error 1" },
			new CreateLogRequest { LogLevel = "Warning", Message = "Batch warning 2" },
		];

		// Act
		HttpResponseMessage response = await Client!.PostAsJsonAsync(ApiEndpoints.Logs.ClientBatch, requests);

		// Assert
		Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
	}

	/// <summary>
	/// Tests that DELETE /api/logs/{id} deletes a log and returns 204 No Content.
	/// </summary>
	[Fact]
	public async Task DeleteLogAsync_WithValidId_ReturnsNoContentAsync()
	{
		// Arrange - Create a log to delete
		FakeTimeProvider timeProvider = new();
		int logId;
		{
			using IServiceScope scope = SharedFactory.Services.CreateScope();
			ILogRepository logRepo =
				scope.ServiceProvider.GetRequiredService<ILogRepository>();

			Log log =
				await logRepo.CreateAsync(
					new Log
					{
						LogLevel = "Error",
						Message = "Test log for deletion",
						CreateDate = timeProvider.GetUtcNow().UtcDateTime,
						MachineName = "test",
						Environment = "Test",
					});

			logId = log.Id;
		} // Dispose scope to ensure transaction is committed

		// Act
		HttpResponseMessage response =
			await Client!.DeleteAsync(
				$"/api/v1/logs/{logId}");

		// Assert
		Assert.Equal(
			HttpStatusCode.NoContent,
			response.StatusCode);
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
		FakeTimeProvider timeProvider = new();
		using IServiceScope scope = SharedFactory.Services.CreateScope();
		ILogRepository logRepo = scope.ServiceProvider.GetRequiredService<ILogRepository>();

		Log log1 = await logRepo.CreateAsync(new Log
		{
			LogLevel = "Error",
			Message = "Batch delete test 1",
			CreateDate = timeProvider.GetUtcNow().UtcDateTime,
			MachineName = "test",
			Environment = "Test",
		});

		Log log2 = await logRepo.CreateAsync(new Log
		{
			LogLevel = "Warning",
			Message = "Batch delete test 2",
			CreateDate = timeProvider.GetUtcNow().UtcDateTime,
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

	private async Task AuthenticateAsAdminAsync()
	{
		FakeTimeProvider timeProvider = new();
		await TestUserHelper.CreateUserWithRolesAsync(
			SharedFactory.Services,
			$"admin_{TestId}",
			$"admin_{TestId}@example.com",
			["Admin"],
			timeProvider);

		LoginRequest request =
			new(
				UsernameOrEmail: $"admin_{TestId}",
				Password: TestUserHelper.TestPassword);

		HttpResponseMessage response =
			await Client!.PostAsJsonAsync(ApiEndpoints.Auth.Login, request);

		response.EnsureSuccessStatusCode();

		AuthResponse? authResponse =
			await response.Content.ReadFromJsonAsync<AuthResponse>();

		Client!.DefaultRequestHeaders.Authorization =
			new AuthenticationHeaderValue("Bearer", authResponse!.AccessToken);
	}
}
