// <copyright file="AltchaControllerRateLimitTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using SeventySix.Api.Tests.Fixtures;
using SeventySix.Identity;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.Mocks;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Rate limiting tests for AltchaController.
/// </summary>
/// <remarks>
/// Uses an isolated WebApplicationFactory per test to ensure rate limiting state is reset.
/// This is necessary because rate limiting uses in-memory state that persists across requests.
/// Rate limit is configured via ConfigureAppConfiguration: AltchaChallenge=10/min.
/// </remarks>
[Collection(CollectionNames.IdentityAuthPostgreSql)]
public class AltchaControllerRateLimitTests(IdentityAuthApiPostgreSqlFixture fixture)
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
		// Mock IAltchaService - we're testing rate limiting, not ALTCHA functionality
		// UseSetting provides configuration at the host level, overriding appsettings
		IsolatedFactory =
			CreateIsolatedFactory(
				webHostBuilder =>
				{
					webHostBuilder.UseSetting(
						"RateLimiting:Enabled",
						"true");
					webHostBuilder.UseSetting(
						"Auth:RateLimit:AltchaChallengePerMinute",
						"10");
				},
				serviceCollection =>
				{
					// Replace IAltchaService with mock - we're testing rate limiting, not ALTCHA
					serviceCollection.RemoveAll<IAltchaService>();
					serviceCollection.AddSingleton(
						IdentityMockFactory.CreateAltchaService());
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
	/// Tests that GET /altcha/challenge returns 429 after exceeding rate limit.
	/// </summary>
	[Fact]
	public async Task GetChallenge_ExceedsRateLimit_Returns429Async()
	{
		// Arrange - Rate limit is 10 per minute
		const int rateLimit = 10;

		// Act - Make 11 requests (limit is 10)
		List<HttpResponseMessage> responses = [];
		for (int requestIndex = 0; requestIndex <= rateLimit; requestIndex++)
		{
			HttpResponseMessage response =
				await HttpClient!.GetAsync(ApiEndpoints.Altcha.Challenge);
			responses.Add(response);
		}

		// Assert - Should have at least one rate-limited response
		int successCount =
			responses.Count(response => response.StatusCode == HttpStatusCode.OK);
		int rateLimitedCount =
			responses.Count(response => response.StatusCode == HttpStatusCode.TooManyRequests);

		(successCount >= 1).ShouldBeTrue(
			$"Expected at least 1 successful response, but got {successCount}. "
			+ $"Status codes: {string.Join(
				", ",
				responses.Select(response => response.StatusCode))}");
		(rateLimitedCount >= 1).ShouldBeTrue(
			$"Expected at least 1 rate-limited response, but got {rateLimitedCount}. "
			+ $"Status codes: {string.Join(
				", ",
				responses.Select(response => response.StatusCode))}");
	}

	/// <summary>
	/// Tests that rate limit response includes Retry-After header.
	/// </summary>
	[Fact]
	public async Task GetChallenge_RateLimitExceeded_IncludesRetryAfterHeaderAsync()
	{
		// Arrange - Rate limit is 10 per minute
		const int rateLimit = 10;

		// Act - Exceed limit
		HttpResponseMessage? rateLimitedResponse = null;
		for (int requestIndex = 0; requestIndex <= rateLimit; requestIndex++)
		{
			HttpResponseMessage response =
				await HttpClient!.GetAsync(ApiEndpoints.Altcha.Challenge);

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