// <copyright file="GitHubOAuthStrategyTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using NSubstitute;
using SeventySix.Shared.Extensions;
using SeventySix.TestUtilities.TestHelpers;
using Shouldly;

namespace SeventySix.Identity.Tests.Services;

/// <summary>
/// Unit tests for <see cref="GitHubOAuthStrategy"/>.
/// Validates authorization URL construction, PKCE, token exchange,
/// user info retrieval, and User-Agent header requirement.
/// </summary>
public sealed class GitHubOAuthStrategyTests
{
	private readonly IHttpClientFactory HttpClientFactory;

	private static readonly OAuthProviderSettings TestSettings =
		new()
		{
			Provider = OAuthProviderConstants.GitHub,
			ClientId = "test-client-id",
			ClientSecret = "test-client-secret",
			RedirectUri = "https://localhost/oauth/callback",
			AuthorizationEndpoint = "https://github.com/login/oauth/authorize",
			TokenEndpoint = "https://github.com/login/oauth/access_token",
			Scopes = "user:email",
		};

	private const string TestState = "test-state-12345";
	private const string TestCodeVerifier = "abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklm";
	private const string TestAccessToken = "test-access-token";
	private const string TestUsername = "testuser";
	private const string TestEmail = "test@example.com";
	private const string TestDisplayName = "Test User";

	/// <summary>
	/// Initializes a new instance of the <see cref="GitHubOAuthStrategyTests"/> class.
	/// </summary>
	public GitHubOAuthStrategyTests()
	{
		HttpClientFactory =
			Substitute.For<IHttpClientFactory>();
	}

	/// <summary>
	/// Verifies ProviderName returns "GitHub".
	/// </summary>
	[Fact]
	public void ProviderName_Always_ReturnsGitHub()
	{
		// Arrange
		GitHubOAuthStrategy strategy =
			new(HttpClientFactory);

		// Act & Assert
		strategy.ProviderName.ShouldBe("GitHub");
	}

	/// <summary>
	/// Verifies authorization URL includes PKCE code_challenge, state, client_id,
	/// redirect_uri, and scope parameters.
	/// </summary>
	[Fact]
	public void BuildAuthorizationUrl_ValidSettings_IncludesPkceAndState()
	{
		// Arrange
		GitHubOAuthStrategy strategy =
			new(HttpClientFactory);

		// Act
		string url =
			strategy.BuildAuthorizationUrl(
				TestSettings,
				TestSettings.RedirectUri,
				TestState,
				TestCodeVerifier);

		// Assert
		url.ShouldContain("code_challenge=");
		url.ShouldContain($"state={Uri.EscapeDataString(TestState)}");
		url.ShouldContain($"client_id={TestSettings.ClientId}");
		url.ShouldContain($"redirect_uri={Uri.EscapeDataString(TestSettings.RedirectUri)}");
		url.ShouldContain("scope=");
	}

	/// <summary>
	/// Verifies the code challenge is SHA256 of the verifier, base64url-encoded (S256).
	/// </summary>
	[Fact]
	public void BuildAuthorizationUrl_ValidSettings_UsesS256Challenge()
	{
		// Arrange
		GitHubOAuthStrategy strategy =
			new(HttpClientFactory);

		string expectedChallenge =
			CryptoExtensions.ComputePkceCodeChallenge(TestCodeVerifier);

		// Act
		string url =
			strategy.BuildAuthorizationUrl(
				TestSettings,
				TestSettings.RedirectUri,
				TestState,
				TestCodeVerifier);

		// Assert
		url.ShouldContain($"code_challenge={Uri.EscapeDataString(expectedChallenge)}");
		url.ShouldContain("code_challenge_method=S256");
	}

	/// <summary>
	/// Verifies ExchangeCodeForTokenAsync returns access token from valid response.
	/// </summary>
	[Fact]
	public async Task ExchangeCodeForTokenAsync_ValidCode_ReturnsAccessTokenAsync()
	{
		// Arrange
		string tokenJson =
			JsonSerializer.Serialize(
				new { access_token = "gho_test_token_123" });

		using HttpResponseMessage tokenResponse =
			new(HttpStatusCode.OK)
			{
				Content = new StringContent(tokenJson),
			};

		using MockHttpMessageHandler mockHandler =
			new((request, cancellationToken) =>
				Task.FromResult(tokenResponse));

		using HttpClient httpClient =
			new(mockHandler);

		HttpClientFactory
			.CreateClient()
			.Returns(httpClient);

		GitHubOAuthStrategy strategy =
			new(HttpClientFactory);

		// Act
		string accessToken =
			await strategy.ExchangeCodeForTokenAsync(
				TestSettings,
				"auth-code",
				TestSettings.RedirectUri,
				TestCodeVerifier,
				CancellationToken.None);

		// Assert
		accessToken.ShouldBe("gho_test_token_123");
	}

