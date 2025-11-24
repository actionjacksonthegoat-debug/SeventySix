// <copyright file="HealthCheckTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using SeventySix.TestUtilities.TestBases;

namespace SeventySix.Api.Tests.Integration;

/// <summary>
/// Integration tests for the /health endpoint.
/// Tests the built-in ASP.NET Core health check endpoint.
/// </summary>
[Collection("PostgreSQL")]
public class HealthCheckTests(LocalPostgreSqlFixture fixture) : ApiPostgreSqlTestBase<Program>(fixture), IAsyncLifetime
{
	[Fact]
	public async Task HealthEndpoint_ReturnsHealthy_WhenDatabaseConnectedAsync()
	{
		// Arrange
		using WebApplicationFactory<Program> factory = CreateWebApplicationFactory();
		using HttpClient client = factory.CreateClient();

		// Act
		HttpResponseMessage response = await client.GetAsync("/health");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		string content = await response.Content.ReadAsStringAsync();
		Assert.Contains("Healthy", content);
	}
}