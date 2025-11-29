// <copyright file="AuthRateLimitingTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using SeventySix.Identity;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Rate limiting tests for AuthController.
/// </summary>
/// <remarks>
/// Uses an isolated WebApplicationFactory per test to ensure rate limiting state is reset.
/// This is necessary because rate limiting uses in-memory state that persists across requests.
/// These tests are separated from AuthControllerTests to avoid polluting the shared factory's
/// rate limiting state for other tests.
/// Rate limits are configured via UseSetting: Login=5/min, Register=3/hour, Refresh=10/min.
/// </remarks>
[Collection("PostgreSQL")]
public class AuthRateLimitingTests(TestcontainersPostgreSqlFixture fixture)
	: ApiPostgreSqlTestBase<Program>(fixture), IAsyncLifetime
{
	private SharedWebApplicationFactory<Program>? IsolatedFactory;
	private HttpClient? Client;

	/// <inheritdoc/>
	public override async Task InitializeAsync()
	{
		// Clean up auth tables before each test
		await TruncateTablesAsync(TestTables.Identity);

		// Use isolated factory with strict rate limits for rate limiting tests
		// Each test gets a fresh factory with its own rate limiter state
		// UseSetting provides configuration at the host level, overriding appsettings
		IsolatedFactory =
			CreateIsolatedFactory(builder =>
			{
				builder.UseSetting("Auth:RateLimit:LoginAttemptsPerMinute", "5");
				builder.UseSetting("Auth:RateLimit:RegisterAttemptsPerHour", "3");
				builder.UseSetting("Auth:RateLimit:TokenRefreshPerMinute", "10");
			});
		Client = IsolatedFactory.CreateClient();
	}

	/// <inheritdoc/>
	public new Task DisposeAsync()
	{
		Client?.Dispose();
		IsolatedFactory?.Dispose();
		return Task.CompletedTask;
	}

	/// <summary>
	/// Tests that POST /auth/login returns 429 after exceeding rate limit.
	/// </summary>
	[Fact]
	public async Task LoginAsync_ExceedsRateLimit_ReturnsTooManyRequestsAsync()
	{
		// Arrange - Rate limit is 5 per minute
		LoginRequest request =
			new(
				UsernameOrEmail: "testuser",
				Password: "wrongpassword");

		// Act - Make 6 requests (limit is 5)
		List<HttpResponseMessage> responses = [];
		for (int i = 0; i < 6; i++)
		{
			HttpResponseMessage response =
				await Client!.PostAsJsonAsync("/api/v1/auth/login", request);
			responses.Add(response);
		}

		// Assert - First 5 should be 401 (invalid creds), 6th should be 429
		Assert.Equal(5, responses.Count(r => r.StatusCode == HttpStatusCode.Unauthorized));
		Assert.Single(responses, r => r.StatusCode == HttpStatusCode.TooManyRequests);
	}

	/// <summary>
	/// Tests that POST /auth/register returns 429 after exceeding rate limit.
	/// </summary>
	[Fact]
	public async Task RegisterAsync_ExceedsRateLimit_ReturnsTooManyRequestsAsync()
	{
		// Arrange - Rate limit is 3 per hour
		// Act - Make 4 requests (limit is 3)
		List<HttpResponseMessage> responses = [];
		for (int i = 0; i < 4; i++)
		{
			RegisterRequest request =
				new(
					Username: $"testuser{i}",
					Email: $"test{i}@example.com",
					Password: "Password123!",
					FullName: $"Test User {i}");

			HttpResponseMessage response =
				await Client!.PostAsJsonAsync("/api/v1/auth/register", request);
			responses.Add(response);
		}

		// Assert - First 3 should succeed (201), 4th should be 429
		Assert.Equal(3, responses.Count(r => r.StatusCode == HttpStatusCode.Created));
		Assert.Single(responses, r => r.StatusCode == HttpStatusCode.TooManyRequests);
	}

	/// <summary>
	/// Tests that rate limit response includes Retry-After header.
	/// </summary>
	[Fact]
	public async Task LoginAsync_RateLimitExceeded_IncludesRetryAfterHeaderAsync()
	{
		// Arrange
		LoginRequest request =
			new(
				UsernameOrEmail: "testuser",
				Password: "wrongpassword");

		// Act - Exceed limit
		HttpResponseMessage? rateLimitedResponse = null;
		for (int i = 0; i < 6; i++)
		{
			HttpResponseMessage response =
				await Client!.PostAsJsonAsync("/api/v1/auth/login", request);

			if (response.StatusCode == HttpStatusCode.TooManyRequests)
			{
				rateLimitedResponse = response;
				break;
			}
		}

		// Assert
		Assert.NotNull(rateLimitedResponse);
		Assert.True(rateLimitedResponse.Headers.Contains("Retry-After"));
	}
}