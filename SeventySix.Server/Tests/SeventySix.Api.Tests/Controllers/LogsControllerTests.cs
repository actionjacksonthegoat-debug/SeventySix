// <copyright file="LogsControllerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Time.Testing;
using SeventySix.Api.Tests.Fixtures;
using SeventySix.Identity;
using SeventySix.Logging;
using SeventySix.Shared.POCOs;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using SeventySix.TestUtilities.TestHelpers;
using Shouldly;

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
[Collection(CollectionNames.LoggingPostgreSql)]
public class LogsControllerTests(LoggingApiPostgreSqlFixture fixture)
	: ApiPostgreSqlTestBase<Program>(fixture),
		IAsyncLifetime
{
	private readonly string TestId =
		Guid.NewGuid().ToString("N")[..8];
	private HttpClient? Client;
	private ILogRepository? LogRepository;

	/// <inheritdoc/>
	public override async Task InitializeAsync()
	{
		// DO NOT call base.InitializeAsync() to avoid truncating logs
		// These tests expect logs from API requests to accumulate
		// Only truncate non-logging tables for isolation
		await TruncateTablesAsync([
			.. TestTables.ApiTracking,
			.. TestTables.Identity,
		]);

		// Use shared factory's client for better performance
		Client = CreateClient();

		// Create admin user and authenticate
		await AuthenticateAsAdminAsync();

		// Get repository to seed test data from shared factory
		using IServiceScope scope =
			SharedFactory.Services.CreateScope();
		LogRepository =
			scope.ServiceProvider.GetRequiredService<ILogRepository>();

		// Seed minimal test data needed for remaining tests
		FakeTimeProvider timeProvider = new();
		Log[] testLogs =
			[
			LogBuilder
				.CreateWarning(timeProvider)
				.WithMessage("Test warning message")
				.WithSourceContext("SeventySix.Api.Controllers.UsersController")
				.WithTimestamp(
					timeProvider.GetUtcNow().UtcDateTime.AddHours(-1))
				.Build(),
			LogBuilder
				.CreateError(timeProvider)
				.WithMessage("Test error message")
				.WithTimestamp(
					timeProvider.GetUtcNow().UtcDateTime.AddDays(-31)) // Older than 30 days for cleanup test
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
		HttpResponseMessage response =
			await Client!.GetAsync(
			ApiEndpoints.Logs.Base);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.OK);

		PagedResult<LogDto>? pagedResponse =
			await response.Content.ReadFromJsonAsync<PagedResult<LogDto>>();
		pagedResponse.ShouldNotBeNull();
		pagedResponse.Items.ShouldNotBeNull();
		pagedResponse.Items.Count.ShouldBeGreaterThanOrEqualTo(
			2,
			"Should return at least the 2 seeded logs");
	}

	/// <summary>
	/// Tests that GET /api/logs returns 400 when page size exceeds maximum.
	/// </summary>
	[Fact]
	public async Task GetPagedAsync_ExceedsMaxPageSize_ReturnsBadRequestAsync()
	{
		// Act
		HttpResponseMessage response =
			await Client!.GetAsync(
			$"{ApiEndpoints.Logs.Base}?pageSize=200");

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
	}

	/// <summary>
	/// Tests that DELETE /api/logs/cleanup removes old logs.
	/// </summary>
	[Fact]
	public async Task CleanupLogsAsync_WithCutoffDate_DeletesOldLogsAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		DateTime cutoffDate =
			timeProvider.GetUtcNow().UtcDateTime.AddDays(-30);

		// Act
		HttpResponseMessage response =
			await Client!.DeleteAsync(
			ApiEndpoints.Logs.CleanupWithDate(cutoffDate));

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.OK);

		int deletedCount =
			await response.Content.ReadFromJsonAsync<int>();
		deletedCount.ShouldBeGreaterThanOrEqualTo(
			1,
			"Should delete at least the 31-day-old log");
	}

	/// <summary>
	/// Tests that DELETE /api/logs/cleanup requires cutoff date parameter.
	/// </summary>
	[Fact]
	public async Task CleanupLogsAsync_NoCutoffDate_ReturnsBadRequestAsync()
	{
		// Act
		HttpResponseMessage response =
			await Client!.DeleteAsync(
			ApiEndpoints.Logs.Cleanup);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
	}

	/// <summary>
	/// Tests that POST /api/logs/client creates a client-side error log.
	/// </summary>
	[Fact]
	public async Task LogClientErrorAsync_WithValidRequest_ReturnsNoContentAsync()
	{
		// Arrange
		CreateLogRequest request =
			new()
			{
				LogLevel = "Error",
				Message = "Client-side error occurred",
				SourceContext = "TestComponent",
			};

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync(
			ApiEndpoints.Logs.Client,
			request);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.NoContent);
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
			new CreateLogRequest
			{
				LogLevel = "Error",
				Message = "Batch error 1",
			},
			new CreateLogRequest
			{
				LogLevel = "Warning",
				Message = "Batch warning 2",
			},
		];

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync(
			ApiEndpoints.Logs.ClientBatch,
			requests);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.NoContent);
	}

	/// <summary>
	/// Tests that DELETE /api/logs/{id} deletes a log and returns 204 No Content.
	/// </summary>
	[Fact]
	public async Task DeleteLogAsync_WithValidId_ReturnsNoContentAsync()
	{
		// Arrange - Create a log to delete
		FakeTimeProvider timeProvider = new();
		long logId;
		{
			using IServiceScope scope =
				SharedFactory.Services.CreateScope();
			ILogRepository logRepo =
				scope.ServiceProvider.GetRequiredService<ILogRepository>();

			Log log =
				await logRepo.CreateAsync(
				LogBuilder
					.CreateError(timeProvider)
					.WithMessage("Test log for deletion")
					.Build());

			logId = log.Id;
		} // Dispose scope to ensure transaction is committed

		// Act
		HttpResponseMessage response =
			await Client!.DeleteAsync(
			ApiEndpoints.Logs.ById(logId));

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.NoContent);
	}

	/// <summary>
	/// Tests that DELETE /api/logs/{id} returns 404 for non-existent log.
	/// </summary>
	[Fact]
	public async Task DeleteLogAsync_WithInvalidId_ReturnsNotFoundAsync()
	{
		// Act
		HttpResponseMessage response =
			await Client!.DeleteAsync(
			ApiEndpoints.Logs.ById(999999999));

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.NotFound);
	}

	/// <summary>
	/// Tests that DELETE /api/logs/batch deletes multiple logs and returns count.
	/// </summary>
	[Fact]
	public async Task DeleteLogBatchAsync_WithValidIds_ReturnsDeletedCountAsync()
	{
		// Arrange - Create logs to delete
		FakeTimeProvider timeProvider = new();
		using IServiceScope scope =
			SharedFactory.Services.CreateScope();
		ILogRepository logRepo =
			scope.ServiceProvider.GetRequiredService<ILogRepository>();

		Log log1 =
			await logRepo.CreateAsync(
			LogBuilder
				.CreateError(timeProvider)
				.WithMessage("Batch delete test 1")
				.Build());

		Log log2 =
			await logRepo.CreateAsync(
			LogBuilder
				.CreateWarning(timeProvider)
				.WithMessage("Batch delete test 2")
				.Build());

		long[] idsToDelete =
			[log1.Id, log2.Id];

		// Act
		HttpRequestMessage deleteRequest =
			new(
			HttpMethod.Delete,
			ApiEndpoints.Logs.Batch)
			{
				Content =
					JsonContent.Create(idsToDelete),
			};
		HttpResponseMessage response =
			await Client!.SendAsync(deleteRequest);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.OK);

		int deletedCount =
			await response.Content.ReadFromJsonAsync<int>();
		deletedCount.ShouldBe(2);
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
		HttpRequestMessage deleteRequest =
			new(
			HttpMethod.Delete,
			ApiEndpoints.Logs.Batch)
			{
				Content =
					JsonContent.Create(emptyIds),
			};
		HttpResponseMessage response =
			await Client!.SendAsync(deleteRequest);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
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
			await Client!.PostAsJsonAsync(
			ApiEndpoints.Auth.Login,
			request);

		response.EnsureSuccessStatusCode();

		AuthResponse? authResponse =
			await response.Content.ReadFromJsonAsync<AuthResponse>();

		Client!.DefaultRequestHeaders.Authorization =
			new AuthenticationHeaderValue(
			"Bearer",
			authResponse!.AccessToken);
	}
}