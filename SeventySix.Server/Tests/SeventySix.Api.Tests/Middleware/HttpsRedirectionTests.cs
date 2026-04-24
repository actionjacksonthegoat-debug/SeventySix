// <copyright file="HttpsRedirectionTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using SeventySix.Shared.Constants;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Api.Tests.Middleware;

/// <summary>
/// Integration tests for HTTPS redirection behaviour.
/// Verifies that HTTPS enforcement redirects non-exempt paths and passes through exempt ones.
/// </summary>
public sealed class HttpsRedirectionTests : IDisposable
{
	private readonly SharedWebApplicationFactory<Program> Factory;

	/// <summary>
	/// Initializes a new instance of the <see cref="HttpsRedirectionTests"/> class.
	/// Overrides <c>Security:EnforceHttps=true</c> and <c>Security:HttpsPort=443</c>
	/// so HTTPS enforcement is active. Health and metrics endpoints are exempt via
	/// <see cref="SeventySix.Api.Attributes.AllowHttpAttribute"/> endpoint metadata.
	/// </summary>
	public HttpsRedirectionTests()
	{
		Factory =
			new SharedWebApplicationFactory<Program>(
				connectionString: "InMemory",
				configureAdditional: builder =>
					builder.ConfigureAppConfiguration(
						(_, config) =>
							config.AddInMemoryCollection(
								new Dictionary<string, string?>
								{
									["Security:EnforceHttps"] = "true",
									["Security:HttpsPort"] = "443",
								})));
	}

	/// <summary>
	/// HTTP request to <c>/health</c> should pass through (not redirect) when the
	/// endpoint is tagged with <see cref="SeventySix.Api.Attributes.AllowHttpAttribute"/>.
	/// Container health probes use HTTP.
	/// </summary>
	[Fact]
	public async Task HttpRequest_ToHealthEndpoint_IsNotRedirectedAsync()
	{
		// Arrange
		using HttpClient client =
			Factory.CreateClient(
				new WebApplicationFactoryClientOptions
				{
					AllowAutoRedirect = false,
				});

		// Act
		HttpResponseMessage response =
			await client.GetAsync(EndpointPathConstants.Health.Base);

		// Assert — exempt endpoint passes through; must NOT be a 307 redirect
		((int)response.StatusCode).ShouldNotBe((int)HttpStatusCode.TemporaryRedirect);
	}

	/// <summary>
	/// HTTP request to a non-exempt API endpoint must be redirected to the HTTPS equivalent
	/// when <c>EnforceHttps</c> is enabled. The Location header must use the <c>https</c> scheme.
	/// Covers both the current 302 (SmartHttpsRedirectionMiddleware) and the framework-default
	/// 307 (UseHttpsRedirection) after Phase 5 replaces the middleware.
	/// </summary>
	[Fact]
	public async Task HttpRequest_ToApiEndpoint_IsRedirectedToHttpsAsync()
	{
		// Arrange
		using HttpClient client =
			Factory.CreateClient(
				new WebApplicationFactoryClientOptions
				{
					AllowAutoRedirect = false,
				});

		// Act
		HttpResponseMessage response =
			await client.GetAsync(ApiEndpoints.Auth.Me);

		// Assert — must be a redirect (301/302/307/308) targeting HTTPS
		((int)response.StatusCode).ShouldBeInRange(301, 308);
		response.Headers.Location.ShouldNotBeNull();
		response.Headers.Location!.Scheme.ShouldBe("https");
	}

	/// <summary>
	/// HTTP request to <c>/metrics</c> should pass through (not redirect) when the
	/// endpoint is tagged with <see cref="SeventySix.Api.Attributes.AllowHttpAttribute"/>.
	/// Prometheus scrapers use HTTP.
	/// </summary>
	[Fact]
	public async Task HttpRequest_ToMetricsEndpoint_IsNotRedirectedAsync()
	{
		// Arrange
		using HttpClient client =
			Factory.CreateClient(
				new WebApplicationFactoryClientOptions
				{
					AllowAutoRedirect = false,
				});

		// Act
		HttpResponseMessage response =
			await client.GetAsync(EndpointPathConstants.Metrics);

		// Assert — exempt endpoint passes through; must NOT be a 307 redirect
		((int)response.StatusCode).ShouldNotBe((int)HttpStatusCode.TemporaryRedirect);
	}

	/// <inheritdoc/>
	public void Dispose() =>
		Factory.Dispose();
}