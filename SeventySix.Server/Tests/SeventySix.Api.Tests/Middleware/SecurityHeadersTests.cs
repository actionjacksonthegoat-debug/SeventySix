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
public class SecurityHeadersTests : IDisposable
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
	/// Tests that X-XSS-Protection header is set correctly.
	/// Enables browser XSS filtering (legacy but still useful).
	/// </summary>
	[Fact]
	public async Task Response_ContainsXssProtectionHeader_EnabledWithBlockAsync()
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
		values.ShouldContain(SecurityHeaderConstants.Values.XssBlock);
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

	/// <inheritdoc/>
	public void Dispose() =>
		Factory.Dispose();
}