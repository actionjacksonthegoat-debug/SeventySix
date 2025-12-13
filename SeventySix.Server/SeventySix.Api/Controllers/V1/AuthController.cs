// <copyright file="AuthController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using SeventySix.Api.Configuration;
using SeventySix.Api.Extensions;
using SeventySix.Identity;
using SeventySix.Shared;
using Wolverine;

namespace SeventySix.Api.Controllers;

/// <summary>
/// Authentication API endpoints.
/// Provides login, registration, token refresh, and OAuth operations.
/// </summary>
/// <remarks>
/// Design Principles:
/// - Refresh tokens stored in HTTP-only cookies (secure)
/// - Access tokens returned in response body
/// - PKCE flow for OAuth (code verifier in session/cookie)
/// - OAuth uses code exchange pattern to avoid token exposure in postMessage
/// </remarks>
[ApiController]
[Route(ApiVersionConfig.VersionedRoutePrefix + "/auth")]
public class AuthController(
	IMessageBus messageBus,
	IOAuthService oAuthService,
	IOAuthCodeExchangeService oauthCodeExchange,
	IOptions<AuthSettings> authSettings,
	IOptions<JwtSettings> jwtSettings,
	ILogger<AuthController> logger) : ControllerBase
{
	/// <summary>
	/// Authenticates a user with username/email and password.
	/// </summary>
	/// <param name="request">Login credentials.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Access token and sets refresh token cookie.</returns>
	/// <response code="200">Authentication successful.</response>
	/// <response code="400">Invalid credentials or validation error.</response>
	/// <response code="401">Authentication failed.</response>
	/// <response code="429">Too many login attempts.</response>
	[HttpPost("login")]
	[EnableRateLimiting(RateLimitPolicyConstants.AuthLogin)]
	[ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
	[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
	[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
	public async Task<ActionResult<AuthResponse>> LoginAsync(
		[FromBody] LoginRequest request,
		CancellationToken cancellationToken)
	{
		string? clientIp =
			GetClientIpAddress();

		AuthResult result =
			await messageBus.InvokeAsync<AuthResult>(
				new LoginCommand(
					request,
					clientIp),
				cancellationToken);

		if (!result.Success)
		{
			logger.LogWarning(
				"Login failed. Error: {Error}, Code: {ErrorCode}",
				result.Error,
				result.ErrorCode);

			return Unauthorized(new ProblemDetails
			{
				Title = "Authentication Failed",
				Detail = result.Error,
				Status = StatusCodes.Status401Unauthorized,
				Extensions = { ["errorCode"] = result.ErrorCode }
			});
		}

		SetRefreshTokenCookie(result.RefreshToken!);

		return Ok(new AuthResponse(
			AccessToken: result.AccessToken!,
			ExpiresAt: result.ExpiresAt!.Value,
			RequiresPasswordChange: result.RequiresPasswordChange));
	}

	/// <summary>
	/// Registers a new user account.
	/// </summary>
	/// <param name="request">Registration details.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Access token and sets refresh token cookie.</returns>
	/// <response code="201">Registration successful.</response>
	/// <response code="400">Validation error or username/email taken.</response>
	/// <response code="429">Too many registration attempts.</response>
	[HttpPost("register")]
	[EnableRateLimiting(RateLimitPolicyConstants.AuthRegister)]
	[ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
	[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
	[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
	public async Task<ActionResult<AuthResponse>> RegisterAsync(
		[FromBody] RegisterRequest request,
		CancellationToken cancellationToken)
	{
		string? clientIp =
			GetClientIpAddress();

		AuthResult result =
			await messageBus.InvokeAsync<AuthResult>(
				new RegisterCommand(
					request,
					clientIp),
				cancellationToken);

		if (!result.Success)
		{
			logger.LogWarning(
				"Registration failed. Error: {Error}, Code: {ErrorCode}",
				result.Error,
				result.ErrorCode);

			return BadRequest(new ProblemDetails
			{
				Title = "Registration Failed",
				Detail = result.Error,
				Status = StatusCodes.Status400BadRequest,
				Extensions = { ["errorCode"] = result.ErrorCode }
			});
		}

		SetRefreshTokenCookie(result.RefreshToken!);

		return StatusCode(
			StatusCodes.Status201Created,
			new AuthResponse(
				AccessToken: result.AccessToken!,
				ExpiresAt: result.ExpiresAt!.Value,
				RequiresPasswordChange: result.RequiresPasswordChange));
	}

	/// <summary>
	/// Refreshes the access token using the refresh token cookie.
	/// </summary>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>New access token and rotates refresh token cookie.</returns>
	/// <response code="200">Token refresh successful.</response>
	/// <response code="401">Invalid or expired refresh token.</response>
	/// <response code="429">Too many refresh attempts.</response>
	[HttpPost("refresh")]
	[EnableRateLimiting(RateLimitPolicyConstants.AuthRefresh)]
	[ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
	[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
	public async Task<ActionResult<AuthResponse>> RefreshAsync(
		CancellationToken cancellationToken)
	{
		string? refreshToken =
			Request.Cookies[authSettings.Value.Cookie.RefreshTokenCookieName];

		if (string.IsNullOrEmpty(refreshToken))
		{
			return Unauthorized(new ProblemDetails
			{
				Title = "Authentication Failed",
				Detail = "No refresh token provided.",
				Status = StatusCodes.Status401Unauthorized
			});
		}

		string? clientIp =
			GetClientIpAddress();

		AuthResult result =
			await messageBus.InvokeAsync<AuthResult>(
				new RefreshTokensCommand(
					refreshToken,
					clientIp),
				cancellationToken);

		if (!result.Success)
		{
			ClearRefreshTokenCookie();

			return Unauthorized(new ProblemDetails
			{
				Title = "Authentication Failed",
				Detail = result.Error,
				Status = StatusCodes.Status401Unauthorized,
				Extensions = { ["errorCode"] = result.ErrorCode }
			});
		}

		SetRefreshTokenCookie(result.RefreshToken!);

		return Ok(new AuthResponse(
			AccessToken: result.AccessToken!,
			ExpiresAt: result.ExpiresAt!.Value,
			RequiresPasswordChange: result.RequiresPasswordChange));
	}

	/// <summary>
	/// Logs out the user by revoking the refresh token.
	/// </summary>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>No content on success.</returns>
	/// <response code="204">Logout successful.</response>
	[HttpPost("logout")]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	public async Task<IActionResult> LogoutAsync(
		CancellationToken cancellationToken)
	{
		string? refreshToken =
			Request.Cookies[authSettings.Value.Cookie.RefreshTokenCookieName];

		if (!string.IsNullOrEmpty(refreshToken))
		{
			await messageBus.InvokeAsync<bool>(
				refreshToken,
				cancellationToken);
		}

		ClearRefreshTokenCookie();
		ClearOAuthCookies();

		return NoContent();
	}

	/// <summary>
	/// Initiates GitHub OAuth login flow.
	/// </summary>
	/// <returns>Redirect to GitHub authorization page.</returns>
	/// <response code="302">Redirect to GitHub.</response>
	[HttpGet("github")]
	[ProducesResponseType(StatusCodes.Status302Found)]
	public IActionResult GitHubLogin()
	{
		string state =
			CryptoExtensions.GenerateSecureToken();

		string codeVerifier =
			CryptoExtensions.GeneratePkceCodeVerifier();

		// Store state and code verifier in cookies for callback validation
		SetOAuthStateCookie(state);
		SetOAuthCodeVerifierCookie(codeVerifier);

		string authorizationUrl =
			oAuthService.BuildGitHubAuthorizationUrl(
				state,
				codeVerifier);

		return Redirect(authorizationUrl);
	}

	/// <summary>
	/// Handles GitHub OAuth callback.
	/// </summary>
	/// <param name="code">Authorization code from GitHub.</param>
	/// <param name="state">CSRF state parameter.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>HTML page that posts result to parent window via postMessage.</returns>
	/// <response code="200">HTML response with postMessage to parent window.</response>
	[HttpGet("github/callback")]
	[ProducesResponseType(StatusCodes.Status200OK)]
	public async Task<IActionResult> GitHubCallbackAsync(
		[FromQuery] string code,
		[FromQuery] string state,
		CancellationToken cancellationToken)
	{
		// Validate state
		string? storedState =
			Request.Cookies[authSettings.Value.Cookie.OAuthStateCookieName];

		if (string.IsNullOrEmpty(storedState) || storedState != state)
		{
			logger.LogWarning("GitHub OAuth state mismatch");
			return CreateOAuthErrorResponse("Invalid OAuth state");
		}

		// Get code verifier
		string? codeVerifier =
			Request.Cookies[authSettings.Value.Cookie.OAuthCodeVerifierCookieName];

		if (string.IsNullOrEmpty(codeVerifier))
		{
			logger.LogWarning("GitHub OAuth code verifier missing");
			return CreateOAuthErrorResponse("Missing code verifier");
		}

		string? clientIp =
			GetClientIpAddress();

		AuthResult result =
			await oAuthService.HandleGitHubCallbackAsync(
				code,
				codeVerifier,
				clientIp,
				cancellationToken);

		ClearOAuthCookies();

		if (!result.Success)
		{
			logger.LogWarning(
				"GitHub OAuth failed. Error: {Error}",
				result.Error);
			return CreateOAuthErrorResponse(result.Error!);
		}

		// Don't set refresh token cookie here - it will be set during code exchange
		// This ensures the cookie is set on the main domain, not the popup
		return CreateOAuthSuccessResponse(
			result.AccessToken!,
			result.RefreshToken!,
			result.ExpiresAt!.Value);
	}

	/// <summary>
	/// Exchanges an OAuth authorization code for tokens.
	/// The code is a one-time use token from the OAuth callback.
	/// </summary>
	/// <param name="request">The authorization code.</param>
	/// <returns>Access token and sets refresh token cookie.</returns>
	/// <response code="200">Exchange successful.</response>
	/// <response code="400">Invalid or expired code.</response>
	[HttpPost("oauth/exchange")]
	[EnableRateLimiting(RateLimitPolicyConstants.AuthLogin)]
	[ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
	public ActionResult<AuthResponse> ExchangeOAuthCode(
		[FromBody] OAuthCodeExchangeRequest request)
	{
		OAuthCodeExchangeResult? result =
			oauthCodeExchange.ExchangeCode(request.Code);

		if (result is null)
		{
			logger.LogWarning("OAuth code exchange failed - invalid or expired code");
			return BadRequest(new ProblemDetails
			{
				Title = "Invalid Code",
				Detail = "The authorization code is invalid or has expired.",
				Status = StatusCodes.Status400BadRequest
			});
		}

		SetRefreshTokenCookie(result.RefreshToken);

		return Ok(new AuthResponse(
			AccessToken: result.AccessToken,
			ExpiresAt: result.ExpiresAt,
			RequiresPasswordChange: false));
	}

	/// <summary>
	/// Gets the current authenticated user's profile.
	/// </summary>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>User profile information.</returns>
	/// <response code="200">Returns user profile.</response>
	/// <response code="401">Not authenticated.</response>
	/// <response code="404">User not found.</response>
	[HttpGet("me")]
	[Authorize]
	[ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status401Unauthorized)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	public async Task<ActionResult<UserProfileDto>> GetCurrentUserAsync(
		CancellationToken cancellationToken)
	{
		if (User.GetUserId() is not int userId)
		{
			return Unauthorized();
		}

		UserProfileDto? profile =
			await messageBus.InvokeAsync<UserProfileDto?>(
				new GetUserProfileQuery(userId),
				cancellationToken);

		if (profile is null)
		{
			return NotFound();
		}

		return Ok(profile);
	}

	/// <summary>
	/// Changes the current user's password.
	/// </summary>
	/// <param name="request">Password change request.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>No content on success.</returns>
	/// <response code="204">Password changed successfully.</response>
	/// <response code="400">Invalid current password or validation error.</response>
	/// <response code="401">Not authenticated.</response>
	[HttpPost("change-password")]
	[Authorize]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status401Unauthorized)]
	public async Task<IActionResult> ChangePasswordAsync(
		[FromBody] ChangePasswordRequest request,
		CancellationToken cancellationToken)
	{
		if (User.GetUserId() is not int userId)
		{
			return Unauthorized();
		}

		AuthResult result =
			await messageBus.InvokeAsync<AuthResult>(
				new ChangePasswordCommand(
					userId,
					request),
				cancellationToken);

		if (!result.Success)
		{
			return BadRequest(new ProblemDetails
			{
				Title = "Password Change Failed",
				Detail = result.Error,
				Status = StatusCodes.Status400BadRequest,
				Extensions = { ["errorCode"] = result.ErrorCode }
			});
		}

		// Clear refresh token after password change
		ClearRefreshTokenCookie();

		return NoContent();
	}

	/// <summary>
	/// Initiates password reset for a user by email.
	/// </summary>
	/// <remarks>
	/// Always returns 200 OK to prevent email enumeration attacks.
	/// Email is only sent if the user exists and is active.
	/// </remarks>
	/// <param name="request">Forgot password request with email.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>200 OK regardless of whether email exists.</returns>
	/// <response code="200">Request processed (email sent if user exists).</response>
	/// <response code="400">Invalid email format.</response>
	/// <response code="429">Too many requests.</response>
	[HttpPost("forgot-password")]
	[EnableRateLimiting(RateLimitPolicyConstants.AuthLogin)]
	[ProducesResponseType(StatusCodes.Status200OK)]
	[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
	[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
	public async Task<IActionResult> ForgotPasswordAsync(
		[FromBody] ForgotPasswordRequest request,
		CancellationToken cancellationToken)
	{
		await messageBus.InvokeAsync(
			request.Email,
			cancellationToken);

		// Always return OK to prevent email enumeration
		return Ok(new { message = "If an account exists with this email, a reset link has been sent." });
	}

	/// <summary>
	/// Sets a new password using a password reset token.
	/// </summary>
	/// <remarks>
	/// Used for both:
	/// - New user welcome flow (initial password setup from welcome email)
	/// - Forgot password flow (password reset from reset email).
	///
	/// On success, returns auth tokens for immediate login.
	/// </remarks>
	/// <param name="request">Set password request with token and new password.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Access token and sets refresh token cookie.</returns>
	/// <response code="200">Password set successfully, includes auth tokens.</response>
	/// <response code="400">Invalid token, expired token, or validation error.</response>
	[HttpPost("set-password")]
	[ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
	public async Task<ActionResult<AuthResponse>> SetPasswordAsync(
		[FromBody] SetPasswordRequest request,
		CancellationToken cancellationToken)
	{
		string? clientIp =
			GetClientIpAddress();

		AuthResult result =
			await messageBus.InvokeAsync<AuthResult>(
				new SetPasswordCommand(
					request,
					clientIp),
				cancellationToken);

		if (!result.Success)
		{
			logger.LogWarning(
				"Set password failed. Error: {Error}, Code: {ErrorCode}",
				result.Error,
				result.ErrorCode);

			return BadRequest(new ProblemDetails
			{
				Title = "Set Password Failed",
				Detail = result.Error,
				Status = StatusCodes.Status400BadRequest,
				Extensions = { ["errorCode"] = result.ErrorCode }
			});
		}

		SetRefreshTokenCookie(result.RefreshToken!);

		return Ok(new AuthResponse(
			AccessToken: result.AccessToken!,
			ExpiresAt: result.ExpiresAt!.Value,
			RequiresPasswordChange: false));
	}

	/// <summary>
	/// Initiates user self-registration by sending a verification email.
	/// </summary>
	/// <remarks>
	/// Creates a verification token and sends an email with a link to complete registration.
	/// The token expires after a configured time period.
	/// Always returns OK to prevent email enumeration attacks.
	/// </remarks>
	/// <param name="request">Registration initiation request with email.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>200 OK regardless of whether email is available.</returns>
	/// <response code="200">Request processed (email sent if valid).</response>
	/// <response code="400">Invalid email format.</response>
	/// <response code="429">Too many requests.</response>
	[HttpPost("register/initiate")]
	[EnableRateLimiting(RateLimitPolicyConstants.AuthLogin)]
	[ProducesResponseType(StatusCodes.Status200OK)]
	[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
	[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
	public async Task<IActionResult> InitiateRegistrationAsync(
		[FromBody] InitiateRegistrationRequest request,
		CancellationToken cancellationToken)
	{
		await messageBus.InvokeAsync(
			request,
			cancellationToken);

		// Always return OK to prevent email enumeration
		return Ok(new { message = "If this email is available, a verification link has been sent." });
	}

	/// <summary>
	/// Completes user self-registration using a verification token.
	/// </summary>
	/// <remarks>
	/// Validates the token, creates the user account, and returns auth tokens.
	/// The user can immediately start using the application after registration.
	/// </remarks>
	/// <param name="request">Registration completion request with token, username, and password.</param>
	/// <param name="cancellationToken">Cancellation token.</param>
	/// <returns>Auth tokens on success.</returns>
	/// <response code="201">Registration completed successfully, includes auth tokens.</response>
	/// <response code="400">Invalid token, expired token, or validation error.</response>
	[HttpPost("register/complete")]
	[EnableRateLimiting(RateLimitPolicyConstants.AuthLogin)]
	[ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
	[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
	public async Task<ActionResult<AuthResponse>> CompleteRegistrationAsync(
		[FromBody] CompleteRegistrationRequest request,
		CancellationToken cancellationToken)
	{
		string? clientIp =
			GetClientIpAddress();

		AuthResult result =
			await messageBus.InvokeAsync<AuthResult>(
				new CompleteRegistrationCommand(
					request,
					clientIp),
				cancellationToken);

		if (!result.Success)
		{
			logger.LogWarning(
				"Registration completion failed. Error: {Error}, Code: {ErrorCode}",
				result.Error,
				result.ErrorCode);

			return BadRequest(new ProblemDetails
			{
				Title = "Registration Failed",
				Detail = result.Error,
				Status = StatusCodes.Status400BadRequest,
				Extensions = { ["errorCode"] = result.ErrorCode }
			});
		}

		SetRefreshTokenCookie(result.RefreshToken!);

		return StatusCode(
			StatusCodes.Status201Created,
			new AuthResponse(
				AccessToken: result.AccessToken!,
				ExpiresAt: result.ExpiresAt!.Value,
				RequiresPasswordChange: false));
	}

	/// <summary>
	/// Gets client IP address from HttpContext.
	/// ForwardedHeadersMiddleware handles X-Forwarded-For validation from trusted proxies.
	/// </summary>
	private string? GetClientIpAddress() =>
		HttpContext.Connection.RemoteIpAddress?.ToString();

	/// <summary>
	/// Sets an HTTP-only secure cookie.
	/// </summary>
	private void SetSecureCookie(
		string name,
		string value,
		TimeSpan expiration,
		SameSiteMode sameSite = SameSiteMode.Strict)
	{
		CookieOptions options =
			new()
			{
				HttpOnly = true,
				Secure = authSettings.Value.Cookie.SecureCookie,
				SameSite = sameSite,
				Expires = DateTimeOffset.UtcNow.Add(expiration)
			};

		Response.Cookies.Append(
			name,
			value,
			options);
	}

	/// <summary>
	/// Deletes a cookie by name.
	/// </summary>
	private void DeleteCookie(string name) =>
		Response.Cookies.Delete(name);

	/// <summary>
	/// Sets the refresh token cookie.
	/// </summary>
	private void SetRefreshTokenCookie(string refreshToken) =>
		SetSecureCookie(
			authSettings.Value.Cookie.RefreshTokenCookieName,
			refreshToken,
			TimeSpan.FromDays(jwtSettings.Value.RefreshTokenExpirationDays));

	/// <summary>
	/// Clears the refresh token cookie.
	/// </summary>
	private void ClearRefreshTokenCookie() =>
		DeleteCookie(authSettings.Value.Cookie.RefreshTokenCookieName);

	/// <summary>
	/// Sets OAuth state cookie for CSRF protection.
	/// </summary>
	private void SetOAuthStateCookie(string state) =>
		SetSecureCookie(
			authSettings.Value.Cookie.OAuthStateCookieName,
			state,
			TimeSpan.FromMinutes(5),
			SameSiteMode.Lax);

	/// <summary>
	/// Sets OAuth code verifier cookie for PKCE.
	/// </summary>
	private void SetOAuthCodeVerifierCookie(string codeVerifier) =>
		SetSecureCookie(
			authSettings.Value.Cookie.OAuthCodeVerifierCookieName,
			codeVerifier,
			TimeSpan.FromMinutes(5),
			SameSiteMode.Lax);

	/// <summary>
	/// Clears OAuth cookies.
	/// </summary>
	private void ClearOAuthCookies()
	{
		DeleteCookie(authSettings.Value.Cookie.OAuthStateCookieName);
		DeleteCookie(authSettings.Value.Cookie.OAuthCodeVerifierCookieName);
	}

	/// <summary>
	/// Gets the allowed origin from OAuth callback URL.
	/// </summary>
	private string GetAllowedOrigin()
	{
		Uri callbackUri =
			new(authSettings.Value.OAuth.ClientCallbackUrl);

		return $"{callbackUri.Scheme}://{callbackUri.Authority}";
	}

	/// <summary>
	/// Creates HTML response that posts OAuth authorization code to parent window.
	/// Tokens are stored server-side; client exchanges code for tokens via API.
	/// </summary>
	private ContentResult CreateOAuthSuccessResponse(
		string accessToken,
		string refreshToken,
		DateTime expiresAt)
	{
		string origin =
			GetAllowedOrigin();

		// Store tokens and get one-time code (60 second TTL)
		string code =
			oauthCodeExchange.StoreTokens(
				accessToken,
				refreshToken,
				expiresAt);

		string html =
			$$"""
			<!DOCTYPE html>
			<html>
			<head><title>OAuth Complete</title></head>
			<body>
			<script>
				if (window.opener) {
					window.opener.postMessage({
						type: 'oauth_success',
						code: '{{code}}'
					}, '{{origin}}');
				}
				window.close();
			</script>
			<p>Authentication complete. This window should close automatically.</p>
			</body>
			</html>
			""";

		return Content(
			html,
			"text/html");
	}

	/// <summary>
	/// Creates HTML response that posts OAuth error to parent window.
	/// </summary>
	private ContentResult CreateOAuthErrorResponse(string error)
	{
		string origin =
			GetAllowedOrigin();

		string escapedError =
			Uri.EscapeDataString(error);

		string html =
			$$"""
			<!DOCTYPE html>
			<html>
			<head><title>OAuth Error</title></head>
			<body>
			<script>
				if (window.opener) {
					window.opener.postMessage({
						type: 'oauth_error',
						error: '{{escapedError}}'
					}, '{{origin}}');
				}
				window.close();
			</script>
			<p>Authentication failed. This window should close automatically.</p>
			</body>
			</html>
			""";

		return Content(
			html,
			"text/html");
	}
}