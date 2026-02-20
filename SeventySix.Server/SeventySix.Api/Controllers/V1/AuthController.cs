// <copyright file="AuthController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using SeventySix.Api.Attributes;
using SeventySix.Api.Configuration;
using SeventySix.Api.Extensions;
using SeventySix.Api.Infrastructure;
using SeventySix.Identity;
using SeventySix.Shared.POCOs;
using Wolverine;

namespace SeventySix.Api.Controllers;

/// <summary>
/// Core authentication API endpoints.
/// Provides login, token refresh, logout, and current user operations.
/// </summary>
/// <remarks>
/// Design Principles:
/// - Refresh tokens stored in HTTP-only cookies (secure)
/// - Access tokens returned in response body.
/// </remarks>
/// <param name="messageBus">
/// The Wolverine message bus for CQRS operations.
/// </param>
/// <param name="cookieService">
/// Service for authentication cookie management.
/// </param>
/// <param name="logger">
/// Logger for authentication operations.
/// </param>
[ApiController]
[Route(ApiVersionConfig.VersionedRoutePrefix + "/auth")]
public sealed class AuthController(
	IMessageBus messageBus,
	IAuthCookieService cookieService,
	IOptions<AuthSettings> authSettings,
	ILogger<AuthController> logger) : AuthControllerBase(cookieService, authSettings, logger)
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
		StatusCodes.Status400BadRequest)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status401Unauthorized)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status429TooManyRequests)]
	public async Task<ActionResult<AuthResponse>> LoginAsync(
		[FromBody] LoginRequest request,
		CancellationToken cancellationToken)
	{
		string? clientIp = GetClientIpAddress();
		string? trustedDeviceToken =
			CookieService.GetTrustedDeviceToken();
		string? userAgent =
			Request.Headers.UserAgent.ToString();

		AuthResult result =
			await messageBus.InvokeAsync<AuthResult>(
				new LoginCommand(
					request,
					clientIp,
					trustedDeviceToken,
					userAgent),
				cancellationToken);

		if (result.RequiresMfa)
		{
			return Ok(AuthResponse.FromResult(result));
		}

		if (!result.Success)
		{
			return HandleFailedAuthResult(
				result,
				"Authentication",
				StatusCodes.Status401Unauthorized);
		}

		ValidatedAuthResult validatedResult =
			ValidateSuccessfulAuthResult(result);

		CookieService.SetRefreshTokenCookie(
			validatedResult.RefreshToken,
			result.RememberMe);

		return Ok(CreateAuthResponse(validatedResult));
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
		StatusCodes.Status401Unauthorized)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status429TooManyRequests)]
	public async Task<ActionResult<AuthResponse>> RefreshAsync(
		CancellationToken cancellationToken)
	{
		string? refreshToken =
			CookieService.GetRefreshToken();

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
			CookieService.ClearRefreshTokenCookie();

			return HandleFailedAuthResult(
				result,
				"Authentication",
				StatusCodes.Status401Unauthorized);
		}

		ValidatedAuthResult validatedResult =
			ValidateSuccessfulAuthResult(result);

		CookieService.SetRefreshTokenCookie(
			validatedResult.RefreshToken,
			result.RememberMe);

		return Ok(CreateAuthResponse(validatedResult));
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
			CookieService.GetRefreshToken();

		if (!string.IsNullOrEmpty(refreshToken))
		{
			LogoutCommand command =
				new(refreshToken);

			await messageBus.InvokeAsync<Result>(command, cancellationToken);
		}

		CookieService.ClearRefreshTokenCookie();
		CookieService.ClearOAuthCookies();

		return NoContent();
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
	[AllowWithPendingPasswordChange]
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
}