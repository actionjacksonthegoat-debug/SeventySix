// <copyright file="OAuthServiceTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;
using NSubstitute;
using SeventySix.Identity;
using SeventySix.Identity.Constants;
using SeventySix.Shared.Extensions;
using SeventySix.TestUtilities.Builders;
using SeventySix.TestUtilities.Mocks;
using SeventySix.TestUtilities.TestHelpers;
using Shouldly;

namespace SeventySix.Domains.Tests.Identity.Services;

/// <summary>
/// Unit tests for OAuthService.
/// </summary>
/// <remarks>
/// Security-critical tests following 80/20 rule:
/// - PKCE code challenge generation
/// - State parameter inclusion (CSRF protection)
/// - Authorization URL construction
/// - Token exchange error handling
/// - User creation security
/// </remarks>
public class OAuthServiceTests
{
	private static readonly FakeTimeProvider TimeProvider =
		new(TestTimeProviderBuilder.DefaultTime);

	private readonly UserManager<ApplicationUser> UserManager;
	private readonly IHttpClientFactory HttpClientFactory;
	private readonly IOptions<AuthSettings> AuthSettings;
	private readonly AuthenticationService AuthenticationService;
	private readonly ILogger<OAuthService> Logger;

	private const string TestState = "test-state-12345";
	private const string TestCodeVerifier = "abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklm";
	private const string TestAuthorizationCode = "auth-code-from-github";
	private const string TestClientId = "test-client-id";
	private const string TestClientSecret = "test-client-secret";
	private const string TestRedirectUri = "https://localhost/oauth/callback";

	/// <summary>
	/// Initializes a new instance of the <see cref="OAuthServiceTests"/> class.
	/// </summary>
	public OAuthServiceTests()
	{
		UserManager =
			IdentityMockFactory.CreateUserManager();
		HttpClientFactory =
			Substitute.For<IHttpClientFactory>();
		AuthenticationService =
			IdentityMockFactory.CreateAuthenticationService();
		Logger =
			Substitute.For<ILogger<OAuthService>>();

		AuthSettings settings =
			new()
			{
				OAuth =
					new OAuthSettings
					{
						Providers =
							[
								new OAuthProviderSettings
								{
									Provider = OAuthProviderConstants.GitHub,
									ClientId = TestClientId,
									ClientSecret = TestClientSecret,
									RedirectUri = TestRedirectUri,
									AuthorizationEndpoint = "https://github.com/login/oauth/authorize",
									TokenEndpoint = "https://github.com/login/oauth/access_token",
									Scopes = "user:email",
								},
							],
					},
			};

		AuthSettings =
			Options.Create(settings);
	}

	#region BuildGitHubAuthorizationUrl Tests

	/// <summary>
	/// Verifies authorization URL includes state parameter for CSRF protection.
	/// Security: State parameter prevents CSRF attacks on OAuth callback.
	/// </summary>
	[Fact]
	public void BuildGitHubAuthorizationUrl_ValidInput_IncludesStateParameter()
	{
		// Arrange
		OAuthService service =
			CreateService();

		// Act
		string url =
			service.BuildGitHubAuthorizationUrl(
				TestState,
				TestCodeVerifier);

		// Assert
		url.ShouldContain($"state={Uri.EscapeDataString(TestState)}");
	}

	/// <summary>
	/// Verifies authorization URL includes PKCE code challenge.
	/// Security: PKCE prevents authorization code interception attacks.
	/// </summary>
	[Fact]
	public void BuildGitHubAuthorizationUrl_ValidInput_IncludesPkceCodeChallenge()
	{
		// Arrange
		OAuthService service =
			CreateService();

		// Act
		string url =
			service.BuildGitHubAuthorizationUrl(
				TestState,
				TestCodeVerifier);

		// Assert
		url.ShouldContain("code_challenge=");
		url.ShouldContain("code_challenge_method=S256");
	}

	/// <summary>
	/// Verifies PKCE code challenge is derived from verifier using SHA256.
	/// Security: Proper PKCE implementation is critical for security.
	/// </summary>
	[Fact]
	public void BuildGitHubAuthorizationUrl_ValidInput_GeneratesCorrectPkceChallenge()
	{
		// Arrange
		OAuthService service =
			CreateService();

		string expectedChallenge =
			CryptoExtensions.ComputePkceCodeChallenge(TestCodeVerifier);

		// Act
		string url =
			service.BuildGitHubAuthorizationUrl(
				TestState,
				TestCodeVerifier);

		// Assert
		url.ShouldContain($"code_challenge={Uri.EscapeDataString(expectedChallenge)}");
	}

