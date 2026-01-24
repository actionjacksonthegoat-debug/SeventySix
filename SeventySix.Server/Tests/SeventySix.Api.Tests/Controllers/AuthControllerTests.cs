// <copyright file="AuthControllerTests.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Time.Testing;
using SeventySix.Api.Tests.Fixtures;
using SeventySix.Identity;
using SeventySix.Shared.Utilities;
using SeventySix.TestUtilities.Constants;
using SeventySix.TestUtilities.TestBases;
using SeventySix.TestUtilities.TestHelpers;
using Shouldly;

namespace SeventySix.Api.Tests.Controllers;

/// <summary>
/// Integration tests for AuthController.
/// </summary>
/// <remarks>
/// Tests HTTP API endpoints for authentication operations.
/// Uses shared WebApplicationFactory for improved test performance.
/// </remarks>
[Collection(CollectionNames.IdentityAuthPostgreSql)]
public class AuthControllerTests(IdentityAuthApiPostgreSqlFixture fixture)
	: ApiPostgreSqlTestBase<Program>(fixture),
		IAsyncLifetime
{
	private HttpClient? Client;

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
			await Client!.PostAsJsonAsync(
			"/api/v1/auth/login",
			request);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);

		ProblemDetails? problemDetails =
			await response.Content.ReadFromJsonAsync<ProblemDetails>();

		problemDetails.ShouldNotBeNull();
		problemDetails.Title.ShouldBe("Authentication Failed");
	}

	/// <summary>
	/// Tests that POST /auth/login returns 200 with valid credentials.
	/// </summary>
	[Theory]
	[InlineData(true)]
	[InlineData(false)]
	public async Task LoginAsync_ValidCredentials_ReturnsTokenAsync(
		bool useEmail)
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		string username =
			$"testuser_{testId}";
		string email =
			$"test_{testId}@example.com";

		await TestUserHelper.CreateUserWithPasswordAsync(
			SharedFactory.Services,
			username,
			email,
			timeProvider);

		LoginRequest request =
			new(
			UsernameOrEmail: useEmail ? email : username,
			Password: TestUserHelper.TestPassword);

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync(
			"/api/v1/auth/login",
			request);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.OK);

		AuthResponse? authResponse =
			await response.Content.ReadFromJsonAsync<AuthResponse>();

		authResponse.ShouldNotBeNull();
		authResponse.AccessToken.ShouldNotBeNullOrEmpty();
		(authResponse.ExpiresAt > timeProvider.GetUtcNow().UtcDateTime).ShouldBeTrue();
		response.Headers.Contains("Set-Cookie").ShouldBeTrue();

		// Verify PII is in response body (not extracted from JWT)
		authResponse.Email.ShouldBe(email);
		authResponse.FullName.ShouldBeNull();
	}

	/// <summary>
	/// Tests that login returns user's full name in response when present.
	/// </summary>
	[Fact]
	public async Task LoginAsync_UserWithFullName_ReturnsFullNameInResponseAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		string username =
			$"testuser_{testId}";
		string email =
			$"test_{testId}@example.com";
		string fullName =
			"Test User";

		await TestUserHelper.CreateUserWithPasswordAsync(
			SharedFactory.Services,
			username,
			email,
			timeProvider,
			new CreateUserOptions(FullName: fullName));

		LoginRequest request =
			new(
			UsernameOrEmail: username,
			Password: TestUserHelper.TestPassword);

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync(
			"/api/v1/auth/login",
			request);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.OK);

		AuthResponse? authResponse =
			await response.Content.ReadFromJsonAsync<AuthResponse>();

		authResponse.ShouldNotBeNull();
		authResponse.Email.ShouldBe(email);
		authResponse.FullName.ShouldBe(fullName);
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
			await Client!.PostAsJsonAsync(
			"/api/v1/auth/register",
			request);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.Created);

		AuthResponse? authResponse =
			await response.Content.ReadFromJsonAsync<AuthResponse>();

		authResponse.ShouldNotBeNull();
		authResponse.AccessToken.ShouldNotBeNullOrEmpty();
	}

	/// <summary>
	/// Tests that POST /auth/register returns 400 for duplicate username or email.
	/// </summary>
	[Theory]
	[InlineData(true)]
	[InlineData(false)]
	public async Task RegisterAsync_DuplicateCredentials_ReturnsBadRequestAsync(
		bool duplicateUsername)
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		string existingUsername =
			$"existinguser_{testId}";
		string existingEmail =
			$"existing_{testId}@example.com";

		await TestUserHelper.CreateUserWithPasswordAsync(
			SharedFactory.Services,
			existingUsername,
			existingEmail,
			timeProvider);

		RegisterRequest request =
			new(
			Username: duplicateUsername
				? existingUsername
				: $"newusername_{testId}",
			Email: duplicateUsername
				? $"new_{testId}@example.com"
				: existingEmail,
			Password: "SecurePassword123!",
			FullName: null);

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync(
			"/api/v1/auth/register",
			request);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
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
			await Client!.PostAsync(
			"/api/v1/auth/refresh",
			null);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
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
		FakeTimeProvider timeProvider = new();
		string testId =
			Guid.NewGuid().ToString("N")[..8];

		await TestUserHelper.CreateUserWithPasswordAsync(
			SharedFactory.Services,
			username: $"testuser_{testId}",
			email: $"test_{testId}@example.com",
			timeProvider);

		LoginRequest request =
			new(
			UsernameOrEmail: $"testuser_{testId}",
			Password: TestUserHelper.TestPassword);

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync(
			"/api/v1/auth/login",
			request);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.OK);
		response.Headers.Contains("Set-Cookie").ShouldBeTrue();

		IEnumerable<string> cookies =
			response.Headers.GetValues("Set-Cookie");

		// Find the refresh token cookie
		string? refreshTokenCookie =
			cookies.FirstOrDefault(cookie =>
			cookie.Contains("X-Refresh-Token="));

		refreshTokenCookie.ShouldNotBeNull();

		// Verify SameSite=Strict is set (critical for CSRF protection)
		refreshTokenCookie.ToLowerInvariant().ShouldContain("samesite=strict");

		// Verify HttpOnly is set (critical for XSS protection)
		refreshTokenCookie.ToLowerInvariant().ShouldContain("httponly");
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
			await Client!.PostAsync(
			"/api/v1/auth/logout",
			null);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.NoContent);
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
			await Client!.GetAsync(
			"/api/v1/auth/github");

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.Redirect);
		response.Headers.Location.ShouldNotBeNull();
		response.Headers.Location.ToString().ShouldStartWith(
			"https://github.com/login/oauth/authorize");
	}

	/// <summary>
	/// Tests that GET /auth/github sets OAuth state and code verifier cookies.
	/// </summary>
	[Fact]
	public async Task GitHubLoginAsync_SetsOAuthCookiesAsync()
	{
		// Act
		HttpResponseMessage response =
			await Client!.GetAsync(
			"/api/v1/auth/github");

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
	/// Tests that GET /auth/github/callback returns error without state cookie.
	/// </summary>
	[Fact]
	public async Task GitHubCallbackAsync_NoStateCookie_ReturnsPostMessageErrorAsync()
	{
		// Act - Call callback without setting up OAuth state
		HttpResponseMessage response =
			await Client!.GetAsync(
			"/api/v1/auth/github/callback?code=test&state=invalid");

		// Assert - Now returns HTML with postMessage instead of redirect
		response.StatusCode.ShouldBe(HttpStatusCode.OK);

		string content =
			await response.Content.ReadAsStringAsync();

		content.ShouldContain("oauth_error");
		content.ShouldContain("postMessage");
	}

	/// <summary>
	/// Tests that GET /auth/github/callback returns error for CSRF/PKCE violations.
	/// </summary>
	[Theory]
	[InlineData(true)]
	[InlineData(false)]
	public async Task GitHubCallbackAsync_ReturnsError_WhenSecurityViolationAsync(
		bool stateTampered)
	{
		// Arrange
		string validState = "valid-state-value";
		string queryState =
			stateTampered ? "tampered-state" : validState;

		HttpRequestMessage request =
			new(
			HttpMethod.Get,
			$"/api/v1/auth/github/callback?code=test&state={queryState}");
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

		content.ShouldContain("oauth_error");
		content.ShouldContain("postMessage");
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
		FakeTimeProvider timeProvider = new();
		using IServiceScope scope =
			SharedFactory.Services.CreateScope();

		IOAuthCodeExchangeService exchangeService =
			scope.ServiceProvider.GetRequiredService<IOAuthCodeExchangeService>();

		DateTime expiresAt =
			timeProvider
			.GetUtcNow()
			.UtcDateTime.AddMinutes(15);

		string code =
			exchangeService.StoreTokens(
			"test-access-token",
			"test-refresh-token",
			expiresAt,
			"oauth@example.com",
			null);

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync(
			"/api/v1/auth/oauth/exchange",
			new OAuthCodeExchangeRequest(code));

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.OK);

		AuthResponse? authResponse =
			await response.Content.ReadFromJsonAsync<AuthResponse>();

		authResponse.ShouldNotBeNull();
		authResponse.AccessToken.ShouldBe("test-access-token");
		authResponse.Email.ShouldBe("oauth@example.com");
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
		response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);

		ProblemDetails? problem =
			await response.Content.ReadFromJsonAsync<ProblemDetails>();

		problem.ShouldNotBeNull();
		problem.Title.ShouldBe("Invalid Code");
	}

	/// <summary>
	/// Tests that POST /auth/oauth/exchange code can only be used once.
	/// </summary>
	[Fact]
	public async Task ExchangeOAuthCode_SameCodeTwice_SecondCallFailsAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		using IServiceScope scope =
			SharedFactory.Services.CreateScope();

		IOAuthCodeExchangeService exchangeService =
			scope.ServiceProvider.GetRequiredService<IOAuthCodeExchangeService>();

		string code =
			exchangeService.StoreTokens(
			"test-access-token",
			"test-refresh-token",
			timeProvider.GetUtcNow().UtcDateTime.AddMinutes(15),
			"oauth@example.com",
			null);

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
		firstResponse.StatusCode.ShouldBe(HttpStatusCode.OK);
		secondResponse.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
	}

	/// <summary>
	/// Tests that POST /auth/oauth/exchange sets refresh token cookie.
	/// </summary>
	[Fact]
	public async Task ExchangeOAuthCode_ValidCode_SetsRefreshTokenCookieAsync()
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		using IServiceScope scope =
			SharedFactory.Services.CreateScope();

		IOAuthCodeExchangeService exchangeService =
			scope.ServiceProvider.GetRequiredService<IOAuthCodeExchangeService>();

		string code =
			exchangeService.StoreTokens(
			"test-access-token",
			"test-refresh-token",
			timeProvider.GetUtcNow().UtcDateTime.AddMinutes(15),
			"oauth@example.com",
			null);

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync(
			"/api/v1/auth/oauth/exchange",
			new OAuthCodeExchangeRequest(code));

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.OK);
		response.Headers.GetValues("Set-Cookie").ShouldContain(
			cookieValue => cookieValue.Contains("X-Refresh-Token"));
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
			await Client!.GetAsync(
			ApiEndpoints.Auth.Me);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
	}

	/// <summary>
	/// Tests that GET /auth/me returns user profile when authenticated.
	/// </summary>
	[Fact]
	public async Task GetCurrentUserAsync_Authenticated_ReturnsProfileAsync()
	{
		// Arrange - Login to get token
		FakeTimeProvider timeProvider = new();
		string testId =
			Guid.NewGuid().ToString("N")[..8];

		await TestUserHelper.CreateUserWithPasswordAsync(
			SharedFactory.Services,
			username: $"testuser_{testId}",
			email: $"test_{testId}@example.com",
			timeProvider);

		HttpResponseMessage loginResponse =
			await Client!.PostAsJsonAsync(
			"/api/v1/auth/login",
			new LoginRequest(
			$"testuser_{testId}",
			TestUserHelper.TestPassword));

		AuthResponse? authResponse =
			await loginResponse.Content.ReadFromJsonAsync<AuthResponse>();

		// Act
		Client!.DefaultRequestHeaders.Authorization =
			new System.Net.Http.Headers.AuthenticationHeaderValue(
				"Bearer",
				authResponse!.AccessToken);

		HttpResponseMessage response =
			await Client.GetAsync(ApiEndpoints.Auth.Me);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.OK);

		UserProfileDto? profile =
			await response.Content.ReadFromJsonAsync<UserProfileDto>();

		profile.ShouldNotBeNull();
		profile.Username.ShouldBe($"testuser_{testId}");
		profile.Email.ShouldBe($"test_{testId}@example.com");
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
			await Client!.PostAsJsonAsync(
			"/api/v1/auth/change-password",
			request);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
	}

	/// <summary>
	/// Tests that POST /auth/change-password returns 400 when password is too weak.
	/// Validates password complexity requirements are enforced.
	/// </summary>
	[Fact]
	public async Task ChangePasswordAsync_ReturnsBadRequest_WhenWeakPasswordAsync()
	{
		// Arrange - Login to get authenticated
		FakeTimeProvider timeProvider = new();
		string testId =
			Guid.NewGuid().ToString("N")[..8];

		await TestUserHelper.CreateUserWithPasswordAsync(
			SharedFactory.Services,
			username: $"weakpassuser_{testId}",
			email: $"weakpass_{testId}@example.com",
			timeProvider);

		HttpResponseMessage loginResponse =
			await Client!.PostAsJsonAsync(
			"/api/v1/auth/login",
			new LoginRequest(
				$"weakpassuser_{testId}",
				TestUserHelper.TestPassword));

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
			await Client!.PostAsJsonAsync(
			"/api/v1/auth/change-password",
			request);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);

		string content =
			await response.Content.ReadAsStringAsync();

		// Verify validation error response contains password-related message
		content.ToLowerInvariant().ShouldContain("password");
	}
	#endregion
	#region JWT Security Tests

	/// <summary>
	/// Tests that GET /auth/me returns 401 for invalid or expired JWTs.
	/// </summary>
	[Theory]
	[InlineData(true)]
	[InlineData(false)]
	public async Task GetCurrentUserAsync_ReturnsUnauthorized_WhenInvalidJwtAsync(
		bool useInvalidSignature)
	{
		// Arrange
		FakeTimeProvider timeProvider = new();
		string invalidToken =
			useInvalidSignature
			? JwtTestHelper.GenerateTokenWithWrongKey(
				userId: 1,
				username: "testuser",
				email: "test@example.com",
				timeProvider)
			: JwtTestHelper.GenerateExpiredToken(
				userId: 1,
				username: "testuser",
				email: "test@example.com",
				timeProvider);

		Client!.DefaultRequestHeaders.Authorization =
			new System.Net.Http.Headers.AuthenticationHeaderValue(
				"Bearer",
				invalidToken);

		// Act
		HttpResponseMessage response =
			await Client.GetAsync(ApiEndpoints.Auth.Me);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.Unauthorized);
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
			new(
			$"newuser_{testId}@example.com");

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync(
			"/api/v1/auth/register/initiate",
			request);

		// Assert - Should return OK regardless
		response.StatusCode.ShouldBe(HttpStatusCode.OK);
	}

	/// <summary>
	/// Tests that POST /auth/register/initiate returns 200 OK even for existing email.
	/// Prevents email enumeration attacks.
	/// </summary>
	[Fact]
	public async Task InitiateRegistrationAsync_ExistingEmail_ReturnsOkAsync()
	{
		// Arrange - Create existing user
		FakeTimeProvider timeProvider = new();
		string testId =
			Guid.NewGuid().ToString("N")[..8];

		await TestUserHelper.CreateUserWithPasswordAsync(
			SharedFactory.Services,
			username: $"existing_{testId}",
			email: $"existing_{testId}@example.com",
			timeProvider);

		InitiateRegistrationRequest request =
			new(
			$"existing_{testId}@example.com");

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync(
			"/api/v1/auth/register/initiate",
			request);

		// Assert - Should return OK to prevent enumeration
		response.StatusCode.ShouldBe(HttpStatusCode.OK);
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
			await Client!.PostAsJsonAsync(
			"/api/v1/auth/register/complete",
			request);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);

		ProblemDetails? problemDetails =
			await response.Content.ReadFromJsonAsync<ProblemDetails>();

		problemDetails.ShouldNotBeNull();
		problemDetails.Title.ShouldBe("Registration Failed");
	}

	/// <summary>
	/// Tests that POST /auth/register/complete creates user with valid token.
	/// </summary>
	/// <remarks>
	/// With ASP.NET Core Identity, we use the full flow:
	/// 1. InitiateRegistration creates temporary user with email confirmation token
	/// 2. CompleteRegistration confirms email and activates user
	/// For this test, we skip the email verification and create user directly.
	/// </remarks>
	[Fact]
	public async Task CompleteRegistrationAsync_ValidToken_ReturnsCreatedAsync()
	{
		// Arrange - Create user with email confirmation token using UserManager
		string testId =
			Guid.NewGuid().ToString("N")[..8];
		string email =
			$"newuser_{testId}@example.com";
		string username =
			$"newuser_{testId}";
		string token;

		using (IServiceScope scope =
			SharedFactory.Services.CreateScope())
		{
			UserManager<ApplicationUser> userManager =
				scope.ServiceProvider.GetRequiredService<
					UserManager<ApplicationUser>>();
			TimeProvider timeProvider =
				scope.ServiceProvider.GetRequiredService<TimeProvider>();
			DateTime now =
				timeProvider.GetUtcNow().UtcDateTime;

			// Create temporary unconfirmed user (like InitiateRegistration does)
			ApplicationUser tempUser =
				new()
				{
					UserName =
						$"temp_{testId}",
					Email = email,
					EmailConfirmed = false,
					IsActive = false,
					CreateDate = now,
					CreatedBy = "Registration",
				};

			IdentityResult createResult =
				await userManager.CreateAsync(
					tempUser);

			createResult.Succeeded.ShouldBeTrue();

			// Generate email confirmation token
			token =
				await userManager.GenerateEmailConfirmationTokenAsync(
					tempUser);
		}

		string combinedToken =
			RegistrationTokenService.Encode(email, token);

		CompleteRegistrationRequest request =
			new(
				Token: combinedToken,
				Username: username,
				Password: "SecurePass123!");

		// Act
		HttpResponseMessage response =
			await Client!.PostAsJsonAsync(
			"/api/v1/auth/register/complete",
			request);

		// Assert
		response.StatusCode.ShouldBe(HttpStatusCode.Created);

		AuthResponse? authResponse =
			await response.Content.ReadFromJsonAsync<AuthResponse>();

		authResponse.ShouldNotBeNull();
		authResponse.AccessToken.ShouldNotBeNullOrEmpty();
	}
	#endregion
}