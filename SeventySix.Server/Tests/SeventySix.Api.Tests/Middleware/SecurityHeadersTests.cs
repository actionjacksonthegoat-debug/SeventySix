// <copyright file="SecurityHeadersTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using SeventySix.Shared.Constants;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Api.Tests.Middleware;

/// <summary>
/// Tests that security headers are correctly applied by AttributeBasedSecurityHeadersMiddleware.
/// Per 80/20 rule: Focus on critical OWASP headers that prevent common vulnerabilities.
/// </summary>
public sealed class SecurityHeadersTests : IDisposable
{
	private readonly SharedWebApplicationFactory<Program> Factory;

	/// <summary>
	/// Initializes a new instance of the <see cref="SecurityHeadersTests"/> class.
	/// </summary>
	public SecurityHeadersTests()
	{
		Factory =
			new SharedWebApplicationFactory<Program>(
				connectionString: "InMemory");
	}

	/// <summary>
	/// Tests that X-Content-Type-Options header is set to nosniff.
	/// Prevents MIME type sniffing attacks (CWE-16).
	/// </summary>
	[Fact]
	public async Task Response_ContainsXContentTypeOptionsHeader_NoSniffAsync()
	{
		// Arrange
		using HttpClient client =
			Factory.CreateClient();

		// Act
		HttpResponseMessage response =
			await client.GetAsync(ApiEndpoints.Health.Base);

		// Assert
		response.Headers.TryGetValues(
			SecurityHeaderConstants.Names.ContentTypeOptions,
			out IEnumerable<string>? values).ShouldBeTrue();
		values.ShouldNotBeNull();
		values.ShouldContain(SecurityHeaderConstants.Values.NoSniff);
	}

	/// <summary>
	/// Tests that X-Frame-Options header is set to DENY.
	/// Prevents clickjacking attacks (CWE-1021).
	/// </summary>
	[Fact]
	public async Task Response_ContainsXFrameOptionsHeader_DenyAsync()
	{
		// Arrange
		using HttpClient client =
			Factory.CreateClient();

		// Act
		HttpResponseMessage response =
			await client.GetAsync(ApiEndpoints.Health.Base);

		// Assert
		response.Headers.TryGetValues(
			SecurityHeaderConstants.Names.FrameOptions,
			out IEnumerable<string>? values).ShouldBeTrue();
		values.ShouldNotBeNull();
		values.ShouldContain(SecurityHeaderConstants.Values.Deny);
	}

	/// <summary>
	/// Tests that X-XSS-Protection header is set to 0 (disabled).
	/// Modern best practice: disable the legacy XSS filter — CSP provides superior protection.
	/// </summary>
	[Fact]
	public async Task Response_ContainsXssProtectionHeader_DisabledAsync()
	{
		// Arrange
		using HttpClient client =
			Factory.CreateClient();

		// Act
		HttpResponseMessage response =
			await client.GetAsync(ApiEndpoints.Health.Base);

		// Assert
		response.Headers.TryGetValues(
			SecurityHeaderConstants.Names.XssProtection,
			out IEnumerable<string>? values).ShouldBeTrue();
		values.ShouldNotBeNull();
		values.ShouldContain(SecurityHeaderConstants.Values.XssDisabled);
	}

	/// <summary>
	/// Tests that Content-Security-Policy header is present.
	/// CSP mitigates XSS and data injection attacks (CWE-79).
	/// </summary>
	[Fact]
	public async Task Response_ContainsContentSecurityPolicyHeaderAsync()
	{
		// Arrange
		using HttpClient client =
			Factory.CreateClient();

		// Act
		HttpResponseMessage response =
			await client.GetAsync(ApiEndpoints.Health.Base);

		// Assert
		response.Headers.TryGetValues(
			SecurityHeaderConstants.Names.ContentSecurityPolicy,
			out IEnumerable<string>? values).ShouldBeTrue();
		values.ShouldNotBeNull();
		values.First().ShouldContain("default-src");
	}

