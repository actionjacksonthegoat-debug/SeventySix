// <copyright file="AuthController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SeventySix.Api.Configuration;
using SeventySix.Api.Extensions;
using SeventySix.Api.Infrastructure;
using SeventySix.Identity;
using SeventySix.Shared.Extensions;
using SeventySix.Shared.POCOs;
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
/// <param name="messageBus">
/// The Wolverine message bus for CQRS operations.
/// </param>
/// <param name="oAuthService">
/// Service for OAuth provider integrations.
/// </param>
/// <param name="oauthCodeExchange">
/// Service for OAuth code exchange flow.
/// </param>
/// <param name="cookieService">
/// Service for authentication cookie management.
/// </param>
/// <param name="logger">
/// Logger for authentication operations.
/// </param>
[ApiController]
[Route(ApiVersionConfig.VersionedRoutePrefix + "/auth")]
public class AuthController(
	IMessageBus messageBus,
	IOAuthService oAuthService,
	IOAuthCodeExchangeService oauthCodeExchange,
	IAuthCookieService cookieService,
	ILogger<AuthController> logger) : ControllerBase
{
	/// <summary>
	/// Authenticates a user with username/email and password.
	/// </summary>
	/// <param name="request">
	/// Login credentials.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Access token and sets refresh token cookie.
	/// </returns>
	/// <response code="200">Authentication successful.</response>
	/// <response code="400">Invalid credentials or validation error.</response>
	/// <response code="401">Authentication failed.</response>
	/// <response code="429">Too many login attempts.</response>
	[HttpPost("login")]
	[EnableRateLimiting(RateLimitPolicyConstants.AuthLogin)]
	[ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest
	)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status401Unauthorized
	)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status429TooManyRequests
	)]
	public async Task<ActionResult<AuthResponse>> LoginAsync(
		[FromBody] LoginRequest request,
		CancellationToken cancellationToken)
	{
		string? clientIp = GetClientIpAddress();

		AuthResult result =
			await messageBus.InvokeAsync<AuthResult>(
				new LoginCommand(request, clientIp),
				cancellationToken);

		if (result.RequiresMfa)
		{
			return Ok(AuthResponse.FromResult(result));
		}

		if (!result.Success)
		{
			logger.LogWarning(
				"Login failed. Error: {Error}, Code: {ErrorCode}",
				result.Error,
				result.ErrorCode);

			return Unauthorized(
				new ProblemDetails
				{
					Title = "Authentication Failed",
					Detail = result.Error,
					Status =
						StatusCodes.Status401Unauthorized,
					Extensions =
						{ ["errorCode"] = result.ErrorCode },
				});
		}

		ValidatedAuthResult validatedResult =
			ValidateSuccessfulAuthResult(result);

		cookieService.SetRefreshTokenCookie(validatedResult.RefreshToken);

		return Ok(
			new AuthResponse(
				AccessToken: validatedResult.AccessToken,
				ExpiresAt: validatedResult.ExpiresAt,
				Email: validatedResult.Email,
				FullName: validatedResult.FullName,
				RequiresPasswordChange: validatedResult.RequiresPasswordChange));
	}

	/// <summary>
	/// Refreshes the access token using the refresh token cookie.
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// New access token and rotates refresh token cookie.
	/// </returns>
	/// <response code="200">Token refresh successful.</response>
	/// <response code="401">Invalid or expired refresh token.</response>
	/// <response code="429">Too many refresh attempts.</response>
	[HttpPost("refresh")]
	[EnableRateLimiting(RateLimitPolicyConstants.AuthRefresh)]
	[ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status401Unauthorized
	)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status429TooManyRequests
	)]
	public async Task<ActionResult<AuthResponse>> RefreshAsync(
		CancellationToken cancellationToken)
	{
		string? refreshToken =
			cookieService.GetRefreshToken();

		if (string.IsNullOrEmpty(refreshToken))
		{
			return Unauthorized(
				new ProblemDetails
				{
					Title = "Authentication Failed",
					Detail = "No refresh token provided.",
					Status =
						StatusCodes.Status401Unauthorized,
				});
		}

		string? clientIp = GetClientIpAddress();

		AuthResult result =
			await messageBus.InvokeAsync<AuthResult>(
				new RefreshTokensCommand(refreshToken, clientIp),
				cancellationToken);

		if (!result.Success)
		{
			cookieService.ClearRefreshTokenCookie();

			return Unauthorized(
				new ProblemDetails
				{
					Title = "Authentication Failed",
					Detail = result.Error,
					Status =
						StatusCodes.Status401Unauthorized,
					Extensions =
						{ ["errorCode"] = result.ErrorCode },
				});
		}

		ValidatedAuthResult validatedResult =
			ValidateSuccessfulAuthResult(result);

		cookieService.SetRefreshTokenCookie(validatedResult.RefreshToken);

		return Ok(
			new AuthResponse(
				AccessToken: validatedResult.AccessToken,
				ExpiresAt: validatedResult.ExpiresAt,
				Email: validatedResult.Email,
				FullName: validatedResult.FullName,
				RequiresPasswordChange: validatedResult.RequiresPasswordChange));
	}

	/// <summary>
	/// Logs out the user by revoking the refresh token.
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// No content on success.
	/// </returns>
	/// <response code="204">Logout successful.</response>
	[HttpPost("logout")]
	[EnableRateLimiting(RateLimitPolicyConstants.AuthRefresh)]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	public async Task<IActionResult> LogoutAsync(
		CancellationToken cancellationToken)
	{
		string? refreshToken =
			cookieService.GetRefreshToken();

		if (!string.IsNullOrEmpty(refreshToken))
		{
			LogoutCommand command =
				new(refreshToken);

			await messageBus.InvokeAsync<Result>(command, cancellationToken);
		}

		cookieService.ClearRefreshTokenCookie();
		cookieService.ClearOAuthCookies();

		return NoContent();
	}

	/// <summary>
	/// Verifies an MFA code and completes authentication.
	/// </summary>
	/// <param name="request">
	/// The verification request containing challenge token and code.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Access token and sets refresh token cookie on successful verification.
	/// </returns>
	/// <response code="200">MFA verification successful.</response>
	/// <response code="400">Invalid or expired code.</response>
	/// <response code="429">Too many verification attempts.</response>
	[HttpPost("mfa/verify")]
	[EnableRateLimiting(RateLimitPolicyConstants.MfaVerify)]
	[ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest
	)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status429TooManyRequests
	)]
	public async Task<ActionResult<AuthResponse>> VerifyMfaAsync(
		[FromBody] VerifyMfaRequest request,
		CancellationToken cancellationToken)
	{
		string? clientIp = GetClientIpAddress();

		AuthResult result =
			await messageBus.InvokeAsync<AuthResult>(
				new VerifyMfaCommand(request, clientIp),
				cancellationToken);

		if (!result.Success)
		{
			logger.LogWarning(
				"MFA verification failed. Code: {ErrorCode}",
				result.ErrorCode);

			return BadRequest(
				new ProblemDetails
				{
					Title = "MFA Verification Failed",
					Detail = result.Error,
					Status =
						StatusCodes.Status400BadRequest,
					Extensions =
						{ ["errorCode"] = result.ErrorCode },
				});
		}

		ValidatedAuthResult validatedResult =
			ValidateSuccessfulAuthResult(result);

		cookieService.SetRefreshTokenCookie(validatedResult.RefreshToken);

		return Ok(
			new AuthResponse(
				AccessToken: validatedResult.AccessToken,
				ExpiresAt: validatedResult.ExpiresAt,
				Email: validatedResult.Email,
				FullName: validatedResult.FullName,
				RequiresPasswordChange: validatedResult.RequiresPasswordChange));
	}

	/// <summary>
	/// Resends the MFA verification code.
	/// </summary>
	/// <param name="request">
	/// The resend request containing challenge token.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// No content on success.
	/// </returns>
	/// <response code="204">Code resent successfully.</response>
	/// <response code="400">Invalid challenge or cooldown not elapsed.</response>
	/// <response code="429">Too many resend attempts.</response>
	[HttpPost("mfa/resend")]
	[EnableRateLimiting(RateLimitPolicyConstants.MfaResend)]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest
	)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status429TooManyRequests
	)]
	public async Task<IActionResult> ResendMfaCodeAsync(
		[FromBody] ResendMfaCodeRequest request,
		CancellationToken cancellationToken)
	{
		MfaChallengeRefreshResult result =
			await messageBus.InvokeAsync<MfaChallengeRefreshResult>(
				new ResendMfaCodeCommand(request),
				cancellationToken);

		if (!result.Success)
		{
			logger.LogWarning(
				"MFA code resend failed. Code: {ErrorCode}",
				result.ErrorCode);

			return BadRequest(
				new ProblemDetails
				{
					Title = "MFA Resend Failed",
					Detail = result.Error,
					Status =
						StatusCodes.Status400BadRequest,
					Extensions =
						{ ["errorCode"] = result.ErrorCode },
				});
		}

		return NoContent();
	}

	/// <summary>
	/// Verifies a TOTP code during MFA authentication.
	/// </summary>
	/// <param name="request">
	/// The verification request containing email and TOTP code.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Access token and sets refresh token cookie on successful verification.
	/// </returns>
	/// <response code="200">TOTP verification successful.</response>
	/// <response code="400">Invalid or expired code.</response>
	/// <response code="429">Too many verification attempts.</response>
	[HttpPost("mfa/verify-totp")]
	[EnableRateLimiting(RateLimitPolicyConstants.MfaVerify)]
	[ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest
	)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status429TooManyRequests
	)]
	public async Task<ActionResult<AuthResponse>> VerifyTotpAsync(
		[FromBody] VerifyTotpRequest request,
		CancellationToken cancellationToken)
	{
		string? clientIp = GetClientIpAddress();

		AuthResult result =
			await messageBus.InvokeAsync<AuthResult>(
				new VerifyTotpCodeCommand(request, clientIp),
				cancellationToken);

		if (!result.Success)
		{
			logger.LogWarning(
				"TOTP verification failed. Code: {ErrorCode}",
				result.ErrorCode);

			return BadRequest(
				new ProblemDetails
				{
					Title = "TOTP Verification Failed",
					Detail = result.Error,
					Status =
						StatusCodes.Status400BadRequest,
					Extensions =
						{ ["errorCode"] = result.ErrorCode },
				});
		}

		ValidatedAuthResult validatedResult =
			ValidateSuccessfulAuthResult(result);

		cookieService.SetRefreshTokenCookie(validatedResult.RefreshToken);

		return Ok(
			new AuthResponse(
				AccessToken: validatedResult.AccessToken,
				ExpiresAt: validatedResult.ExpiresAt,
				Email: validatedResult.Email,
				FullName: validatedResult.FullName,
				RequiresPasswordChange: validatedResult.RequiresPasswordChange));
	}

	/// <summary>
	/// Verifies a backup code during MFA authentication.
	/// </summary>
	/// <param name="request">
	/// The verification request containing email and backup code.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Access token and sets refresh token cookie on successful verification.
	/// </returns>
	/// <response code="200">Backup code verification successful.</response>
	/// <response code="400">Invalid or already used code.</response>
	/// <response code="429">Too many verification attempts.</response>
	[HttpPost("mfa/verify-backup")]
	[EnableRateLimiting(RateLimitPolicyConstants.MfaVerify)]
	[ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest
	)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status429TooManyRequests
	)]
	public async Task<ActionResult<AuthResponse>> VerifyBackupCodeAsync(
		[FromBody] VerifyBackupCodeRequest request,
		CancellationToken cancellationToken)
	{
		string? clientIp = GetClientIpAddress();

		AuthResult result =
			await messageBus.InvokeAsync<AuthResult>(
				new VerifyBackupCodeCommand(request, clientIp),
				cancellationToken);

		if (!result.Success)
		{
			logger.LogWarning(
				"Backup code verification failed. Code: {ErrorCode}",
				result.ErrorCode);

			return BadRequest(
				new ProblemDetails
				{
					Title = "Backup Code Verification Failed",
					Detail = result.Error,
					Status =
						StatusCodes.Status400BadRequest,
					Extensions =
						{ ["errorCode"] = result.ErrorCode },
				});
		}

		ValidatedAuthResult validatedResult =
			ValidateSuccessfulAuthResult(result);

		cookieService.SetRefreshTokenCookie(validatedResult.RefreshToken);

		return Ok(
			new AuthResponse(
				AccessToken: validatedResult.AccessToken,
				ExpiresAt: validatedResult.ExpiresAt,
				Email: validatedResult.Email,
				FullName: validatedResult.FullName,
				RequiresPasswordChange: validatedResult.RequiresPasswordChange));
	}

	/// <summary>
	/// Initiates TOTP enrollment for the authenticated user.
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// TOTP setup information including secret and QR code URI.
	/// </returns>
	/// <response code="200">TOTP enrollment initiated.</response>
	/// <response code="400">TOTP already configured or other error.</response>
	/// <response code="401">Unauthorized.</response>
	[HttpPost("totp/setup")]
	[Authorize]
	[ProducesResponseType(typeof(TotpSetupResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest
	)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status401Unauthorized
	)]
	public async Task<ActionResult<TotpSetupResponse>> InitiateTotpEnrollmentAsync(
		CancellationToken cancellationToken)
	{
		if (User.GetUserId() is not long userId)
		{
			return Unauthorized();
		}

		TotpSetupResult result =
			await messageBus.InvokeAsync<TotpSetupResult>(
				new InitiateTotpEnrollmentCommand(userId),
				cancellationToken);

		if (!result.Success)
		{
			logger.LogWarning(
				"TOTP enrollment initiation failed for user {UserId}. Code: {ErrorCode}",
				userId,
				result.ErrorCode);

			return BadRequest(
				new ProblemDetails
				{
					Title = "TOTP Enrollment Failed",
					Detail = result.Error,
					Status =
						StatusCodes.Status400BadRequest,
					Extensions =
						{ ["errorCode"] = result.ErrorCode },
				});
		}

		return Ok(
			new TotpSetupResponse(
				result.Secret!,
				result.QrCodeUri!));
	}

	/// <summary>
	/// Confirms TOTP enrollment by verifying a code from the authenticator app.
	/// </summary>
	/// <param name="request">
	/// The confirmation request containing the TOTP code.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// No content on success.
	/// </returns>
	/// <response code="204">TOTP enrollment confirmed.</response>
	/// <response code="400">Invalid code or enrollment not initiated.</response>
	/// <response code="401">Unauthorized.</response>
	[HttpPost("totp/confirm")]
	[Authorize]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest
	)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status401Unauthorized
	)]
	public async Task<IActionResult> ConfirmTotpEnrollmentAsync(
		[FromBody] ConfirmTotpEnrollmentRequest request,
		CancellationToken cancellationToken)
	{
		if (User.GetUserId() is not long userId)
		{
			return Unauthorized();
		}

		Shared.POCOs.Result result =
			await messageBus.InvokeAsync<Shared.POCOs.Result>(
				new ConfirmTotpEnrollmentCommand(userId, request),
				cancellationToken);

		if (!result.IsSuccess)
		{
			logger.LogWarning(
				"TOTP enrollment confirmation failed for user {UserId}",
				userId);

			return BadRequest(
				new ProblemDetails
				{
					Title = "TOTP Confirmation Failed",
					Detail = result.Error,
					Status =
						StatusCodes.Status400BadRequest,
				});
		}

		return NoContent();
	}

	/// <summary>
	/// Disables TOTP authentication for the authenticated user.
	/// </summary>
	/// <param name="request">
	/// The request containing password for verification.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// No content on success.
	/// </returns>
	/// <response code="204">TOTP disabled successfully.</response>
	/// <response code="400">Invalid password or TOTP not configured.</response>
	/// <response code="401">Unauthorized.</response>
	[HttpPost("totp/disable")]
	[Authorize]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest
	)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status401Unauthorized
	)]
	public async Task<IActionResult> DisableTotpAsync(
		[FromBody] DisableTotpRequest request,
		CancellationToken cancellationToken)
	{
		if (User.GetUserId() is not long userId)
		{
			return Unauthorized();
		}

		Shared.POCOs.Result result =
			await messageBus.InvokeAsync<Shared.POCOs.Result>(
				new DisableTotpCommand(userId, request),
				cancellationToken);

		if (!result.IsSuccess)
		{
			logger.LogWarning(
				"TOTP disable failed for user {UserId}",
				userId);

			return BadRequest(
				new ProblemDetails
				{
					Title = "TOTP Disable Failed",
					Detail = result.Error,
					Status =
						StatusCodes.Status400BadRequest,
				});
		}

		return NoContent();
	}

	/// <summary>
	/// Generates new backup codes for the authenticated user.
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// List of generated backup codes (shown once only).
	/// </returns>
	/// <response code="200">Backup codes generated.</response>
	/// <response code="400">Error generating codes.</response>
	/// <response code="401">Unauthorized.</response>
	[HttpPost("backup-codes")]
	[Authorize]
	[ProducesResponseType(typeof(IReadOnlyList<string>), StatusCodes.Status200OK)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest
	)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status401Unauthorized
	)]
	public async Task<ActionResult<IReadOnlyList<string>>> GenerateBackupCodesAsync(
		CancellationToken cancellationToken)
	{
		if (User.GetUserId() is not long userId)
		{
			return Unauthorized();
		}

		BackupCodesResult result =
			await messageBus.InvokeAsync<BackupCodesResult>(
				new GenerateBackupCodesCommand(userId),
				cancellationToken);

		if (!result.Success)
		{
			logger.LogWarning(
				"Backup code generation failed for user {UserId}. Code: {ErrorCode}",
				userId,
				result.ErrorCode);

			return BadRequest(
				new ProblemDetails
				{
					Title = "Backup Code Generation Failed",
					Detail = result.Error,
					Status =
						StatusCodes.Status400BadRequest,
					Extensions =
						{ ["errorCode"] = result.ErrorCode },
				});
		}

		return Ok(result.Codes);
	}

	/// <summary>
	/// Gets the count of remaining unused backup codes.
	/// </summary>
	/// <param name="backupCodeService">
	/// Backup code service for count retrieval.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// The number of remaining backup codes.
	/// </returns>
	/// <response code="200">Remaining count returned.</response>
	/// <response code="401">Unauthorized.</response>
	[HttpGet("backup-codes/remaining")]
	[Authorize]
	[ProducesResponseType(typeof(int), StatusCodes.Status200OK)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status401Unauthorized
	)]
	public async Task<ActionResult<int>> GetBackupCodesRemainingAsync(
		[FromServices] IBackupCodeService backupCodeService,
		CancellationToken cancellationToken)
	{
		if (User.GetUserId() is not long userId)
		{
			return Unauthorized();
		}

		int remaining =
			await backupCodeService.GetRemainingCountAsync(
				userId,
				cancellationToken);

		return Ok(remaining);
	}

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
		cookieService.SetOAuthStateCookie(state);
		cookieService.SetOAuthCodeVerifierCookie(codeVerifier);

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
			cookieService.GetOAuthState();

		if (string.IsNullOrEmpty(storedState) || storedState != state)
		{
			logger.LogWarning("GitHub OAuth state mismatch");
			return CreateOAuthErrorResponse("Invalid OAuth state");
		}

		// Get code verifier
		string? codeVerifier =
			cookieService.GetOAuthCodeVerifier();

		if (string.IsNullOrEmpty(codeVerifier))
		{
			logger.LogWarning("GitHub OAuth code verifier missing");
			return CreateOAuthErrorResponse("Missing code verifier");
		}

		string? clientIp = GetClientIpAddress();

		AuthResult result =
			await oAuthService.HandleGitHubCallbackAsync(
				code,
				codeVerifier,
				clientIp,
				cancellationToken);

		cookieService.ClearOAuthCookies();

		if (!result.Success)
		{
			logger.LogWarning(
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
	[HttpPost("oauth/exchange")]
	[EnableRateLimiting(RateLimitPolicyConstants.AuthLogin)]
	[ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest
	)]
	public ActionResult<AuthResponse> ExchangeOAuthCode(
		[FromBody] OAuthCodeExchangeRequest request)
	{
		OAuthCodeExchangeResult? result =
			oauthCodeExchange.ExchangeCode(
				request.Code);

		if (result is null)
		{
			logger.LogWarning(
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

		cookieService.SetRefreshTokenCookie(result.RefreshToken);

		return Ok(
			new AuthResponse(
				AccessToken: result.AccessToken,
				ExpiresAt: result.ExpiresAt,
				Email: result.Email,
				FullName: result.FullName,
				RequiresPasswordChange: false));
	}

	/// <summary>
	/// Gets the current authenticated user's profile.
	/// </summary>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// User profile information.
	/// </returns>
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
		if (User.GetUserId() is not long userId)
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
	/// <param name="request">
	/// Password change request.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// No content on success.
	/// </returns>
	/// <response code="204">Password changed successfully.</response>
	/// <response code="400">Invalid current password or validation error.</response>
	/// <response code="401">Not authenticated.</response>
	[HttpPost("change-password")]
	[Authorize]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest
	)]
	[ProducesResponseType(StatusCodes.Status401Unauthorized)]
	public async Task<IActionResult> ChangePasswordAsync(
		[FromBody] ChangePasswordRequest request,
		CancellationToken cancellationToken)
	{
		if (User.GetUserId() is not long userId)
		{
			return Unauthorized();
		}

		AuthResult result =
			await messageBus.InvokeAsync<AuthResult>(
				new ChangePasswordCommand(userId, request),
				cancellationToken);

		if (!result.Success)
		{
			return BadRequest(
				new ProblemDetails
				{
					Title = "Password Change Failed",
					Detail = result.Error,
					Status =
						StatusCodes.Status400BadRequest,
					Extensions =
						{ ["errorCode"] = result.ErrorCode },
				});
		}

		// Clear refresh token after password change
		cookieService.ClearRefreshTokenCookie();

		return NoContent();
	}

	/// <summary>
	/// Initiates password reset for a user by email.
	/// </summary>
	/// <remarks>
	/// Always returns 200 OK to prevent email enumeration attacks.
	/// Email is only sent if the user exists and is active.
	/// </remarks>
	/// <param name="request">
	/// Forgot password request with email.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// 200 OK regardless of whether email exists.
	/// </returns>
	/// <response code="200">Request processed (email sent if user exists).</response>
	/// <response code="400">Invalid email format.</response>
	/// <response code="429">Too many requests.</response>
	[HttpPost("forgot-password")]
	[EnableRateLimiting(RateLimitPolicyConstants.AuthLogin)]
	[ProducesResponseType(StatusCodes.Status200OK)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest
	)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status429TooManyRequests
	)]
	public async Task<IActionResult> ForgotPasswordAsync(
		[FromBody] ForgotPasswordRequest request,
		CancellationToken cancellationToken)
	{
		await messageBus.InvokeAsync(
			new InitiatePasswordResetByEmailCommand(request),
			cancellationToken);

		// Always return OK to prevent email enumeration
		return Ok(
			new MessageResponse(
				"If an account exists with this email, a reset link has been sent."));
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
	/// <param name="request">
	/// Set password request with token and new password.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Access token and sets refresh token cookie.
	/// </returns>
	/// <response code="200">Password set successfully, includes auth tokens.</response>
	/// <response code="400">Invalid token, expired token, or validation error.</response>
	[HttpPost("set-password")]
	[EnableRateLimiting(RateLimitPolicyConstants.AuthLogin)]
	[ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest
	)]
	public async Task<ActionResult<AuthResponse>> SetPasswordAsync(
		[FromBody] SetPasswordRequest request,
		CancellationToken cancellationToken)
	{
		string? clientIp = GetClientIpAddress();

		AuthResult result =
			await messageBus.InvokeAsync<AuthResult>(
				new SetPasswordCommand(request, clientIp),
				cancellationToken);

		if (!result.Success)
		{
			logger.LogWarning(
				"Set password failed. Error: {Error}, Code: {ErrorCode}",
				result.Error,
				result.ErrorCode);

			return BadRequest(
				new ProblemDetails
				{
					Title = "Set Password Failed",
					Detail = result.Error,
					Status =
						StatusCodes.Status400BadRequest,
					Extensions =
						{ ["errorCode"] = result.ErrorCode },
				});
		}

		cookieService.SetRefreshTokenCookie(result.RefreshToken!);

		return Ok(
			new AuthResponse(
				AccessToken: result.AccessToken!,
				ExpiresAt: result.ExpiresAt!.Value,
				Email: result.Email!,
				FullName: result.FullName,
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
	/// <param name="request">
	/// Registration initiation request with email.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// 200 OK regardless of whether email is available.
	/// </returns>
	/// <response code="200">Request processed (email sent if valid).</response>
	/// <response code="400">Invalid email format.</response>
	/// <response code="429">Too many requests.</response>
	[HttpPost("register/initiate")]
	[EnableRateLimiting(RateLimitPolicyConstants.AuthLogin)]
	[ProducesResponseType(StatusCodes.Status200OK)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest
	)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status429TooManyRequests
	)]
	public async Task<IActionResult> InitiateRegistrationAsync(
		[FromBody] InitiateRegistrationRequest request,
		CancellationToken cancellationToken)
	{
		await messageBus.InvokeAsync(request, cancellationToken);

		// Always return OK to prevent email enumeration
		return Ok(
			new MessageResponse(
				"If this email is available, a verification link has been sent."));
	}

	/// <summary>
	/// Completes user self-registration using a verification token.
	/// </summary>
	/// <remarks>
	/// Validates the token, creates the user account, and returns auth tokens.
	/// The user can immediately start using the application after registration.
	/// </remarks>
	/// <param name="request">
	/// Registration completion request with token, username, and password.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Auth tokens on success.
	/// </returns>
	/// <response code="201">Registration completed successfully, includes auth tokens.</response>
	/// <response code="400">Invalid token, expired token, or validation error.</response>
	[HttpPost("register/complete")]
	[EnableRateLimiting(RateLimitPolicyConstants.AuthLogin)]
	[ProducesResponseType(typeof(AuthResponse), StatusCodes.Status201Created)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest
	)]
	public async Task<ActionResult<AuthResponse>> CompleteRegistrationAsync(
		[FromBody] CompleteRegistrationRequest request,
		CancellationToken cancellationToken)
	{
		string? clientIp = GetClientIpAddress();

		AuthResult result =
			await messageBus.InvokeAsync<AuthResult>(
				new CompleteRegistrationCommand(request, clientIp),
				cancellationToken);

		if (!result.Success)
		{
			logger.LogWarning(
				"Registration completion failed. Error: {Error}, Code: {ErrorCode}",
				result.Error,
				result.ErrorCode);

			return BadRequest(
				new ProblemDetails
				{
					Title = "Registration Failed",
					Detail = result.Error,
					Status =
						StatusCodes.Status400BadRequest,
					Extensions =
						{ ["errorCode"] = result.ErrorCode },
				});
		}

		cookieService.SetRefreshTokenCookie(result.RefreshToken!);

		return StatusCode(
			StatusCodes.Status201Created,
			new AuthResponse(
				AccessToken: result.AccessToken!,
				ExpiresAt: result.ExpiresAt!.Value,
				Email: result.Email!,
				FullName: result.FullName,
				RequiresPasswordChange: false));
	}

	/// <summary>
	/// Gets client IP address from HttpContext.
	/// ForwardedHeadersMiddleware handles X-Forwarded-For validation from trusted proxies.
	/// </summary>
	private string? GetClientIpAddress() =>
		HttpContext.Connection.RemoteIpAddress?.ToString();

	/// <summary>
	/// Creates HTML response that posts OAuth authorization code to parent window.
	/// Tokens are stored server-side; client exchanges code for tokens via API.
	/// </summary>
	private ContentResult CreateOAuthSuccessResponse(
		string accessToken,
		string refreshToken,
		DateTime expiresAt,
		string email,
		string? fullName)
	{
		string origin =
			cookieService.GetAllowedOrigin();

		// Store tokens and get one-time code (60 second TTL)
		string code =
			oauthCodeExchange.StoreTokens(
				accessToken,
				refreshToken,
				expiresAt,
				email,
				fullName);

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

		return Content(html, "text/html");
	}

	/// <summary>
	/// Creates HTML response that posts OAuth error to parent window.
	/// </summary>
	private ContentResult CreateOAuthErrorResponse(string error)
	{
		string origin =
			cookieService.GetAllowedOrigin();

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

		return Content(html, "text/html");
	}

	/// <summary>
	/// Validated authentication result with non-nullable token fields.
	/// </summary>
	/// <param name="AccessToken">
	/// The JWT access token.
	/// </param>
	/// <param name="RefreshToken">
	/// The refresh token.
	/// </param>
	/// <param name="ExpiresAt">
	/// Token expiration time.
	/// </param>
	/// <param name="Email">
	/// User's email address.
	/// </param>
	/// <param name="FullName">
	/// User's full name (optional).
	/// </param>
	/// <param name="RequiresPasswordChange">
	/// Whether user must change password.
	/// </param>
	private readonly record struct ValidatedAuthResult(
		string AccessToken,
		string RefreshToken,
		DateTime ExpiresAt,
		string Email,
		string? FullName,
		bool RequiresPasswordChange);

	/// <summary>
	/// Validates that a successful AuthResult contains all required token fields.
	/// </summary>
	/// <param name="result">
	/// The authentication result to validate.
	/// </param>
	/// <returns>
	/// A validated result with non-nullable token fields.
	/// </returns>
	/// <exception cref="InvalidOperationException">
	/// Thrown when a successful result is missing required fields.
	/// </exception>
	private static ValidatedAuthResult ValidateSuccessfulAuthResult(AuthResult result)
	{
		if (result.AccessToken is null
			|| result.RefreshToken is null
			|| result.ExpiresAt is null
			|| result.Email is null)
		{
			throw new InvalidOperationException(
				"Successful AuthResult must contain AccessToken, RefreshToken, ExpiresAt, and Email.");
		}

		return new ValidatedAuthResult(
			result.AccessToken,
			result.RefreshToken,
			result.ExpiresAt.Value,
			result.Email,
			result.FullName,
			result.RequiresPasswordChange);
	}
}