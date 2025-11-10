// <copyright file="WeatherForecastIntegrationTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using SeventySix.Application.DTOs;
using SeventySix.Application.DTOs.Requests;

namespace SeventySix.Api.Tests.Integration;

/// <summary>
/// Integration tests for WeatherForecast API endpoints.
/// Tests the full HTTP request/response cycle with in-memory test server.
/// </summary>
public class WeatherForecastIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
	private readonly WebApplicationFactory<Program> Factory;
	private readonly HttpClient Client;

	/// <summary>
	/// Initializes a new instance of the <see cref="WeatherForecastIntegrationTests"/> class.
	/// </summary>
	/// <param name="factory">Web application factory for creating test server.</param>
	public WeatherForecastIntegrationTests(WebApplicationFactory<Program> factory)
	{
		Factory = factory;
		Client = factory.CreateClient();
	}

	[Fact]
	public async Task GetAll_ReturnsSuccessStatusCodeAsync()
	{
		// Act
		var response = await Client.GetAsync("/api/WeatherForecast");

		// Assert
		response.EnsureSuccessStatusCode();
		response.StatusCode.Should().Be(HttpStatusCode.OK);
	}

	[Fact]
	public async Task GetAll_ReturnsJsonContentTypeAsync()
	{
		// Act
		var response = await Client.GetAsync("/api/WeatherForecast");

		// Assert
		response.Content.Headers.ContentType?.MediaType.Should().Be("application/json");
	}

	[Fact]
	public async Task GetAll_ReturnsArrayOfForecastsAsync()
	{
		// Act
		var forecasts = await Client.GetFromJsonAsync<WeatherForecastDto[]>("/api/WeatherForecast");

		// Assert
		forecasts.Should().NotBeNull();
		forecasts.Should().BeAssignableTo<IEnumerable<WeatherForecastDto>>();
	}

	[Fact]
	public async Task GetAll_IncludesCacheControlHeaderAsync()
	{
		// Act
		var response = await Client.GetAsync("/api/WeatherForecast");

		// Assert
		response.Headers.CacheControl.Should().NotBeNull();
		response.Headers.CacheControl!.MaxAge.Should().Be(TimeSpan.FromSeconds(60));
	}

	[Fact]
	public async Task GetById_WithValidId_ReturnsSuccessAsync()
	{
		// Arrange - First get all forecasts to find a valid ID
		var allForecasts = await Client.GetFromJsonAsync<WeatherForecastDto[]>("/api/WeatherForecast");
		if (allForecasts == null || allForecasts.Length == 0)
		{
			// Skip test if no forecasts available
			return;
		}

		var validId = allForecasts[0].Date.DayNumber;

		// Act
		var response = await Client.GetAsync($"/api/WeatherForecast/{validId}");

		// Assert
		response.EnsureSuccessStatusCode();
		response.StatusCode.Should().Be(HttpStatusCode.OK);

		var forecast = await response.Content.ReadFromJsonAsync<WeatherForecastDto>();
		forecast.Should().NotBeNull();
	}

	[Fact]
	public async Task GetById_WithInvalidId_ReturnsNotFoundAsync()
	{
		// Act
		var response = await Client.GetAsync("/api/WeatherForecast/999999");

		// Assert
		response.StatusCode.Should().Be(HttpStatusCode.NotFound);
	}

	[Fact]
	public async Task Create_WithValidRequest_ReturnsCreatedAsync()
	{
		// Arrange
		var request = new CreateWeatherForecastRequest
		{
			Date = new DateOnly(2025, 12, 25),
			TemperatureC = 15,
			Summary = "Mild"
		};

		// Act
		var response = await Client.PostAsJsonAsync("/api/WeatherForecast", request);

		// Assert
		response.StatusCode.Should().Be(HttpStatusCode.Created);
		response.Headers.Location.Should().NotBeNull();

		var forecast = await response.Content.ReadFromJsonAsync<WeatherForecastDto>();
		forecast.Should().NotBeNull();
		forecast!.Date.Should().Be(request.Date);
		forecast.TemperatureC.Should().Be(request.TemperatureC);
		forecast.Summary.Should().Be(request.Summary);
	}

	[Fact]
	public async Task Create_WithInvalidRequest_ReturnsBadRequestAsync()
	{
		// Arrange - Temperature out of valid range
		var request = new
		{
			Date = new DateOnly(2025, 12, 25),
			TemperatureC = 150, // Invalid: too hot
			Summary = "Impossible"
		};

		// Act
		var response = await Client.PostAsJsonAsync("/api/WeatherForecast", request);

		// Assert
		response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
	}

	[Fact]
	public async Task Create_WithMissingRequiredFields_ReturnsBadRequestAsync()
	{
		// Arrange - Missing required Date field
		var request = new
		{
			TemperatureC = 20,
			Summary = "Warm"
		};

		// Act
		var response = await Client.PostAsJsonAsync("/api/WeatherForecast", request);

		// Assert
		response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
	}

	[Fact]
	public async Task GetAll_SupportsMultipleRequestsAsync()
	{
		// Act - Make multiple concurrent requests
		var tasks = Enumerable.Range(0, 5).Select(_ => Client.GetAsync("/api/WeatherForecast"));
		var responses = await Task.WhenAll(tasks);

		// Assert - All should succeed
		responses.Should().AllSatisfy(r => r.StatusCode.Should().Be(HttpStatusCode.OK));
	}

	[Fact]
	public async Task Api_ReturnsConsistentDataFormatAsync()
	{
		// Act
		var response1 = await Client.GetFromJsonAsync<WeatherForecastDto[]>("/api/WeatherForecast");
		var response2 = await Client.GetFromJsonAsync<WeatherForecastDto[]>("/api/WeatherForecast");

		// Assert - Same request should return same data structure
		response1.Should().NotBeNull();
		response2.Should().NotBeNull();
		if (response1!.Length > 0 && response2!.Length > 0)
		{
			response1[0].Should().BeEquivalentTo(response2[0]);
		}
	}

	[Fact]
	public async Task GetAll_ReturnsValidWeatherForecastStructureAsync()
	{
		// Act
		var forecasts = await Client.GetFromJsonAsync<WeatherForecastDto[]>("/api/WeatherForecast");

		// Assert
		forecasts.Should().NotBeNull();
		if (forecasts!.Length > 0)
		{
			var forecast = forecasts[0];
			forecast.Date.Should().NotBe(default);
			forecast.TemperatureC.Should().BeInRange(-60, 60);
			forecast.TemperatureF.Should().BeGreaterThan(forecast.TemperatureC); // F > C for positive temps
			forecast.Summary.Should().NotBeNullOrWhiteSpace();
		}
	}
}