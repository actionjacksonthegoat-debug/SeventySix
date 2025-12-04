// <copyright file="AuthControllerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using SeventySix.Api.Controllers;
using SeventySix.Identity;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using SeventySix.TestUtilities.TestHelpers;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Integration tests for AuthController.
/// </summary>
/// <remarks>
/// Tests HTTP API endpoints for authentication operations.
/// Uses shared WebApplicationFactory for improved test performance.
/// </remarks>
[Collection("PostgreSQL")]
public class AuthControllerTests(TestcontainersPostgreSqlFixture fixture)
	: ApiPostgreSqlTestBase<Program>(fixture), IAsyncLifetime
{
	private HttpClient? Client;
	private IdentityDbContext? IdentityContext;

	/// <inheritdoc/>
	public override async Task InitializeAsync()
	{
		// Clean up auth tables before each test
		await TruncateTablesAsync(TestTables.Identity);

		// Use shared factory with custom client options
		Client =
			CreateClient(new WebApplicationFactoryClientOptions
			{
				AllowAutoRedirect = false // Don't follow redirects for OAuth tests
			});

		using IServiceScope scope =
			SharedFactory.Services.CreateScope();

		IdentityContext =
			scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
	}

	/// <inheritdoc/>
	public new Task DisposeAsync()
	{
		// Only dispose client, not the shared factory (managed by fixture)
		Client?.Dispose();
		return Task.CompletedTask;
	}

	#region Login Tests

	/// <summary>
	/// Tests that POST /auth/login returns 401 with invalid credentials.
	/// </summary>
	[Fact]
	public async Task LoginAsync_InvalidCredentials_ReturnsUnauthorizedAsync()
	{
		// Arrange
		LoginRequest request =
			new(
				UsernameOrEmail: "nonexistent",
				Password: "wrongpassword");

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync("/api/v1/auth/login", request);

		// Assert
		Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);

		ProblemDetails? problemDetails =
			await response.Content.ReadFromJsonAsync<ProblemDetails>();

		Assert.NotNull(problemDetails);
		Assert.Equal("Authentication Failed", problemDetails.Title);
	}

	/// <summary>
	/// Tests that POST /auth/login returns 200 with valid credentials.
	/// </summary>
	[Fact]
	public async Task LoginAsync_ValidCredentials_ReturnsTokenAsync()
	{
		// Arrange - Create user with credentials
		string testId =
			Guid.NewGuid().ToString("N")[..8];

		await TestUserHelper.CreateUserWithPasswordAsync(
			SharedFactory.Services,
			username: $"testuser_{testId}",
			email: $"test_{testId}@example.com");

		LoginRequest request =
			new(
				UsernameOrEmail: $"testuser_{testId}",
				Password: TestUserHelper.TestPassword);

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync("/api/v1/auth/login", request);

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		AuthResponse? authResponse =
			await response.Content.ReadFromJsonAsync<AuthResponse>();

		Assert.NotNull(authResponse);
		Assert.NotEmpty(authResponse.AccessToken);
		Assert.True(authResponse.ExpiresAt > DateTime.UtcNow);

		// Verify refresh token cookie was set
		Assert.True(response.Headers.Contains("Set-Cookie"));
	}

	/// <summary>
	/// Tests that POST /auth/login accepts email instead of username.
	/// </summary>
	[Fact]
	public async Task LoginAsync_WithEmail_ReturnsTokenAsync()
	{
		// Arrange
		string testId =
			Guid.NewGuid().ToString("N")[..8];

		await TestUserHelper.CreateUserWithPasswordAsync(
			SharedFactory.Services,
			username: $"testuser_{testId}",
			email: $"test_{testId}@example.com");

		LoginRequest request =
			new(
				UsernameOrEmail: $"test_{testId}@example.com",
				Password: TestUserHelper.TestPassword);

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync("/api/v1/auth/login", request);

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);
	}

	#endregion

	#region Register Tests

	/// <summary>
	/// Tests that POST /auth/register creates a new user.
	/// </summary>
	[Fact]
	public async Task RegisterAsync_ValidRequest_ReturnsCreatedAsync()
	{
		// Arrange
		RegisterRequest request =
			new(
				Username: "newuser",
				Email: "newuser@example.com",
				Password: "SecurePassword123!",
				FullName: "New User");

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync("/api/v1/auth/register", request);

		// Assert
		Assert.Equal(HttpStatusCode.Created, response.StatusCode);

		AuthResponse? authResponse =
			await response.Content.ReadFromJsonAsync<AuthResponse>();

		Assert.NotNull(authResponse);
		Assert.NotEmpty(authResponse.AccessToken);
	}

	/// <summary>
	/// Tests that POST /auth/register returns 400 for duplicate username.
	/// </summary>
	[Fact]
	public async Task RegisterAsync_DuplicateUsername_ReturnsBadRequestAsync()
	{
		// Arrange - Create existing user
		string testId =
			Guid.NewGuid().ToString("N")[..8];

		await TestUserHelper.CreateUserWithPasswordAsync(
			SharedFactory.Services,
			username: $"existinguser_{testId}",
			email: $"existing_{testId}@example.com");

		RegisterRequest request =
			new(
				Username: $"existinguser_{testId}",
				Email: $"new_{testId}@example.com",
				Password: "SecurePassword123!",
				FullName: null);

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync("/api/v1/auth/register", request);

		// Assert
		Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
	}

	/// <summary>
	/// Tests that POST /auth/register returns 400 for duplicate email.
	/// </summary>
	[Fact]
	public async Task RegisterAsync_DuplicateEmail_ReturnsBadRequestAsync()
	{
		// Arrange
		string testId =
			Guid.NewGuid().ToString("N")[..8];

		await TestUserHelper.CreateUserWithPasswordAsync(
			SharedFactory.Services,
			username: $"existinguser_{testId}",
			email: $"existing_{testId}@example.com");

		RegisterRequest request =
			new(
				Username: $"newusername_{testId}",
				Email: $"existing_{testId}@example.com",
				Password: "SecurePassword123!",
				FullName: null);

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync("/api/v1/auth/register", request);

		// Assert
		Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
	}

	#endregion

	#region Refresh Tests

	/// <summary>
	/// Tests that POST /auth/refresh returns 401 without refresh token cookie.
	/// </summary>
	[Fact]
	public async Task RefreshAsync_NoCookie_ReturnsUnauthorizedAsync()
	{
		// Act
		HttpResponseMessage response =
			await Client!.PostAsync("/api/v1/auth/refresh", null);

		// Assert
		Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
	}

	#endregion

	#region Cookie Security Tests

	/// <summary>
	/// Tests that login sets the refresh token cookie with SameSite=Strict.
	/// This is critical for CSRF protection.
	/// </summary>
	[Fact]
	public async Task LoginAsync_SetsSameSiteCookieStrict_WhenSuccessfulAsync()
	{
		// Arrange
		string testId =
			Guid.NewGuid().ToString("N")[..8];

		await TestUserHelper.CreateUserWithPasswordAsync(
			SharedFactory.Services,
			username: $"testuser_{testId}",
			email: $"test_{testId}@example.com");

		LoginRequest request =
			new(
				UsernameOrEmail: $"testuser_{testId}",
				Password: TestUserHelper.TestPassword);

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync("/api/v1/auth/login", request);

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);
		Assert.True(response.Headers.Contains("Set-Cookie"));

		IEnumerable<string> cookies =
			response.Headers.GetValues("Set-Cookie");

		// Find the refresh token cookie
		string? refreshTokenCookie =
			cookies.FirstOrDefault(cookie => cookie.Contains("X-Refresh-Token="));

		Assert.NotNull(refreshTokenCookie);

		// Verify SameSite=Strict is set (critical for CSRF protection)
		Assert.Contains("samesite=strict", refreshTokenCookie.ToLowerInvariant());

		// Verify HttpOnly is set (critical for XSS protection)
		Assert.Contains("httponly", refreshTokenCookie.ToLowerInvariant());
	}

	#endregion

	#region Logout Tests

	/// <summary>
	/// Tests that POST /auth/logout returns 204 and clears cookie.
	/// </summary>
	[Fact]
	public async Task LogoutAsync_ReturnsNoContentAsync()
	{
		// Act
		HttpResponseMessage response =
			await Client!.PostAsync("/api/v1/auth/logout", null);

		// Assert
		Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
	}

	#endregion

	#region OAuth Tests

	/// <summary>
	/// Tests that GET /auth/github redirects to GitHub authorization.
	/// </summary>
	[Fact]
	public async Task GitHubLoginAsync_RedirectsToGitHubAsync()
	{
		// Act
		HttpResponseMessage response =
			await Client!.GetAsync("/api/v1/auth/github");

		// Assert
		Assert.Equal(HttpStatusCode.Redirect, response.StatusCode);
		Assert.NotNull(response.Headers.Location);
		Assert.StartsWith(
			"https://github.com/login/oauth/authorize",
			response.Headers.Location.ToString());
	}

	/// <summary>
	/// Tests that GET /auth/github sets OAuth state and code verifier cookies.
	/// </summary>
	[Fact]
	public async Task GitHubLoginAsync_SetsOAuthCookiesAsync()
	{
		// Act
		HttpResponseMessage response =
			await Client!.GetAsync("/api/v1/auth/github");

		// Assert
		Assert.True(response.Headers.Contains("Set-Cookie"));

		IEnumerable<string> cookies =
			response.Headers.GetValues("Set-Cookie");

		// Verify state and code_verifier cookies are set
		Assert.Contains(cookies, c => c.Contains("X-OAuth-State="));
		Assert.Contains(cookies, c => c.Contains("X-OAuth-CodeVerifier="));
	}

	/// <summary>
	/// Tests that GET /auth/github/callback returns error without state cookie.
	/// </summary>
	[Fact]
	public async Task GitHubCallbackAsync_NoStateCookie_ReturnsPostMessageErrorAsync()
	{
		// Act - Call callback without setting up OAuth state
		HttpResponseMessage response =
			await Client!.GetAsync("/api/v1/auth/github/callback?code=test&state=invalid");

		// Assert - Now returns HTML with postMessage instead of redirect
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		string content =
			await response.Content.ReadAsStringAsync();

		Assert.Contains("oauth_error", content);
		Assert.Contains("postMessage", content);
	}

	/// <summary>
	/// Tests that GET /auth/github/callback returns error when state is tampered.
	/// Validates CSRF protection via OAuth state parameter.
	/// </summary>
	[Fact]
	public async Task GitHubCallbackAsync_ReturnsError_WhenStateTamperedAsync()
	{
		// Arrange - Create request with mismatched state values
		string storedState =
			"legitimate-state-from-cookie";
		string tamperedState =
			"attacker-tampered-state";

		HttpRequestMessage request =
			new(HttpMethod.Get, $"/api/v1/auth/github/callback?code=test&state={tamperedState}");
		request.Headers.Add("Cookie", $"X-OAuth-State={storedState}");

		// Act
		HttpResponseMessage response =
			await Client!.SendAsync(request);

		// Assert - OAuth error response for state mismatch
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		string content =
			await response.Content.ReadAsStringAsync();

		Assert.Contains("oauth_error", content);
		Assert.Contains("postMessage", content);
	}

	/// <summary>
	/// Tests that GET /auth/github/callback returns error when code verifier cookie is missing.
	/// Validates PKCE code verifier requirement.
	/// </summary>
	[Fact]
	public async Task GitHubCallbackAsync_ReturnsError_WhenCodeVerifierMissingAsync()
	{
		// Arrange - Set valid state but no code verifier
		string validState =
			"valid-state-value";

		HttpRequestMessage request =
			new(HttpMethod.Get, $"/api/v1/auth/github/callback?code=test&state={validState}");
		request.Headers.Add("Cookie", $"X-OAuth-State={validState}");

		// Act
		HttpResponseMessage response =
			await Client!.SendAsync(request);

		// Assert - OAuth error response for missing code verifier
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		string content =
			await response.Content.ReadAsStringAsync();

		Assert.Contains("oauth_error", content);
		Assert.Contains("postMessage", content);
	}

	#endregion

	#region OAuth Code Exchange Tests

	/// <summary>
	/// Tests that POST /auth/oauth/exchange returns tokens for valid code.
	/// </summary>
	[Fact]
	public async Task ExchangeOAuthCode_ValidCode_ReturnsTokensAsync()
	{
		// Arrange - Store tokens and get code
		using IServiceScope scope =
			SharedFactory.Services.CreateScope();

		IOAuthCodeExchangeService exchangeService =
			scope.ServiceProvider.GetRequiredService<IOAuthCodeExchangeService>();

		DateTime expiresAt =
			DateTime.UtcNow.AddMinutes(15);

		string code =
			exchangeService.StoreTokens(
				"test-access-token",
				"test-refresh-token",
				expiresAt);

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync(
				"/api/v1/auth/oauth/exchange",
				new OAuthCodeExchangeRequest(code));

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		AuthResponse? authResponse =
			await response.Content.ReadFromJsonAsync<AuthResponse>();

		Assert.NotNull(authResponse);
		Assert.Equal("test-access-token", authResponse.AccessToken);
	}

	/// <summary>
	/// Tests that POST /auth/oauth/exchange returns 400 for invalid code.
	/// </summary>
	[Fact]
	public async Task ExchangeOAuthCode_InvalidCode_ReturnsBadRequestAsync()
	{
		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync(
				"/api/v1/auth/oauth/exchange",
				new OAuthCodeExchangeRequest("invalid-code"));

		// Assert
		Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

		ProblemDetails? problem =
			await response.Content.ReadFromJsonAsync<ProblemDetails>();

		Assert.NotNull(problem);
		Assert.Equal("Invalid Code", problem.Title);
	}

	/// <summary>
	/// Tests that POST /auth/oauth/exchange code can only be used once.
	/// </summary>
	[Fact]
	public async Task ExchangeOAuthCode_SameCodeTwice_SecondCallFailsAsync()
	{
		// Arrange
		using IServiceScope scope =
			SharedFactory.Services.CreateScope();

		IOAuthCodeExchangeService exchangeService =
			scope.ServiceProvider.GetRequiredService<IOAuthCodeExchangeService>();

		string code =
			exchangeService.StoreTokens(
				"test-access-token",
				"test-refresh-token",
				DateTime.UtcNow.AddMinutes(15));

		// Act - First call should succeed
		HttpResponseMessage firstResponse =
			await Client!.PostAsJsonAsync(
				"/api/v1/auth/oauth/exchange",
				new OAuthCodeExchangeRequest(code));

		// Second call with same code should fail
		HttpResponseMessage secondResponse =
			await Client!.PostAsJsonAsync(
				"/api/v1/auth/oauth/exchange",
				new OAuthCodeExchangeRequest(code));

		// Assert
		Assert.Equal(HttpStatusCode.OK, firstResponse.StatusCode);
		Assert.Equal(HttpStatusCode.BadRequest, secondResponse.StatusCode);
	}

	/// <summary>
	/// Tests that POST /auth/oauth/exchange sets refresh token cookie.
	/// </summary>
	[Fact]
	public async Task ExchangeOAuthCode_ValidCode_SetsRefreshTokenCookieAsync()
	{
		// Arrange
		using IServiceScope scope =
			SharedFactory.Services.CreateScope();

		IOAuthCodeExchangeService exchangeService =
			scope.ServiceProvider.GetRequiredService<IOAuthCodeExchangeService>();

		string code =
			exchangeService.StoreTokens(
				"test-access-token",
				"test-refresh-token",
				DateTime.UtcNow.AddMinutes(15));

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync(
				"/api/v1/auth/oauth/exchange",
				new OAuthCodeExchangeRequest(code));

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);
		Assert.Contains(
			response.Headers.GetValues("Set-Cookie"),
			c => c.Contains("X-Refresh-Token"));
	}

	#endregion

	#region Me Endpoint Tests

	/// <summary>
	/// Tests that GET /auth/me returns 401 without authentication.
	/// </summary>
	[Fact]
	public async Task GetCurrentUserAsync_Unauthenticated_ReturnsUnauthorizedAsync()
	{
		// Act
		HttpResponseMessage response =
			await Client!.GetAsync("/api/v1/auth/me");

		// Assert
		Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
	}

	/// <summary>
	/// Tests that GET /auth/me returns user profile when authenticated.
	/// </summary>
	[Fact]
	public async Task GetCurrentUserAsync_Authenticated_ReturnsProfileAsync()
	{
		// Arrange - Login to get token
		string testId =
			Guid.NewGuid().ToString("N")[..8];

		await TestUserHelper.CreateUserWithPasswordAsync(
			SharedFactory.Services,
			username: $"testuser_{testId}",
			email: $"test_{testId}@example.com");

		HttpResponseMessage loginResponse =
			await Client!.PostAsJsonAsync(
				"/api/v1/auth/login",
				new LoginRequest($"testuser_{testId}", TestUserHelper.TestPassword));

		AuthResponse? authResponse =
			await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();

		// Act
		Client!.DefaultRequestHeaders.Authorization =
			new System.Net.Http.Headers.AuthenticationHeaderValue(
				"Bearer",
				authResponse!.AccessToken);

		HttpResponseMessage response =
			await Client.GetAsync("/api/v1/auth/me");

		// Assert
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);

		UserProfileDto? profile =
			await response.Content.ReadFromJsonAsync<UserProfileDto>();

		Assert.NotNull(profile);
		Assert.Equal($"testuser_{testId}", profile.Username);
		Assert.Equal($"test_{testId}@example.com", profile.Email);
	}

	#endregion

	#region Change Password Tests

	/// <summary>
	/// Tests that POST /auth/change-password returns 401 without authentication.
	/// </summary>
	[Fact]
	public async Task ChangePasswordAsync_Unauthenticated_ReturnsUnauthorizedAsync()
	{
		// Arrange
		ChangePasswordRequest request =
			new(
				CurrentPassword: "old",
				NewPassword: "new");

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync("/api/v1/auth/change-password", request);

		// Assert
		Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
	}

	/// <summary>
	/// Tests that POST /auth/change-password returns 400 when password is too weak.
	/// Validates password complexity requirements are enforced.
	/// </summary>
	[Fact]
	public async Task ChangePasswordAsync_ReturnsBadRequest_WhenWeakPasswordAsync()
	{
		// Arrange - Login to get authenticated
		string testId =
			Guid.NewGuid().ToString("N")[..8];

		await TestUserHelper.CreateUserWithPasswordAsync(
			SharedFactory.Services,
			username: $"weakpassuser_{testId}",
			email: $"weakpass_{testId}@example.com");

		HttpResponseMessage loginResponse =
			await Client!.PostAsJsonAsync(
				"/api/v1/auth/login",
				new LoginRequest($"weakpassuser_{testId}", TestUserHelper.TestPassword));

		AuthResponse? authResponse =
			await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();

		Client!.DefaultRequestHeaders.Authorization =
			new System.Net.Http.Headers.AuthenticationHeaderValue(
				"Bearer",
				authResponse!.AccessToken);

		// Act - Try to change to a weak password (no uppercase)
		ChangePasswordRequest request =
			new(
				CurrentPassword: TestUserHelper.TestPassword,
				NewPassword: "weak123!");

		HttpResponseMessage response =
			await Client!.PostAsJsonAsync("/api/v1/auth/change-password", request);

		// Assert
		Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

		string content =
			await response.Content.ReadAsStringAsync();

		Assert.Contains("uppercase", content.ToLowerInvariant());
	}

	#endregion

	#region JWT Security Tests

	/// <summary>
	/// Tests that GET /auth/me returns 401 when JWT has an invalid signature.
	/// This verifies the API properly rejects tokens signed with a different key.
	/// </summary>
	[Fact]
	public async Task GetCurrentUserAsync_ReturnsUnauthorized_WhenInvalidJwtSignatureAsync()
	{
		// Arrange - Create a JWT signed with the wrong secret key
		string invalidToken =
			JwtTestHelper.GenerateTokenWithWrongKey(
				userId: 1,
				username: "testuser",
				email: "test@example.com");

		Client!.DefaultRequestHeaders.Authorization =
			new System.Net.Http.Headers.AuthenticationHeaderValue(
				"Bearer",
				invalidToken);

		// Act
		HttpResponseMessage response =
			await Client.GetAsync("/api/v1/auth/me");

		// Assert
		Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
	}

	/// <summary>
	/// Tests that GET /auth/me returns 401 when JWT is expired.
	/// This verifies the API properly rejects expired tokens.
	/// </summary>
	/// <remarks>
	/// Note: The token uses a test signing key, so the API validates signature first.
	/// This test verifies that malformed/tampered expired tokens are rejected.
	/// A separate test with a correctly-signed expired token would be needed
	/// to test the X-Token-Expired header behavior.
	/// </remarks>
	[Fact]
	public async Task GetCurrentUserAsync_ReturnsUnauthorized_WhenExpiredJwtAsync()
	{
		// Arrange - Create an expired JWT (signed with test key, not production key)
		string expiredToken =
			JwtTestHelper.GenerateExpiredToken(
				userId: 1,
				username: "testuser",
				email: "test@example.com");

		Client!.DefaultRequestHeaders.Authorization =
			new System.Net.Http.Headers.AuthenticationHeaderValue(
				"Bearer",
				expiredToken);

		// Act
		HttpResponseMessage response =
			await Client.GetAsync("/api/v1/auth/me");

		// Assert - Token should be rejected with 401
		// (fails signature validation since using test key)
		Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
	}

	#endregion

	#region Self-Registration Tests

	/// <summary>
	/// Tests that POST /auth/register/initiate returns 200 OK for valid email.
	/// Returns 200 regardless of whether email exists (prevents enumeration).
	/// </summary>
	[Fact]
	public async Task InitiateRegistrationAsync_ValidEmail_ReturnsOkAsync()
	{
		// Arrange
		string testId =
			Guid.NewGuid().ToString("N")[..8];

		InitiateRegistrationRequest request =
			new($"newuser_{testId}@example.com");

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync("/api/v1/auth/register/initiate", request);

		// Assert - Should return OK regardless
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);
	}

	/// <summary>
	/// Tests that POST /auth/register/initiate returns 200 OK even for existing email.
	/// Prevents email enumeration attacks.
	/// </summary>
	[Fact]
	public async Task InitiateRegistrationAsync_ExistingEmail_ReturnsOkAsync()
	{
		// Arrange - Create existing user
		string testId =
			Guid.NewGuid().ToString("N")[..8];

		await TestUserHelper.CreateUserWithPasswordAsync(
			SharedFactory.Services,
			username: $"existing_{testId}",
			email: $"existing_{testId}@example.com");

		InitiateRegistrationRequest request =
			new($"existing_{testId}@example.com");

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync("/api/v1/auth/register/initiate", request);

		// Assert - Should return OK to prevent enumeration
		Assert.Equal(HttpStatusCode.OK, response.StatusCode);
	}

	/// <summary>
	/// Tests that POST /auth/register/complete returns 400 for invalid token.
	/// </summary>
	[Fact]
	public async Task CompleteRegistrationAsync_InvalidToken_ReturnsBadRequestAsync()
	{
		// Arrange
		CompleteRegistrationRequest request =
			new(
				Token: "invalid-token",
				Username: "newuser",
				Password: "SecurePass123!");

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync("/api/v1/auth/register/complete", request);

		// Assert
		Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

		ProblemDetails? problemDetails =
			await response.Content.ReadFromJsonAsync<ProblemDetails>();

		Assert.NotNull(problemDetails);
		Assert.Equal("Registration Failed", problemDetails.Title);
	}

	/// <summary>
	/// Tests that POST /auth/register/complete creates user with valid token.
	/// </summary>
	[Fact]
	public async Task CompleteRegistrationAsync_ValidToken_ReturnsCreatedAsync()
	{
		// Arrange - Create verification token directly
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		string email =
			$"newuser_{testId}@example.com";
		string token =
			Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

		using (IServiceScope scope = SharedFactory.Services.CreateScope())
		{
			IdentityDbContext context =
				scope.ServiceProvider.GetRequiredService<IdentityDbContext>();

			context.EmailVerificationTokens.Add(new EmailVerificationToken
			{
				Email = email,
				Token = token,
				ExpiresAt = DateTime.UtcNow.AddHours(24),
				CreateDate = DateTime.UtcNow,
				IsUsed = false,
			});

			await context.SaveChangesAsync();
		}

		CompleteRegistrationRequest request =
			new(
				Token: token,
				Username: $"newuser_{testId}",
				Password: "SecurePass123!");

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync("/api/v1/auth/register/complete", request);

		// Assert
		Assert.Equal(HttpStatusCode.Created, response.StatusCode);

		AuthResponse? authResponse =
			await response.Content.ReadFromJsonAsync<AuthResponse>();

		Assert.NotNull(authResponse);
		Assert.NotEmpty(authResponse.AccessToken);
	}

	#endregion
}