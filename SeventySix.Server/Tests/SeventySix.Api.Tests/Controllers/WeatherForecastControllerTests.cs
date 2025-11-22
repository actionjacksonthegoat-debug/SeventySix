// <copyright file="WeatherForecastControllerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using SeventySix.BusinessLogic.Interfaces;
using SeventySix.TestUtilities.TestBases;
using SeventySix.TestUtilities.TestHelpers;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Tests for WeatherForecastController.
/// Uses TestContainers with PostgreSQL for database operations.
/// Mocks external dependencies (OpenWeather API client).
/// </summary>
public class WeatherForecastControllerTests : ApiPostgreSqlTestBase<Program>, IClassFixture<LocalPostgreSqlFixture>
{
	private readonly Mock<IOpenWeatherApiClient> MockApiClient;

	// Valid coordinates for testing (New York City)
	private const double VALID_LATITUDE = 40.7128;
	private const double VALID_LONGITUDE = -74.0060;

	/// <summary>
	/// Initializes a new instance of the <see cref="WeatherForecastControllerTests"/> class.
	/// </summary>
	/// <param name="fixture">The shared PostgreSQL fixture.</param>
	public WeatherForecastControllerTests(LocalPostgreSqlFixture fixture)
		: base(fixture)
	{
		MockApiClient = OpenWeatherMockHelper.CreateMockClient();
	}

	private WebApplicationFactory<Program> CreateFactory()
	{
		return CreateWebApplicationFactory()
			.WithWebHostBuilder(builder =>
			{
				builder.UseEnvironment("Test");
				builder.ConfigureTestServices(services =>
				{
					// Replace real OpenWeather client with mock
					ServiceDescriptor? descriptor = services.SingleOrDefault(
						d => d.ServiceType == typeof(IOpenWeatherApiClient));

					if (descriptor != null)
					{
						services.Remove(descriptor);
					}

					services.AddScoped<IOpenWeatherApiClient>(_ => MockApiClient.Object);
				});
			});
	}

	[Fact]
	public async Task GetCurrentWeather_ValidCoordinates_ReturnsOkAsync()
	{
		// Arrange
		await using WebApplicationFactory<Program> factory = CreateFactory();
		using HttpClient client = factory.CreateClient();

		// Act
		HttpResponseMessage response = await client.GetAsync(
			$"/api/v1/weather/current?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}");

		// Assert
		response.StatusCode.Should().Be(HttpStatusCode.OK);
	}

	[Fact]
	public async Task GetCurrentWeather_InvalidLatitude_ReturnsBadRequestAsync()
	{
		// Arrange
		await using WebApplicationFactory<Program> factory = CreateFactory();
		using HttpClient client = factory.CreateClient();

		// Act
		HttpResponseMessage response = await client.GetAsync(
			"/api/v1/weather/current?latitude=91&longitude=-74.0060");

		// Assert
		response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
	}

	[Fact]
	public async Task GetCurrentWeather_InvalidLongitude_ReturnsBadRequestAsync()
	{
		// Arrange
		await using WebApplicationFactory<Program> factory = CreateFactory();
		using HttpClient client = factory.CreateClient();

		// Act
		HttpResponseMessage response = await client.GetAsync(
			"/api/v1/weather/current?latitude=40.7128&longitude=-181");

		// Assert
		response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
	}

	[Fact]
	public async Task GetCurrentWeather_IncludesCacheControlHeaderAsync()
	{
		// Arrange
		await using WebApplicationFactory<Program> factory = CreateFactory();
		using HttpClient client = factory.CreateClient();

		// Act
		HttpResponseMessage response = await client.GetAsync(
			$"/api/v1/weather/current?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}");

		// Assert
		response.Headers.CacheControl.Should().NotBeNull();
		response.Headers.CacheControl!.MaxAge.Should().Be(TimeSpan.FromSeconds(300));
	}

	[Fact]
	public async Task GetHourlyForecast_ValidCoordinates_ReturnsOkAsync()
	{
		// Arrange
		await using WebApplicationFactory<Program> factory = CreateFactory();
		using HttpClient client = factory.CreateClient();

		// Act
		HttpResponseMessage response = await client.GetAsync(
			$"/api/v1/weather/hourly?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}");

		// Assert
		response.StatusCode.Should().Be(HttpStatusCode.OK);
	}

