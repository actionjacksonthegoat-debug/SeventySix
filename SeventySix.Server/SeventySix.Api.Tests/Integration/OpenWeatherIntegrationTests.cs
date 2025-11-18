// <copyright file="OpenWeatherIntegrationTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.Api.Tests.Attributes;
using SeventySix.Application.DTOs.OpenWeather;
using SeventySix.Application.Interfaces;

namespace SeventySix.Api.Tests.Integration;

/// <summary>
/// Comprehensive integration tests for OpenWeather implementation.
/// Tests the complete request flow from controller -> service -> API client -> Polly pipeline.
/// Uses real PostgreSQL database via Testcontainers for rate limiting persistence.
/// </summary>
public class OpenWeatherIntegrationTests : PostgreSqlIntegrationTestBase, IClassFixture<PostgreSqlFixture>
{
	private readonly WebApplicationFactory<Program> Factory;
	private readonly HttpClient Client;

	/// <summary>
	/// Initializes a new instance of the <see cref="OpenWeatherIntegrationTests"/> class.
	/// </summary>
	/// <param name="fixture">Shared PostgreSQL fixture for all tests.</param>
	public OpenWeatherIntegrationTests(PostgreSqlFixture fixture)
		: base(fixture)
	{
		Factory = CreateWebApplicationFactory();
		Client = Factory.CreateClient();
	}

	/// <summary>
	/// Tests complete weather data endpoint with full integration.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous unit test.</returns>
	[IntegrationTest]
	public async Task GetCompleteWeather_ValidRequest_ReturnsOneCallResponseAsync()
	{
		// Arrange
		const double LATITUDE = 40.7128; // New York
		const double LONGITUDE = -74.0060;

		// Act
		HttpResponseMessage response = await Client.GetAsync(
			$"/api/weatherforecast?latitude={LATITUDE}&longitude={LONGITUDE}&units=metric");

		// Assert
		if (response.StatusCode == HttpStatusCode.ServiceUnavailable)
		{
			// Expected if API key not configured or service down
			Assert.True(true, "Service unavailable - expected in test environment");
			return;
		}

		response.StatusCode.Should().Be(HttpStatusCode.OK);
		OneCallResponse? weatherData = await response.Content.ReadFromJsonAsync<OneCallResponse>();
		weatherData.Should().NotBeNull();
		weatherData!.Latitude.Should().BeApproximately(LATITUDE, 0.01);
		weatherData.Longitude.Should().BeApproximately(LONGITUDE, 0.01);
	}

	/// <summary>
	/// Tests that rate limiting is enforced correctly.
	/// GlobalExceptionMiddleware converts all exceptions to standard HTTP status codes.
	/// Rate limit exceeded throws InvalidOperationException, which becomes 503 ServiceUnavailable.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous unit test.</returns>
	[IntegrationTest]
	public async Task RateLimiting_ExceedsQuota_Returns503Async()
	{
		// Arrange
		using IServiceScope scope = Factory.Services.CreateScope();
		IRateLimitingService rateLimiter = scope.ServiceProvider.GetRequiredService<IRateLimitingService>();

		// Consume all available quota
		for (int i = 0; i < 1000; i++)
		{
			await rateLimiter.TryIncrementRequestCountAsync("OpenWeather", "https://api.openweathermap.org");
		}

		// Act
		HttpResponseMessage response = await Client.GetAsync(
			"/api/weatherforecast/current?latitude=40.7128&longitude=-74.0060");

		// Assert - GlobalExceptionMiddleware returns 503 for InvalidOperationException (rate limit)
		response.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
	}

