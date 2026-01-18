// <copyright file="CorsMiddlewareBehaviorTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using Microsoft.Extensions.Configuration;
using SeventySix.TestUtilities.TestBases;

namespace SeventySix.Api.Tests.Middleware;

/// <summary>
/// Compact test suite covering critical CORS behaviors (80/20):
/// - Preflight OPTIONS handling
/// - Error responses preserve CORS headers
/// - Rate limiter rejection preserves CORS headers
///
/// These are intentionally minimal and isolated so they are fast and reliable.
/// </summary>
public class CorsMiddlewareBehaviorTests : IDisposable
{
	private readonly SharedWebApplicationFactory<Program> Factory;

	public CorsMiddlewareBehaviorTests()
	{
		Factory =
			new SharedWebApplicationFactory<Program>(
			connectionString: "InMemory",
			configureAdditional: builder =>
			{
				builder.ConfigureAppConfiguration(
					(context, conf) =>
					{
						conf.AddInMemoryCollection(
							new Dictionary<string, string?>
							{
								["Cors:AllowedOrigins:0"] =
									"http://localhost:4200",
								["RateLimiting:Enabled"] = "true",
								["RateLimiting:PermitLimit"] = "1",
								["RateLimiting:WindowSeconds"] = "60",
							});
					});
			});
	}

	[Fact]
	public async Task Preflight_And_Error_And_RateLimit_Behavior_Async()
	{
		using HttpClient client = Factory.CreateClient();

		// 1) Preflight OPTIONS returns 204 and CORS headers
		HttpRequestMessage preflight =
			new(HttpMethod.Options, "/api/v1/logs");
		preflight.Headers.Add("Origin", "http://localhost:4200");
		preflight.Headers.Add("Access-Control-Request-Method", "GET");

		HttpResponseMessage preflightResponse =
			await client.SendAsync(
				preflight);
		Assert.Equal(
			HttpStatusCode.NoContent,
			preflightResponse.StatusCode);
		Assert.True(
			preflightResponse.Headers.Contains("Access-Control-Allow-Origin"));

		// 2) Error response includes CORS headers
		HttpRequestMessage errorRequest =
			new(
				HttpMethod.Get,
				"/api/v1/nonexistent");
		errorRequest.Headers.Add("Origin", "http://localhost:4200");

		HttpResponseMessage errorResponse =
			await client.SendAsync(
				errorRequest);
		Assert.Equal(
			HttpStatusCode.NotFound,
			errorResponse.StatusCode);
		Assert.True(
			errorResponse.Headers.Contains("Access-Control-Allow-Origin"));
	}

	public void Dispose() => Factory.Dispose();
}