	[Fact]
	public async Task GetDailyForecast_ValidCoordinates_ReturnsOkAsync()
	{
		// Arrange
		await using WebApplicationFactory<Program> factory = CreateFactory();
		using HttpClient client = factory.CreateClient();

		// Act
		HttpResponseMessage response = await client.GetAsync(
			$"/api/v1/weather/daily?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}");

		// Assert
		response.StatusCode.Should().Be(HttpStatusCode.OK);
	}

	[Fact]
	public async Task GetMinutelyForecast_ValidCoordinates_ReturnsOkAsync()
	{
		// Arrange
		await using WebApplicationFactory<Program> factory = CreateFactory();
		using HttpClient client = factory.CreateClient();

		// Act
		HttpResponseMessage response = await client.GetAsync(
			$"/api/v1/weather/minutely?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}");

		// Assert
		response.StatusCode.Should().Be(HttpStatusCode.OK);
	}

	[Fact]
	public async Task GetMinutelyForecast_HasShorterCacheDurationAsync()
	{
		// Arrange
		await using WebApplicationFactory<Program> factory = CreateFactory();
		using HttpClient client = factory.CreateClient();

		// Act
		HttpResponseMessage response = await client.GetAsync(
			$"/api/v1/weather/minutely?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}");

		// Assert
		response.Headers.CacheControl.Should().NotBeNull();
		response.Headers.CacheControl!.MaxAge.Should().Be(TimeSpan.FromSeconds(60));
	}

	[Fact]
	public async Task GetWeatherAlerts_ValidCoordinates_ReturnsOkAsync()
	{
		// Arrange
		await using WebApplicationFactory<Program> factory = CreateFactory();
		using HttpClient client = factory.CreateClient();

		// Act
		HttpResponseMessage response = await client.GetAsync(
			$"/api/v1/weather/alerts?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}");

		// Assert
		response.StatusCode.Should().Be(HttpStatusCode.OK);
	}

	[Fact]
	public async Task GetCompleteWeatherData_ValidCoordinates_ReturnsOkAsync()
	{
		// Arrange
		await using WebApplicationFactory<Program> factory = CreateFactory();
		using HttpClient client = factory.CreateClient();

		// Act
		HttpResponseMessage response = await client.GetAsync(
			$"/api/v1/weather?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}");

		// Assert
		response.StatusCode.Should().Be(HttpStatusCode.OK);
	}

	[Fact]
	public async Task GetCompleteWeatherData_WithExcludeParameter_ReturnsOkAsync()
	{
		// Arrange
		await using WebApplicationFactory<Program> factory = CreateFactory();
		using HttpClient client = factory.CreateClient();

		// Act
		HttpResponseMessage response = await client.GetAsync(
			$"/api/v1/weather?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}&exclude=minutely,alerts");

		// Assert
		response.StatusCode.Should().Be(HttpStatusCode.OK);
	}

	[Fact]
	public async Task GetHistoricalWeather_ValidParameters_ReturnsOkAsync()
	{
		// Arrange
		long twoDaysAgo = DateTimeOffset.UtcNow.AddDays(-2).ToUnixTimeSeconds();
		await using WebApplicationFactory<Program> factory = CreateFactory();
		using HttpClient client = factory.CreateClient();

		// Act
		HttpResponseMessage response = await client.GetAsync(
			$"/api/v1/weather/historical?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}&timestamp={twoDaysAgo}");

		// Assert
		response.StatusCode.Should().Be(HttpStatusCode.OK);
	}

	[Fact]
	public async Task GetHistoricalWeather_HasLongerCacheDurationAsync()
	{
		// Arrange
		long twoDaysAgo = DateTimeOffset.UtcNow.AddDays(-2).ToUnixTimeSeconds();
		await using WebApplicationFactory<Program> factory = CreateFactory();
		using HttpClient client = factory.CreateClient();

		// Act
		HttpResponseMessage response = await client.GetAsync(
			$"/api/v1/weather/historical?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}&timestamp={twoDaysAgo}");

		// Assert
		response.Headers.CacheControl.Should().NotBeNull();
		response.Headers.CacheControl!.MaxAge.Should().Be(TimeSpan.FromSeconds(86400));
	}

