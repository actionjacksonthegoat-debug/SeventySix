// <copyright file="OAuthController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using SeventySix.Api.Configuration;
using SeventySix.Api.Extensions;
using SeventySix.Api.Infrastructure;
using SeventySix.Identity;
using SeventySix.Shared.Constants;
using SeventySix.Shared.Extensions;
using Wolverine;

namespace SeventySix.Api.Controllers;

/// <summary>
/// OAuth authentication API endpoints.
/// Handles provider-agnostic OAuth login, callback, code exchange, and account linking flows.
/// </summary>
/// <param name="oAuthService">
/// Service for OAuth operations.
/// </param>
/// <param name="oAuthCodeExchange">
/// Service for OAuth code exchange.
/// </param>
/// <param name="messageBus">
/// Wolverine message bus for CQRS commands/queries.
/// </param>
/// <param name="cookieService">
/// Service for authentication cookie management.
/// </param>
/// <param name="authSettings">
/// Authentication settings.
/// </param>
/// <param name="logger">
/// Logger for OAuth operations.
/// </param>
[ApiController]
[Route(ApiVersionConfig.VersionedRoutePrefix + "/auth/oauth")]
public class OAuthController(
	IOAuthService oAuthService,
	IOAuthCodeExchangeService oAuthCodeExchange,
	IMessageBus messageBus,
	IAuthCookieService cookieService,
	IOptions<AuthSettings> authSettings,
	ILogger<OAuthController> logger) : AuthControllerBase(cookieService, authSettings, logger)
{
	/// <summary>
	/// Initiates OAuth login flow for the specified provider.
	/// </summary>
	/// <param name="provider">
	/// The OAuth provider name (e.g., "github").
	/// </param>
	/// <returns>
	/// Redirect to the provider's authorization page.
	/// </returns>
	/// <response code="302">Redirect to OAuth provider.</response>
	/// <response code="404">Provider not configured.</response>
	[HttpGet("{provider}")]
	[ProducesResponseType(StatusCodes.Status302Found)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status404NotFound)]
	public IActionResult Login([FromRoute] string provider)
	{
		OAuthProviderSettings? providerSettings =
			FindProviderSettings(provider);

		if (providerSettings is null)
		{
			return ProviderNotFoundResult(provider);
		}

		string state =
			CryptoExtensions.GenerateSecureToken();

		string codeVerifier =
			CryptoExtensions.GeneratePkceCodeVerifier();

		// Store state and code verifier in cookies for callback validation
		CookieService.SetOAuthStateCookie(state);
		CookieService.SetOAuthCodeVerifierCookie(codeVerifier);

		string redirectUri =
			BuildRedirectUri(provider);

		string authorizationUrl =
			oAuthService.BuildAuthorizationUrl(
				provider,
				redirectUri,
				state,
				codeVerifier);

		return Redirect(authorizationUrl);
	}

	/// <summary>
	/// Handles OAuth callback for the specified provider.
	/// </summary>
	/// <param name="provider">
	/// The OAuth provider name.
	/// </param>
	/// <param name="code">
	/// Authorization code from the provider.
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
	[HttpGet("{provider}/callback")]
	[EnableRateLimiting(RateLimitPolicyConstants.AuthRegister)]
	[ProducesResponseType(StatusCodes.Status200OK)]
	public async Task<IActionResult> CallbackAsync(
		[FromRoute] string provider,
		[FromQuery] string code,
		[FromQuery] string state,
		CancellationToken cancellationToken)
	{
		// Check if this is an account linking flow (data stored in cache, not cookies)
		OAuthLinkFlowData? linkFlowData =
			oAuthCodeExchange.RetrieveLinkFlow(state);

		if (linkFlowData is not null)
		{
			return await HandleLinkCallbackAsync(
				provider,
				code,
				linkFlowData,
				cancellationToken);
		}

		// Standard login flow — validate state from cookies
		string? storedState =
			CookieService.GetOAuthState();

		if (string.IsNullOrEmpty(storedState) || storedState != state)
		{
			Logger.LogWarning(
				"OAuth state mismatch for provider {Provider}",
				provider);
			return CreateOAuthErrorResponse(OAuthProviderConstants.ErrorMessages.InvalidOAuthState);
		}

		// Get code verifier
		string? codeVerifier =
			CookieService.GetOAuthCodeVerifier();

		if (string.IsNullOrEmpty(codeVerifier))
		{
			Logger.LogWarning(
				"OAuth code verifier missing for provider {Provider}",
				provider);
			return CreateOAuthErrorResponse(OAuthProviderConstants.ErrorMessages.MissingCodeVerifier);
		}

		string? clientIp = GetClientIpAddress();

		string redirectUri =
			BuildRedirectUri(provider);

		AuthResult result =
			await oAuthService.HandleCallbackAsync(
				provider,
				code,
				redirectUri,
				codeVerifier,
				clientIp,
				cancellationToken);

		CookieService.ClearOAuthCookies();

		if (!result.Success)
		{
			Logger.LogWarning(
				"OAuth failed for provider {Provider}. Error: {Error}",
				provider,
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

		// Don't set refresh token cookie here — it will be set during code exchange
		// This ensures the cookie is set on the main domain, not the popup
		return CreateOAuthSuccessResponse(
			oAuthCodeExchange,
			validatedResult);
	}

	/// <summary>
	/// Handles the callback for an OAuth account linking flow.
	/// </summary>
	/// <param name="provider">
	/// The OAuth provider name.
	/// </param>
	/// <param name="code">
	/// Authorization code from the provider.
	/// </param>
	/// <param name="linkFlowData">
	/// The cached link flow data containing user ID and code verifier.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// HTML response with postMessage indicating link success or failure.
	/// </returns>
	private async Task<IActionResult> HandleLinkCallbackAsync(
		string provider,
		string code,
		OAuthLinkFlowData linkFlowData,
		CancellationToken cancellationToken)
	{
		string redirectUri =
			BuildRedirectUri(provider);

		OAuthUserInfo? userInfo =
			await oAuthService.ExchangeCodeForUserInfoAsync(
				provider,
				code,
				redirectUri,
				linkFlowData.CodeVerifier,
				cancellationToken);

		if (userInfo is null)
		{
			return CreateOAuthErrorResponse(
				OAuthProviderConstants.ErrorMessages.CallbackFailed(provider));
		}

		SeventySix.Shared.POCOs.Result linkResult =
			await messageBus.InvokeAsync<SeventySix.Shared.POCOs.Result>(
				new LinkExternalLoginCommand(
					linkFlowData.UserId,
					provider,
					userInfo.ProviderId,
					userInfo.FullName),
				cancellationToken);

		if (!linkResult.IsSuccess)
		{
			return CreateOAuthErrorResponse(
				linkResult.Error ?? OAuthProviderConstants.ErrorMessages.FailedToLinkAccount);
		}

		return CreateOAuthLinkSuccessResponse();
	}

	/// <summary>
	/// Exchanges an OAuth authorization code for tokens.
	/// The code is a one-time use token from the OAuth callback.
	/// </summary>
	/// <remarks>
	/// The OAuth flow uses a code exchange approach:
	/// 1. Popup receives OAuth callback with one-time code
	/// 2. Popup posts the code to parent window via postMessage
	/// 3. Parent calls this endpoint to exchange the code for real tokens
	///
	/// This is provider-agnostic — the code is already mapped to tokens server-side.
	/// </remarks>
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
					Title = ProblemDetailConstants.Titles.InvalidCode,
					Detail =
						ProblemDetailConstants.Details.InvalidOrExpiredCode,
					Status =
						StatusCodes.Status400BadRequest,
				});
		}

		CookieService.SetRefreshTokenCookie(
			result.RefreshToken,
			rememberMe: false);

		return Ok(
			new AuthResponse(
				AccessToken: result.AccessToken,
				ExpiresAt: result.ExpiresAt,
				Email: result.Email,
				FullName: result.FullName,
				RequiresPasswordChange: result.RequiresPasswordChange));
	}

	/// <summary>
	/// Gets the user's linked OAuth providers.
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// List of linked external logins.
	/// </returns>
	/// <response code="200">List of linked providers.</response>
	[HttpGet("linked")]
	[Authorize]
	[ProducesResponseType(
		typeof(IReadOnlyList<ExternalLoginDto>),
		StatusCodes.Status200OK)]
	public async Task<ActionResult<IReadOnlyList<ExternalLoginDto>>> GetLinkedProvidersAsync(
		CancellationToken cancellationToken)
	{
		if (User.GetUserId() is not long userId)
		{
			return Unauthorized();
		}

		IReadOnlyList<ExternalLoginDto> result =
			await messageBus.InvokeAsync<IReadOnlyList<ExternalLoginDto>>(
				new GetExternalLoginsQuery(userId),
				cancellationToken);

		return Ok(result);
	}

	/// <summary>
	/// Initiates OAuth linking flow for the specified provider (authenticated users only).
	/// Returns the authorization URL for the client to open in a popup.
	/// </summary>
	/// <param name="provider">
	/// The OAuth provider name to link.
	/// </param>
	/// <returns>
	/// The authorization URL to open in a popup window.
	/// </returns>
	/// <response code="200">Authorization URL for popup.</response>
	/// <response code="404">Provider not configured.</response>
	[HttpPost("link/{provider}")]
	[Authorize]
	[ProducesResponseType(typeof(OAuthLinkInitiateResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status404NotFound)]
	public IActionResult InitiateLink([FromRoute] string provider)
	{
		if (User.GetUserId() is not long userId)
		{
			return Unauthorized();
		}

		OAuthProviderSettings? providerSettings =
			FindProviderSettings(provider);

		if (providerSettings is null)
		{
			return ProviderNotFoundResult(provider);
		}

		string state =
			CryptoExtensions.GenerateSecureToken();

		string codeVerifier =
			CryptoExtensions.GeneratePkceCodeVerifier();

		// Store link flow data in cache (not cookies — popup can't send JWT in redirect)
		oAuthCodeExchange.StoreLinkFlow(
			state,
			new OAuthLinkFlowData(userId, codeVerifier, provider));

		string redirectUri =
			BuildRedirectUri(provider);

		string authorizationUrl =
			oAuthService.BuildAuthorizationUrl(
				provider,
				redirectUri,
				state,
				codeVerifier);

		return Ok(
			new OAuthLinkInitiateResponse(authorizationUrl));
	}

	/// <summary>
	/// Unlinks an OAuth provider from the authenticated user's account.
	/// </summary>
	/// <param name="provider">
	/// The OAuth provider name to unlink.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// No content on success, or error if unlinking would lock out the user.
	/// </returns>
	/// <response code="204">Provider unlinked successfully.</response>
	/// <response code="400">Unlinking would lock out the user.</response>
	[HttpDelete("link/{provider}")]
	[Authorize]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest)]
	public async Task<IActionResult> UnlinkProviderAsync(
		[FromRoute] string provider,
		CancellationToken cancellationToken)
	{
		if (User.GetUserId() is not long userId)
		{
			return Unauthorized();
		}

		SeventySix.Shared.POCOs.Result result =
			await messageBus.InvokeAsync<SeventySix.Shared.POCOs.Result>(
				new UnlinkExternalLoginCommand(userId, provider),
				cancellationToken);

		if (!result.IsSuccess)
		{
			return BadRequest(
				new ProblemDetails
				{
					Title = ProblemDetailConstants.Titles.UnlinkFailed,
					Detail = result.Error,
					Status = StatusCodes.Status400BadRequest,
				});
		}

		return NoContent();
	}

	/// <summary>
	/// Builds the redirect URI dynamically from the current request.
	/// </summary>
	/// <param name="provider">
	/// The OAuth provider name.
	/// </param>
	/// <returns>
	/// The full redirect URI for the callback endpoint.
	/// </returns>
	private string BuildRedirectUri(string provider)
	{
		// Check for override in provider settings first
		OAuthProviderSettings? settings =
			FindProviderSettings(provider);

		if (settings is not null
			&& !string.IsNullOrEmpty(settings.RedirectUri))
		{
			return settings.RedirectUri;
		}

		// Derive from request (handles all environments via ForwardedHeaders)
		return $"{Request.Scheme}://{Request.Host}/{ApiVersionConfig.VersionedRoutePrefix}/auth/oauth/{provider.ToLowerInvariant()}/callback";
	}

	/// <summary>
	/// Finds provider settings by name (case-insensitive).
	/// </summary>
	/// <param name="provider">
	/// The provider name.
	/// </param>
	/// <returns>
	/// Provider settings or null if not configured.
	/// </returns>
	private OAuthProviderSettings? FindProviderSettings(string provider)
	{
		return AuthSettings.Value.OAuth.Providers.FirstOrDefault(
			providerConfig => string.Equals(
				providerConfig.Provider,
				provider,
				StringComparison.OrdinalIgnoreCase));
	}

	/// <summary>
	/// Creates a 404 result for unconfigured providers.
	/// </summary>
	/// <param name="provider">
	/// The provider name.
	/// </param>
	/// <returns>
	/// Not found result with ProblemDetails.
	/// </returns>
	private static ObjectResult ProviderNotFoundResult(string provider)
	{
		return new ObjectResult(
			new ProblemDetails
			{
				Title = ProblemDetailConstants.Titles.ProviderNotFound,
				Detail =
					OAuthProviderConstants.ErrorMessages.ProviderNotConfigured(
						provider),
				Status = StatusCodes.Status404NotFound,
			})
		{
			StatusCode = StatusCodes.Status404NotFound,
		};
	}
}