	/// <summary>
	/// Verifies ExchangeCodeForTokenAsync throws when GitHub returns an error.
	/// </summary>
	[Fact]
	public async Task ExchangeCodeForTokenAsync_ErrorResponse_ThrowsExceptionAsync()
	{
		// Arrange
		using HttpResponseMessage badRequestResponse =
			new(HttpStatusCode.BadRequest);

		using MockHttpMessageHandler mockHandler =
			new((request, cancellationToken) =>
				Task.FromResult(badRequestResponse));

		using HttpClient httpClient =
			new(mockHandler);

		HttpClientFactory
			.CreateClient()
			.Returns(httpClient);

		GitHubOAuthStrategy strategy =
			new(HttpClientFactory);

		// Act & Assert
		await Should.ThrowAsync<HttpRequestException>(
			() => strategy.ExchangeCodeForTokenAsync(
				TestSettings,
				"bad-code",
				TestSettings.RedirectUri,
				TestCodeVerifier,
				CancellationToken.None));
	}

	/// <summary>
	/// Verifies GetUserInfoAsync parses GitHub user JSON into OAuthUserInfo.
	/// </summary>
	[Fact]
	public async Task GetUserInfoAsync_ValidToken_ReturnsOAuthUserInfoAsync()
	{
		// Arrange
		string userJson =
			JsonSerializer.Serialize(
				new
				{
					id = 12345678,
					login = TestUsername,
					email = TestEmail,
					name = TestDisplayName,
					avatar_url = "https://avatars.githubusercontent.com/u/12345678",
				});

		using HttpResponseMessage userInfoResponse =
			new(HttpStatusCode.OK)
			{
				Content = new StringContent(userJson),
			};

		using MockHttpMessageHandler mockHandler =
			new((request, cancellationToken) =>
				Task.FromResult(userInfoResponse));

		using HttpClient httpClient =
			new(mockHandler);

		HttpClientFactory
			.CreateClient()
			.Returns(httpClient);

		GitHubOAuthStrategy strategy =
			new(HttpClientFactory);

		// Act
		OAuthUserInfoResult userInfo =
			await strategy.GetUserInfoAsync(
				TestAccessToken,
				CancellationToken.None);

		// Assert
		userInfo.ProviderId.ShouldBe("12345678");
		userInfo.Login.ShouldBe(TestUsername);
		userInfo.Email.ShouldBe(TestEmail);
		userInfo.FullName.ShouldBe(TestDisplayName);
		userInfo.AvatarUrl.ShouldBe(
			"https://avatars.githubusercontent.com/u/12345678");
	}

	/// <summary>
	/// Verifies GetUserInfoAsync sets User-Agent header (required by GitHub API).
	/// </summary>
	[Fact]
	public async Task GetUserInfoAsync_ValidToken_SetsUserAgentHeaderAsync()
	{
		// Arrange
		HttpRequestMessage? capturedRequest = null;

		string userJson =
			JsonSerializer.Serialize(
				new
				{
					id = 1,
					login = "user",
				});

		using HttpResponseMessage userAgentResponse =
			new(HttpStatusCode.OK)
			{
				Content = new StringContent(userJson),
			};

		using MockHttpMessageHandler mockHandler =
			new(
				(request, cancellationToken) =>
			{
				capturedRequest = request;
				return Task.FromResult(userAgentResponse);
			});

		using HttpClient httpClient =
			new(mockHandler);

		HttpClientFactory
			.CreateClient()
			.Returns(httpClient);

		GitHubOAuthStrategy strategy =
			new(HttpClientFactory);

		// Act
		await strategy.GetUserInfoAsync(
			TestAccessToken,
			CancellationToken.None);

		// Assert
		capturedRequest.ShouldNotBeNull();
		capturedRequest.Headers.UserAgent.ShouldNotBeEmpty();
		capturedRequest.Headers.UserAgent
			.ShouldContain(
				product => product.Product != null
					&& product.Product.Name == "SeventySix");
	}
}