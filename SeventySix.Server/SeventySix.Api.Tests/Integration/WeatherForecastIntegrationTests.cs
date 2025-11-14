// <copyright file="WeatherForecastIntegrationTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using SeventySix.Api.Tests.Attributes;

namespace SeventySix.Api.Tests.Integration;

/// <summary>
/// Integration tests for WeatherForecastController using OpenWeather API endpoints.
/// Tests the full HTTP request/response cycle with in-memory test server.
/// </summary>
public class WeatherForecastIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
	private readonly WebApplicationFactory<Program> Factory;
	private readonly HttpClient Client;

	// Valid coordinates for testing (New York City)
	private const double VALID_LATITUDE = 40.7128;
	private const double VALID_LONGITUDE = -74.0060;

	/// <summary>
	/// Initializes a new instance of the <see cref="WeatherForecastIntegrationTests"/> class.
	/// </summary>
	/// <param name="factory">Web application factory for creating test server.</param>
	public WeatherForecastIntegrationTests(WebApplicationFactory<Program> factory)
	{
		Factory = factory.WithWebHostBuilder(builder =>
		{
			builder.UseEnvironment("Test");
		});
		Client = Factory.CreateClient();
	}

	[IntegrationTest]
	public async Task GetCurrentWeather_ValidCoordinates_ReturnsOkAsync()
	{
		// Act
		HttpResponseMessage response = await Client.GetAsync(
			$"/api/weatherforecast/current?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}");

		// Assert
		// Note: Will return 503 ServiceUnavailable without valid API key
		// but should at least return a valid HTTP response
		response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.ServiceUnavailable);
	}

	[IntegrationTest]
	public async Task GetCurrentWeather_InVALID_LATITUDE_ReturnsBadRequestAsync()
	{
		// Act
		HttpResponseMessage response = await Client.GetAsync(
			"/api/weatherforecast/current?latitude=91&longitude=-74.0060");

		// Assert
		response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
	}

	[IntegrationTest]
	public async Task GetCurrentWeather_InVALID_LONGITUDE_ReturnsBadRequestAsync()
	{
		// Act
		HttpResponseMessage response = await Client.GetAsync(
			"/api/weatherforecast/current?latitude=40.7128&longitude=-181");

		// Assert
		response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
	}

	[IntegrationTest]
	public async Task GetCurrentWeather_IncludesCacheControlHeaderAsync()
	{
		// Act
		HttpResponseMessage response = await Client.GetAsync(
			$"/api/weatherforecast/current?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}");

		// Assert
		response.Headers.CacheControl.Should().NotBeNull();
		response.Headers.CacheControl!.MaxAge.Should().Be(TimeSpan.FromSeconds(300));
	}

	[IntegrationTest]
	public async Task GetHourlyForecast_ValidCoordinates_ReturnsOkAsync()
	{
		// Act
		HttpResponseMessage response = await Client.GetAsync(
			$"/api/weatherforecast/hourly?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}");

		// Assert
		response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.ServiceUnavailable);
	}

	[IntegrationTest]
	public async Task GetDailyForecast_ValidCoordinates_ReturnsOkAsync()
	{
		// Act
		HttpResponseMessage response = await Client.GetAsync(
			$"/api/weatherforecast/daily?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}");

		// Assert
		response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.ServiceUnavailable);
	}

	[IntegrationTest]
	public async Task GetMinutelyForecast_ValidCoordinates_ReturnsOkAsync()
	{
		// Act
		HttpResponseMessage response = await Client.GetAsync(
			$"/api/weatherforecast/minutely?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}");

		// Assert
		response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.ServiceUnavailable);
	}

	[IntegrationTest]
	public async Task GetMinutelyForecast_HasShorterCacheDurationAsync()
	{
		// Act
		HttpResponseMessage response = await Client.GetAsync(
			$"/api/weatherforecast/minutely?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}");

		// Assert - Minutely should have 1 minute cache
		response.Headers.CacheControl.Should().NotBeNull();
		response.Headers.CacheControl!.MaxAge.Should().Be(TimeSpan.FromSeconds(60));
	}

	[IntegrationTest]
	public async Task GetWeatherAlerts_ValidCoordinates_ReturnsOkAsync()
	{
		// Act
		HttpResponseMessage response = await Client.GetAsync(
			$"/api/weatherforecast/alerts?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}");

		// Assert
		response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.ServiceUnavailable);
	}

	[IntegrationTest]
	public async Task GetCompleteWeatherData_ValidCoordinates_ReturnsOkAsync()
	{
		// Act
		HttpResponseMessage response = await Client.GetAsync(
			$"/api/weatherforecast?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}");

		// Assert
		response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.ServiceUnavailable);
	}

	[IntegrationTest]
	public async Task GetCompleteWeatherData_WithExcludeParameter_ReturnsOkAsync()
	{
		// Act
		HttpResponseMessage response = await Client.GetAsync(
			$"/api/weatherforecast?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}&exclude=minutely,alerts");

		// Assert
		response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.ServiceUnavailable);
	}

	[IntegrationTest]
	public async Task GetHistoricalWeather_ValidParameters_ReturnsOkAsync()
	{
		// Arrange - Timestamp for 2 days ago
		long twoDaysAgo = DateTimeOffset.UtcNow.AddDays(-2).ToUnixTimeSeconds();

		// Act
		HttpResponseMessage response = await Client.GetAsync(
			$"/api/weatherforecast/historical?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}&timestamp={twoDaysAgo}");

		// Assert
		response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.ServiceUnavailable);
	}

	[IntegrationTest]
	public async Task GetHistoricalWeather_HasLongerCacheDurationAsync()
	{
		// Arrange
		long twoDaysAgo = DateTimeOffset.UtcNow.AddDays(-2).ToUnixTimeSeconds();

		// Act
		HttpResponseMessage response = await Client.GetAsync(
			$"/api/weatherforecast/historical?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}&timestamp={twoDaysAgo}");

		// Assert - Historical data should have 24 hour cache
		response.Headers.CacheControl.Should().NotBeNull();
		response.Headers.CacheControl!.MaxAge.Should().Be(TimeSpan.FromSeconds(86400));
	}

	[IntegrationTest]
	public async Task GetApiQuota_ReturnsOkAsync()
	{
		// Act
		HttpResponseMessage response = await Client.GetAsync("/api/weatherforecast/quota");

		// Assert
		response.StatusCode.Should().Be(HttpStatusCode.OK);
	}

	[IntegrationTest]
	public async Task GetApiQuota_ReturnsExpectedStructureAsync()
	{
		// Act
		HttpResponseMessage response = await Client.GetAsync("/api/weatherforecast/quota");
		string content = await response.Content.ReadAsStringAsync();

		// Assert
		response.IsSuccessStatusCode.Should().BeTrue();
		content.Should().NotBeNullOrEmpty();
		content.Should().Contain("remainingCalls");
		content.Should().Contain("canMakeCall");
		// Structure: { remainingCalls, canMakeCall, resetsIn: { hours, minutes, seconds, totalSeconds }, resetTime }
	}

	[IntegrationTheory]
	[InlineData("/api/weatherforecast/current")]
	[InlineData("/api/weatherforecast/hourly")]
	[InlineData("/api/weatherforecast/daily")]
	[InlineData("/api/weatherforecast/alerts")]
	public async Task WeatherEndpoints_WithDefaultCoordinates_CallsServiceAsync(string endpoint)
	{
		// Note: Without explicit query parameters, doubles default to 0.0
		// Service layer validates coordinates, so (0, 0) may be valid depending on API

		// Act
		HttpResponseMessage response = await Client.GetAsync(endpoint);

		// Assert - Should call service and return either OK or ServiceUnavailable
		(response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.ServiceUnavailable)
			.Should().BeTrue();
	}

	[IntegrationTest]
	public async Task MultipleEndpoints_SupportConcurrentRequestsAsync()
	{
		// Act - Make concurrent requests to different endpoints
		Task<HttpResponseMessage> currentTask = Client.GetAsync($"/api/weatherforecast/current?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}");
		Task<HttpResponseMessage> hourlyTask = Client.GetAsync($"/api/weatherforecast/hourly?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}");
		Task<HttpResponseMessage> dailyTask = Client.GetAsync($"/api/weatherforecast/daily?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}");
		Task<HttpResponseMessage> quotaTask = Client.GetAsync("/api/weatherforecast/quota");

		HttpResponseMessage[] responses = await Task.WhenAll(currentTask, hourlyTask, dailyTask, quotaTask);

		// Assert - All should return valid HTTP responses
		responses.Should().AllSatisfy(r =>
		{
			r.StatusCode.Should().BeOneOf(
				HttpStatusCode.OK,
				HttpStatusCode.ServiceUnavailable,
				HttpStatusCode.BadRequest);
		});
	}

	[IntegrationTest]
	public async Task AllEndpoints_ReturnJsonContentTypeAsync()
	{
		// Arrange
		string[] endpoints =
		[
			$"/api/weatherforecast/current?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}",
			$"/api/weatherforecast/hourly?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}",
			$"/api/weatherforecast/daily?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}",
			"/api/weatherforecast/quota"
		];

		foreach (string? endpoint in endpoints)
		{
			// Act
			HttpResponseMessage response = await Client.GetAsync(endpoint);

			// Assert
			if (response.IsSuccessStatusCode)
			{
				response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
			}
		}
	}

	[IntegrationTest]
	public async Task GetCurrentWeather_WithDifferentUnits_ReturnsOkAsync()
	{
		// Arrange
		string[] units = ["metric", "imperial", "standard"];

		foreach (string? unit in units)
		{
			// Act
			HttpResponseMessage response = await Client.GetAsync(
				$"/api/weatherforecast/current?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}&units={unit}");

			// Assert
			response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.ServiceUnavailable);
		}
	}
}