	[Fact]
	public async Task GetApiQuota_ReturnsOkAsync()
	{
		// Arrange
		await using WebApplicationFactory<Program> factory = CreateFactory();
		using HttpClient client = factory.CreateClient();

		// Act
		HttpResponseMessage response = await client.GetAsync("/api/v1/weather/quota");

		// Assert
		response.StatusCode.Should().Be(HttpStatusCode.OK);
	}

	[Fact]
	public async Task GetApiQuota_ReturnsExpectedStructureAsync()
	{
		// Arrange
		await using WebApplicationFactory<Program> factory = CreateFactory();
		using HttpClient client = factory.CreateClient();

		// Act
		HttpResponseMessage response = await client.GetAsync("/api/v1/weather/quota");
		string content = await response.Content.ReadAsStringAsync();

		// Assert
		response.IsSuccessStatusCode.Should().BeTrue();
		content.Should().NotBeNullOrEmpty();
		content.Should().Contain("remainingCalls");
		content.Should().Contain("canMakeCall");
	}

	[Theory]
	[InlineData("/api/v1/weather/current")]
	[InlineData("/api/v1/weather/hourly")]
	[InlineData("/api/v1/weather/daily")]
	[InlineData("/api/v1/weather/alerts")]
	public async Task WeatherEndpoints_WithDefaultCoordinates_CallsServiceAsync(string endpoint)
	{
		// Arrange
		await using WebApplicationFactory<Program> factory = CreateFactory();
		using HttpClient client = factory.CreateClient();

		// Act
		HttpResponseMessage response = await client.GetAsync(endpoint);

		// Assert
		response.StatusCode.Should().Be(HttpStatusCode.OK);
	}

	[Fact]
	public async Task MultipleEndpoints_SupportConcurrentRequestsAsync()
	{
		// Arrange
		await using WebApplicationFactory<Program> factory = CreateFactory();
		using HttpClient client = factory.CreateClient();

		// Act
		Task<HttpResponseMessage> currentTask = client.GetAsync($"/api/v1/weather/current?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}");
		Task<HttpResponseMessage> hourlyTask = client.GetAsync($"/api/v1/weather/hourly?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}");
		Task<HttpResponseMessage> dailyTask = client.GetAsync($"/api/v1/weather/daily?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}");
		Task<HttpResponseMessage> quotaTask = client.GetAsync("/api/v1/weather/quota");

		HttpResponseMessage[] responses = await Task.WhenAll(currentTask, hourlyTask, dailyTask, quotaTask);

		// Assert
		responses.Should().AllSatisfy(r =>
		{
			r.StatusCode.Should().BeOneOf(
				HttpStatusCode.OK,
				HttpStatusCode.BadRequest);
		});
	}

	[Fact]
	public async Task AllEndpoints_ReturnJsonContentTypeAsync()
	{
		// Arrange
		await using WebApplicationFactory<Program> factory = CreateFactory();
		using HttpClient client = factory.CreateClient();

		string[] endpoints =
		[
			$"/api/v1/weather/current?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}",
			$"/api/v1/weather/hourly?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}",
			$"/api/v1/weather/daily?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}",
			"/api/v1/weather/quota"
		];

		foreach (string endpoint in endpoints)
		{
			// Act
			HttpResponseMessage response = await client.GetAsync(endpoint);

			// Assert
			if (response.IsSuccessStatusCode)
			{
				response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
			}
		}
	}

	[Fact]
	public async Task GetCurrentWeather_WithDifferentUnits_ReturnsOkAsync()
	{
		// Arrange
		await using WebApplicationFactory<Program> factory = CreateFactory();
		using HttpClient client = factory.CreateClient();

		string[] units = ["metric", "imperial", "standard"];

		foreach (string unit in units)
		{
			// Act
			HttpResponseMessage response = await client.GetAsync(
				$"/api/v1/weather/current?latitude={VALID_LATITUDE}&longitude={VALID_LONGITUDE}&units={unit}");

			// Assert
			response.StatusCode.Should().Be(HttpStatusCode.OK);
		}
	}
}