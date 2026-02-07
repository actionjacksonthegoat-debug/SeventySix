// <copyright file="LogsControllerRateLimitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Net.Http.Json;
using SeventySix.Api.Tests.Fixtures;
using SeventySix.Logging;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Rate limiting tests for LogsController client log endpoints.
/// </summary>
/// <remarks>
/// Uses an isolated WebApplicationFactory per test to ensure rate limiting state is reset.
/// This is necessary because rate limiting uses in-memory state that persists across requests.
/// Rate limit is configured via UseSetting: ClientLogs=30/min.
/// </remarks>
[Collection(CollectionNames.LoggingPostgreSql)]
public class LogsControllerRateLimitTests(LoggingApiPostgreSqlFixture fixture)
	: ApiPostgreSqlTestBase<Program>(fixture),
		IAsyncLifetime
{
	private SharedWebApplicationFactory<Program>? IsolatedFactory;
	private HttpClient? HttpClient;

	/// <inheritdoc/>
	public override async Task InitializeAsync()
	{
		await Task.CompletedTask;

		// Use isolated factory with strict rate limits for rate limiting tests
		// Each test gets a fresh factory with its own rate limiter state
		IsolatedFactory =
			CreateIsolatedFactory(
				builder =>
				{
					builder.UseSetting(
						"RateLimiting:Enabled",
						"true");
					builder.UseSetting(
						"Auth:RateLimit:ClientLogsPerMinute",
						"5");
				});
		HttpClient =
			IsolatedFactory.CreateClient();
	}

	/// <inheritdoc/>
	public new Task DisposeAsync()
	{
		HttpClient?.Dispose();
		IsolatedFactory?.Dispose();
		return Task.CompletedTask;
	}

	/// <summary>
	/// Tests that POST /logs/client returns 429 after exceeding rate limit.
	/// </summary>
	[Fact]
	public async Task LogClientError_ExceedsRateLimit_Returns429Async()
	{
		// Arrange - Rate limit is 5 per minute for this test
		const int rateLimit = 5;
		CreateLogRequest logRequest =
			new()
			{
				LogLevel = "Error",
				Message = "Test client error"
			};

		// Act - Make 6 requests (limit is 5)
		List<HttpResponseMessage> responses = [];
		for (int requestIndex = 0; requestIndex <= rateLimit; requestIndex++)
		{
			HttpResponseMessage response =
				await HttpClient!.PostAsJsonAsync(
					ApiEndpoints.Logs.Client,
					logRequest);
			responses.Add(response);
		}

		// Assert - First 5 should succeed (204), 6th should be 429
		responses.Count(response => response.StatusCode == HttpStatusCode.NoContent)
			.ShouldBe(rateLimit);
		responses.ShouldContain(
			response => response.StatusCode == HttpStatusCode.TooManyRequests);
	}

	/// <summary>
	/// Tests that POST /logs/client/batch returns 429 after exceeding rate limit.
	/// </summary>
	[Fact]
	public async Task LogClientErrorBatch_ExceedsRateLimit_Returns429Async()
	{
		// Arrange - Rate limit is 5 per minute for this test
		const int rateLimit = 5;
		CreateLogRequest[] batchRequest =
			[
				new()
				{
					LogLevel = "Error",
					Message = "Test client error"
				}
			];

		// Act - Make 6 requests (limit is 5)
		List<HttpResponseMessage> responses = [];
		for (int requestIndex = 0; requestIndex <= rateLimit; requestIndex++)
		{
			HttpResponseMessage response =
				await HttpClient!.PostAsJsonAsync(
					ApiEndpoints.Logs.ClientBatch,
					batchRequest);
			responses.Add(response);
		}

		// Assert - First 5 should succeed (204), 6th should be 429
		responses.Count(response => response.StatusCode == HttpStatusCode.NoContent)
			.ShouldBe(rateLimit);
		responses.ShouldContain(
			response => response.StatusCode == HttpStatusCode.TooManyRequests);
	}

	/// <summary>
	/// Tests that rate limit response includes Retry-After header.
	/// </summary>
	[Fact]
	public async Task LogClientError_RateLimitExceeded_IncludesRetryAfterHeaderAsync()
	{
		// Arrange - Rate limit is 5 per minute for this test
		const int rateLimit = 5;
		CreateLogRequest logRequest =
			new()
			{
				LogLevel = "Error",
				Message = "Test client error"
			};

		// Act - Exceed limit
		HttpResponseMessage? rateLimitedResponse = null;
		for (int requestIndex = 0; requestIndex <= rateLimit; requestIndex++)
		{
			HttpResponseMessage response =
				await HttpClient!.PostAsJsonAsync(
					ApiEndpoints.Logs.Client,
					logRequest);

			if (response.StatusCode == HttpStatusCode.TooManyRequests)
			{
				rateLimitedResponse = response;
				break;
			}
		}

		// Assert
		rateLimitedResponse.ShouldNotBeNull();
		rateLimitedResponse.Headers.Contains("Retry-After").ShouldBeTrue();
	}
}