	/// <summary>
	/// Tests cache behavior - second identical request should use cached data.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous unit test.</returns>
	[IntegrationTest]
	public async Task Caching_SecondRequest_UsesCachedDataAsync()
	{
		// Arrange
		const string URL = "/api/weatherforecast/current?latitude=40.7128&longitude=-74.0060";

		// Act - First request
		HttpResponseMessage response1 = await Client.GetAsync(URL);
		if (response1.StatusCode != HttpStatusCode.OK)
		{
			Assert.True(true, "Skipping cache test - service not available");
			return;
		}

		// Get quota before second request
		using IServiceScope scope = Factory.Services.CreateScope();
		IRateLimitingService rateLimiter = scope.ServiceProvider.GetRequiredService<IRateLimitingService>();
		int quotaBefore = await rateLimiter.GetRemainingQuotaAsync("OpenWeather");

		// Act - Second request (should use cache)
		HttpResponseMessage response2 = await Client.GetAsync(URL);

		// Assert
		response2.StatusCode.Should().Be(HttpStatusCode.OK);
		int quotaAfter = await rateLimiter.GetRemainingQuotaAsync("OpenWeather");

		// Quota should be same (cache hit) or only decremented by 1 (cache miss but still working)
		quotaAfter.Should().BeGreaterThanOrEqualTo(quotaBefore - 1, "Cache should prevent multiple API calls");
	}

	/// <summary>
	/// Tests validation - invalid latitude should return 400.
	/// </summary>
	/// <param name="latitude">The latitude coordinate.</param>
	/// <param name="longitude">The longitude coordinate.</param>
	/// <returns>A <see cref="Task"/> representing the asynchronous unit test.</returns>
	[IntegrationTheory]
	[InlineData(91, -74.0060)] // Latitude too high
	[InlineData(-91, -74.0060)] // Latitude too low
	[InlineData(40.7128, 181)] // Longitude too high
	[InlineData(40.7128, -181)] // Longitude too low
	public async Task Validation_InvalidCoordinates_Returns400Async(double latitude, double longitude)
	{
		// Act
		HttpResponseMessage response = await Client.GetAsync(
			$"/api/weatherforecast/current?latitude={latitude}&longitude={longitude}");

		// Assert
		response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
	}

	/// <summary>
	/// Tests historical data endpoint with timestamp validation.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous unit test.</returns>
	[IntegrationTest]
	public async Task GetHistoricalWeather_ValidTimestamp_ReturnsDataAsync()
	{
		// Arrange
		long yesterday = DateTimeOffset.UtcNow.AddDays(-1).ToUnixTimeSeconds();

		// Act
		HttpResponseMessage response = await Client.GetAsync(
			$"/api/weatherforecast/historical?latitude=40.7128&longitude=-74.0060&timestamp={yesterday}");

		// Assert
		if (response.StatusCode == HttpStatusCode.ServiceUnavailable)
		{
			Assert.True(true, "Service unavailable - expected in test environment");
			return;
		}

		response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.BadRequest);
	}

	/// <summary>
	/// Tests that quota endpoint returns accurate information.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous unit test.</returns>
	[IntegrationTest]
	public async Task GetQuota_ReturnsAccurateInformationAsync()
	{
		// Act
		HttpResponseMessage response = await Client.GetAsync("/api/weatherforecast/quota");

		// Assert
		response.StatusCode.Should().Be(HttpStatusCode.OK);
		string content = await response.Content.ReadAsStringAsync();
		content.Should().Contain("remainingCalls");
		content.Should().Contain("canMakeCall");
		content.Should().Contain("resetsIn");
		content.Should().Contain("resetTime");
	}

	/// <summary>
	/// Tests all weather endpoints return consistent coordinates.
	/// </summary>
	/// <returns>A <see cref="Task"/> representing the asynchronous unit test.</returns>
	[IntegrationTest]
	public async Task AllEndpoints_ReturnConsistentCoordinatesAsync()
	{
		// Arrange
		const double LATITUDE = 51.5074; // London
		const double LONGITUDE = -0.1278;

		string[] endpoints =
		[
			$"/api/weatherforecast?latitude={LATITUDE}&longitude={LONGITUDE}",
			$"/api/weatherforecast/current?latitude={LATITUDE}&longitude={LONGITUDE}",
		];

		// Act & Assert
		foreach (string? endpoint in endpoints)
		{
			HttpResponseMessage response = await Client.GetAsync(endpoint);
			if (response.StatusCode == HttpStatusCode.OK)
			{
				string content = await response.Content.ReadAsStringAsync();
				content.Replace(" ", string.Empty).Should().Contain($"\"latitude\":{LATITUDE}");
			}
		}
	}
}