	/// <summary>
	/// Verifies authorization URL includes required OAuth parameters.
	/// </summary>
	[Fact]
	public void BuildGitHubAuthorizationUrl_ValidInput_IncludesRequiredParameters()
	{
		// Arrange
		OAuthService service =
			CreateService();

		// Act
		string url =
			service.BuildGitHubAuthorizationUrl(
				TestState,
				TestCodeVerifier);

		// Assert
		url.ShouldContain($"client_id={TestClientId}");
		url.ShouldContain($"redirect_uri={Uri.EscapeDataString(TestRedirectUri)}");
		url.ShouldContain("scope=");
	}

	/// <summary>
	/// Verifies service throws when GitHub provider is not configured.
	/// </summary>
	[Fact]
	public void BuildGitHubAuthorizationUrl_NoGitHubProvider_ThrowsInvalidOperationException()
	{
		// Arrange
		IOptions<AuthSettings> emptySettings =
			Options.Create(
			new AuthSettings
			{
				OAuth = new OAuthSettings
				{
					Providers = [],
				},
			});

		OAuthService service =
			new(
				UserManager,
				HttpClientFactory,
				emptySettings,
				TimeProvider,
				AuthenticationService,
				Logger);

		// Act & Assert
		InvalidOperationException exception =
			Should.Throw<InvalidOperationException>(() =>
				service.BuildGitHubAuthorizationUrl(
					TestState,
					TestCodeVerifier));

		exception.Message.ShouldContain("GitHub");
	}

	#endregion

	#region HandleGitHubCallbackAsync Tests

	/// <summary>
	/// Verifies callback returns failure when GitHub provider is disabled.
	/// </summary>
	[Fact]
	public async Task HandleGitHubCallbackAsync_ProviderDisabled_ReturnsFailureAsync()
	{
		// Arrange
		IOptions<AuthSettings> emptySettings =
			Options.Create(
			new AuthSettings
			{
				OAuth = new OAuthSettings
				{
					Providers = [],
				},
			});

		OAuthService service =
			new(
				UserManager,
				HttpClientFactory,
				emptySettings,
				TimeProvider,
				AuthenticationService,
				Logger);

		// Act
		AuthResult result =
			await service.HandleGitHubCallbackAsync(
				TestAuthorizationCode,
				TestCodeVerifier,
				"127.0.0.1",
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeFalse();
		result.Error!.ShouldContain("not configured", Case.Insensitive);
	}

	/// <summary>
	/// Verifies callback returns failure when token exchange fails.
	/// Security: Error responses should not leak implementation details.
	/// </summary>
	[Fact]
	public async Task HandleGitHubCallbackAsync_TokenExchangeFails_ReturnsFailureAsync()
	{
		// Arrange
		MockHttpMessageHandler mockHandler =
			new((request, cancellationToken) =>
				Task.FromResult(
					new HttpResponseMessage(HttpStatusCode.BadRequest)));

		HttpClient httpClient =
			new(mockHandler);

		HttpClientFactory
			.CreateClient()
			.Returns(httpClient);

		OAuthService service =
			CreateService();

		// Act
		AuthResult result =
			await service.HandleGitHubCallbackAsync(
				TestAuthorizationCode,
				TestCodeVerifier,
				"127.0.0.1",
				CancellationToken.None);

		// Assert
		result.Success.ShouldBeFalse();
		result.ErrorCode.ShouldBe(AuthErrorCodes.OAuthError);
	}

	// NOTE: PKCE code verifier transmission and OAuth user creation tests
	// (role assignment, passwordless creation) are validated through integration
	// tests in OAuthSecurityTests.cs. Unit testing the full OAuth flow requires
	// complex HTTP mocking that doesn't add value beyond what integration tests
	// provide (per 80/20 rule). The BuildGitHubAuthorizationUrl tests above
	// validate that PKCE challenge is included in the authorization URL.

	#endregion

	#region Helper Methods

	private OAuthService CreateService()
	{
		return new OAuthService(
			UserManager,
			HttpClientFactory,
			AuthSettings,
			TimeProvider,
			AuthenticationService,
			Logger);
	}

	#endregion
}