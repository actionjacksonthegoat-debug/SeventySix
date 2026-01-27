// <copyright file="OAuthController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SeventySix.Api.Configuration;
using SeventySix.Api.Infrastructure;
using SeventySix.Identity;
using SeventySix.Shared.Extensions;

namespace SeventySix.Api.Controllers;

/// <summary>
/// OAuth authentication API endpoints.
/// Handles OAuth provider login flows (e.g., GitHub).
/// </summary>
/// <param name="oAuthService">
/// Service for OAuth operations.
/// </param>
/// <param name="oAuthCodeExchange">
/// Service for OAuth code exchange.
/// </param>
/// <param name="cookieService">
/// Service for authentication cookie management.
/// </param>
/// <param name="logger">
/// Logger for OAuth operations.
/// </param>
[ApiController]
[Route(ApiVersionConfig.VersionedRoutePrefix + "/auth/oauth")]
public class OAuthController(
	IOAuthService oAuthService,
	IOAuthCodeExchangeService oAuthCodeExchange,
	IAuthCookieService cookieService,
	ILogger<OAuthController> logger) : AuthControllerBase(cookieService, logger)
{
	/// <summary>
	/// Initiates GitHub OAuth login flow.
	/// </summary>
	/// <returns>
	/// Redirect to GitHub authorization page.
	/// </returns>
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
		CookieService.SetOAuthStateCookie(state);
		CookieService.SetOAuthCodeVerifierCookie(codeVerifier);

		string authorizationUrl =
			oAuthService.BuildGitHubAuthorizationUrl(
				state,
				codeVerifier);

		return Redirect(authorizationUrl);
	}

	/// <summary>
	/// Handles GitHub OAuth callback.
	/// </summary>
	/// <param name="code">
	/// Authorization code from GitHub.
	/// </param>
	/// <param name="state">
	/// CSRF state parameter.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// HTML page that posts result to parent window via postMessage.
	/// </returns>
	/// <response code="200">HTML response with postMessage to parent window.</response>
	[HttpGet("github/callback")]
	[EnableRateLimiting(RateLimitPolicyConstants.AuthRegister)]
	[ProducesResponseType(StatusCodes.Status200OK)]
	public async Task<IActionResult> GitHubCallbackAsync(
		[FromQuery] string code,
		[FromQuery] string state,
		CancellationToken cancellationToken)
	{
		// Validate state
		string? storedState =
			CookieService.GetOAuthState();

		if (string.IsNullOrEmpty(storedState) || storedState != state)
		{
			Logger.LogWarning("GitHub OAuth state mismatch");
			return CreateOAuthErrorResponse("Invalid OAuth state");
		}

		// Get code verifier
		string? codeVerifier =
			CookieService.GetOAuthCodeVerifier();

		if (string.IsNullOrEmpty(codeVerifier))
		{
			Logger.LogWarning("GitHub OAuth code verifier missing");
			return CreateOAuthErrorResponse("Missing code verifier");
		}

		string? clientIp = GetClientIpAddress();

		AuthResult result =
			await oAuthService.HandleGitHubCallbackAsync(
				code,
				codeVerifier,
				clientIp,
				cancellationToken);

		CookieService.ClearOAuthCookies();

		if (!result.Success)
		{
			Logger.LogWarning(
				"GitHub OAuth failed. Error: {Error}",
				result.Error);

			if (result.Error is null)
			{
				throw new InvalidOperationException(
					"Failed AuthResult must contain an Error message.");
			}

			return CreateOAuthErrorResponse(result.Error);
		}

		ValidatedAuthResult validatedResult =
			ValidateSuccessfulAuthResult(result);

		// Don't set refresh token cookie here - it will be set during code exchange
		// This ensures the cookie is set on the main domain, not the popup
		return CreateOAuthSuccessResponse(
			oAuthCodeExchange,
			validatedResult.AccessToken,
			validatedResult.RefreshToken,
			validatedResult.ExpiresAt,
			validatedResult.Email,
			validatedResult.FullName);
	}

	/// <summary>
	/// Exchanges an OAuth authorization code for tokens.
	/// The code is a one-time use token from the OAuth callback.
	/// </summary>
	/// <param name="request">
	/// The authorization code.
	/// </param>
	/// <returns>
	/// Access token and sets refresh token cookie.
	/// </returns>
	/// <response code="200">Exchange successful.</response>
	/// <response code="400">Invalid or expired code.</response>
	[HttpPost("exchange")]
	[EnableRateLimiting(RateLimitPolicyConstants.AuthLogin)]
	[ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest)]
	public ActionResult<AuthResponse> ExchangeOAuthCode(
		[FromBody] OAuthCodeExchangeRequest request)
	{
		OAuthCodeExchangeResult? result =
			oAuthCodeExchange.ExchangeCode(request.Code);

		if (result is null)
		{
			Logger.LogWarning(
				"OAuth code exchange failed - invalid or expired code");

			return BadRequest(
				new ProblemDetails
				{
					Title = "Invalid Code",
					Detail =
						"The authorization code is invalid or has expired.",
					Status =
						StatusCodes.Status400BadRequest,
				});
		}

		CookieService.SetRefreshTokenCookie(result.RefreshToken);

		return Ok(
			new AuthResponse(
				AccessToken: result.AccessToken,
				ExpiresAt: result.ExpiresAt,
				Email: result.Email,
				FullName: result.FullName,
				RequiresPasswordChange: false));
	}
}
