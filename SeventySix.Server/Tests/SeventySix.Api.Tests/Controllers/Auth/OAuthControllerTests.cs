// <copyright file="OAuthControllerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using SeventySix.Api.Tests.Fixtures;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using Shouldly;

namespace SeventySix.Api.Tests.Controllers.Auth;

/// <summary>
/// Integration tests for OAuthController.
/// </summary>
/// <remarks>
/// Tests HTTP API endpoints for OAuth provider authentication.
/// Uses shared WebApplicationFactory for improved test performance.
/// </remarks>
[Collection(CollectionNames.IdentityAuthPostgreSql)]
public sealed class OAuthControllerTests(IdentityAuthApiPostgreSqlFixture fixture)
	: ApiPostgreSqlTestBase<Program>(fixture),
		IAsyncLifetime
{
	private HttpClient? Client;

	private const string OAuthErrorMessage = "oauth_error";
	private const string PostMessageMethod = "postMessage";

	/// <inheritdoc/>
	public override async Task InitializeAsync()
	{
		// Clean up auth tables before each test
		await TruncateTablesAsync(TestTables.Identity);

		// Use shared factory with custom client options
		Client =
			CreateClient(
			new WebApplicationFactoryClientOptions
			{
				AllowAutoRedirect = false, // Don't follow redirects for OAuth tests
			});
	}

	/// <inheritdoc/>
	public new Task DisposeAsync()
	{
		// Only dispose client, not the shared factory (managed by fixture)
		Client?.Dispose();
		return Task.CompletedTask;
	}

	#region GitHub OAuth Tests

	/// <summary>
	/// Tests that GET /auth/oauth/github redirects to GitHub authorization.
	/// </summary>
	[Fact]
	public async Task GitHubLoginAsync_ValidProvider_RedirectsToGitHubAsync()
	{
		// Act
		HttpResponseMessage response =
			await Client!.GetAsync(
			ApiEndpoints.Auth.OAuth.GitHub);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.Redirect);
		response.Headers.Location.ShouldNotBeNull();
		response.Headers.Location.ToString().ShouldStartWith(
			"https://github.com/login/oauth/authorize");
	}

	/// <summary>
	/// Tests that GET /auth/oauth/github sets OAuth state and code verifier cookies.
	/// </summary>
	[Fact]
	public async Task GitHubLoginAsync_ValidProvider_SetsOAuthCookiesAsync()
	{
		// Act
		HttpResponseMessage response =
			await Client!.GetAsync(
			ApiEndpoints.Auth.OAuth.GitHub);

		// Assert
		response.Headers.Contains("Set-Cookie").ShouldBeTrue();

		IEnumerable<string> cookies =
			response.Headers.GetValues("Set-Cookie");

		// Verify state and code_verifier cookies are set
		cookies.ShouldContain(
			cookie => cookie.Contains("X-OAuth-State="));
		cookies.ShouldContain(
			cookie => cookie.Contains("X-OAuth-CodeVerifier="));
	}

	/// <summary>
	/// Tests that GET /auth/oauth/github/callback returns error without state cookie.
	/// </summary>
	[Fact]
	public async Task GitHubCallbackAsync_NoStateCookie_ReturnsPostMessageErrorAsync()
	{
		// Act - Call callback without setting up OAuth state
		HttpResponseMessage response =
			await Client!.GetAsync(
			$"{ApiEndpoints.Auth.OAuth.GitHubCallback}?code=test&state=invalid");

		// Assert - Now returns HTML with postMessage instead of redirect
		response.StatusCode.ShouldBe(HttpStatusCode.OK);

		string content =
			await response.Content.ReadAsStringAsync();

		content.ShouldContain(OAuthErrorMessage);
		content.ShouldContain(PostMessageMethod);
	}

	/// <summary>
	/// Tests that GET /auth/oauth/github/callback returns error for CSRF/PKCE violations.
	/// </summary>
	[Theory]
	[InlineData(true)]
	[InlineData(false)]
	public async Task GitHubCallbackAsync_StateMismatch_ReturnsSecurityErrorAsync(
		bool stateTampered)
	{
		// Arrange
		string validState = "valid-state-value";
		string queryState =
			stateTampered ? "tampered-state" : validState;

		HttpRequestMessage request =
			new(
			HttpMethod.Get,
			$"{ApiEndpoints.Auth.OAuth.GitHubCallback}?code=test&state={queryState}");
		request.Headers.Add(
			"Cookie",
			$"X-OAuth-State={validState}");

		// Act
		HttpResponseMessage response =
			await Client!.SendAsync(request);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.OK);

		string content =
			await response.Content.ReadAsStringAsync();

		content.ShouldContain(OAuthErrorMessage);
		content.ShouldContain(PostMessageMethod);
	}

	#endregion
}