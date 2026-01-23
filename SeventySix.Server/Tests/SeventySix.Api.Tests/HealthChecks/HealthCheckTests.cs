// <copyright file="HealthCheckTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;

namespace SeventySix.Api.Tests.HealthChecks;

/// <summary>
/// Integration tests for the /health endpoint.
/// Tests the built-in ASP.NET Core health check endpoint.
/// </summary>
[Collection(CollectionNames.PostgreSql)]
public class HealthCheckTests(TestcontainersPostgreSqlFixture fixture)
	: ApiPostgreSqlTestBase<Program>(fixture),
		IAsyncLifetime
{
	/// <summary>
	/// Verifies the /health endpoint returns 200 OK and includes "Healthy" when DB is connected.
	/// </summary>
	[Fact]
	public async Task HealthEndpoint_ReturnsHealthy_WhenDatabaseConnectedAsync()
	{
		// Arrange - Use shared factory's client for better performance
		using HttpClient client = CreateClient();

		// Act
		HttpResponseMessage response =
			await client.GetAsync("/health");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		string content =
			await response.Content.ReadAsStringAsync();
		Assert.Contains("Healthy", content);
	}
}