	/// <summary>
	/// Tests that Referrer-Policy header is present.
	/// Controls referrer information sent in requests.
	/// </summary>
	[Fact]
	public async Task Response_ContainsReferrerPolicyHeaderAsync()
	{
		// Arrange
		using HttpClient client =
			Factory.CreateClient();

		// Act
		HttpResponseMessage response =
			await client.GetAsync(ApiEndpoints.Health.Base);

		// Assert
		response.Headers.TryGetValues(
			SecurityHeaderConstants.Names.ReferrerPolicy,
			out IEnumerable<string>? values).ShouldBeTrue();
		values.ShouldNotBeNull();
		values.First().ShouldNotBeNullOrEmpty();
	}

	/// <summary>
	/// Tests that Permissions-Policy header is present.
	/// Restricts access to browser features.
	/// </summary>
	[Fact]
	public async Task Response_ContainsPermissionsPolicyHeaderAsync()
	{
		// Arrange
		using HttpClient client =
			Factory.CreateClient();

		// Act
		HttpResponseMessage response =
			await client.GetAsync(ApiEndpoints.Health.Base);

		// Assert
		response.Headers.TryGetValues(
			SecurityHeaderConstants.Names.PermissionsPolicy,
			out IEnumerable<string>? values).ShouldBeTrue();
		values.ShouldNotBeNull();
		values.First().ShouldNotBeNullOrEmpty();
	}

	/// <summary>
	/// Tests that security headers are present even on error responses.
	/// Headers must be set regardless of response status for defense-in-depth.
	/// </summary>
	[Fact]
	public async Task ErrorResponse_StillContainsSecurityHeadersAsync()
	{
		// Arrange
		using HttpClient client =
			Factory.CreateClient();

		// Act - Request a non-existent endpoint to trigger 404
		HttpResponseMessage response =
			await client.GetAsync("/api/v1/nonexistent-endpoint-12345");

		// Assert - Headers should still be present
		response.Headers.Contains(SecurityHeaderConstants.Names.ContentTypeOptions).ShouldBeTrue();
		response.Headers.Contains(SecurityHeaderConstants.Names.FrameOptions).ShouldBeTrue();
		response.Headers.Contains(SecurityHeaderConstants.Names.XssProtection).ShouldBeTrue();
	}

	/// <summary>
	/// Tests that CSP includes upgrade-insecure-requests directive.
	/// Automatically upgrades HTTP requests to HTTPS (prevents mixed content).
	/// </summary>
	[Fact]
	public async Task Csp_ContainsUpgradeInsecureRequestsDirectiveAsync()
	{
		// Arrange
		using HttpClient httpClient =
			Factory.CreateClient();

		// Act
		HttpResponseMessage response =
			await httpClient.GetAsync(ApiEndpoints.Health.Base);

		// Assert
		response.Headers.TryGetValues(
			SecurityHeaderConstants.Names.ContentSecurityPolicy,
			out IEnumerable<string>? cspValues).ShouldBeTrue();
		cspValues.ShouldNotBeNull();
		cspValues.First().ShouldContain("upgrade-insecure-requests");
	}

	/// <summary>
	/// Tests that CSP does not allow insecure WebSocket connections.
	/// The app uses no WebSocket connections, so neither ws: nor wss: should be in CSP.
	/// </summary>
	[Fact]
	public async Task Csp_DoesNotAllowInsecureWebSocketAsync()
	{
		// Arrange
		using HttpClient httpClient =
			Factory.CreateClient();

		// Act
		HttpResponseMessage response =
			await httpClient.GetAsync(ApiEndpoints.Health.Base);

		// Assert
		response.Headers.TryGetValues(
			SecurityHeaderConstants.Names.ContentSecurityPolicy,
			out IEnumerable<string>? cspValues).ShouldBeTrue();
		cspValues.ShouldNotBeNull();
		string cspHeader =
			cspValues.First();
		cspHeader.ShouldNotContain("ws:");
	}

	/// <summary>
	/// Tests that Cache-Control header is set to no-store.
	/// Prevents caching of sensitive API responses (OWASP).
	/// </summary>
	[Fact]
	public async Task Response_ContainsCacheControlNoStoreHeaderAsync()
	{
		// Arrange
		using HttpClient httpClient =
			Factory.CreateClient();

		// Act
		HttpResponseMessage response =
			await httpClient.GetAsync(ApiEndpoints.Health.Base);

		// Assert
		response.Headers.CacheControl.ShouldNotBeNull();
		response.Headers.CacheControl.NoStore.ShouldBeTrue();
	}

	/// <summary>
	/// Tests that Pragma no-cache header is set for HTTP/1.0 compatibility.
	/// </summary>
	[Fact]
	public async Task Response_ContainsPragmaNoCacheHeaderAsync()
	{
		// Arrange
		using HttpClient httpClient =
			Factory.CreateClient();

		// Act
		HttpResponseMessage response =
			await httpClient.GetAsync(ApiEndpoints.Health.Base);

		// Assert
		response.Headers.Pragma.ShouldNotBeNull();
		response.Headers.Pragma.ShouldContain(
			new System.Net.Http.Headers.NameValueHeaderValue("no-cache"));
	}

	/// <summary>
	/// Tests that CSP includes frame-ancestors 'self' directive.
	/// Allows same-origin iframe embedding (Grafana dashboards) while preventing external framing.
	/// </summary>
	[Fact]
	public async Task Csp_ContainsFrameAncestorsSelfDirectiveAsync()
	{
		// Arrange
		using HttpClient httpClient =
			Factory.CreateClient();

		// Act
		HttpResponseMessage response =
			await httpClient.GetAsync(ApiEndpoints.Health.Base);

		// Assert
		response.Headers.TryGetValues(
			SecurityHeaderConstants.Names.ContentSecurityPolicy,
			out IEnumerable<string>? cspValues).ShouldBeTrue();
		cspValues.ShouldNotBeNull();
		string cspHeader =
			cspValues.First();
		cspHeader.ShouldContain("frame-ancestors 'self'");
		cspHeader.ShouldNotContain("frame-ancestors 'none'");
	}

	/// <summary>
	/// Tests that CSP img-src does not contain the wildcard https: source.
	/// Only 'self' and data: are needed — no external image domains required.
	/// </summary>
	[Fact]
	public async Task Csp_ImgSrc_DoesNotContainWildcardHttpsAsync()
	{
		// Arrange
		using HttpClient httpClient =
			Factory.CreateClient();

		// Act
		HttpResponseMessage response =
			await httpClient.GetAsync(ApiEndpoints.Health.Base);

		// Assert
		response.Headers.TryGetValues(
			SecurityHeaderConstants.Names.ContentSecurityPolicy,
			out IEnumerable<string>? cspValues).ShouldBeTrue();
		cspValues.ShouldNotBeNull();
		string cspHeader =
			cspValues.First();
		cspHeader.ShouldContain("img-src 'self' data:");
		cspHeader.ShouldNotContain("img-src 'self' data: https:");
	}

	/// <summary>
	/// Tests that CSP script-src does not contain 'unsafe-inline'.
	/// Angular AOT compilation eliminates the need for inline scripts.
	/// CSP provides superior XSS protection without unsafe-inline.
	/// </summary>
	[Fact]
	public async Task Csp_ScriptSrc_DoesNotContainUnsafeInlineAsync()
	{
		// Arrange
		using HttpClient httpClient =
			Factory.CreateClient();

		// Act
		HttpResponseMessage response =
			await httpClient.GetAsync(ApiEndpoints.Health.Base);

		// Assert
		response.Headers.TryGetValues(
			SecurityHeaderConstants.Names.ContentSecurityPolicy,
			out IEnumerable<string>? cspValues).ShouldBeTrue();
		cspValues.ShouldNotBeNull();
		string cspHeader =
			cspValues.First();

		// Extract the script-src directive value
		string scriptSrc =
			cspHeader.Split(';')
				.Select(directive => directive.Trim())
				.First(directive => directive.StartsWith(
					"script-src",
					StringComparison.OrdinalIgnoreCase));
		scriptSrc.ShouldNotContain("'unsafe-inline'");
	}

	/// <inheritdoc/>
	public void Dispose() =>
		Factory.Dispose();
}