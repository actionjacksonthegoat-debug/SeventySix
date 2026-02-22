// <copyright file="RegistrationController.cs" company="SeventySix">
// Copyright (c) SeventySix. All rights reserved.
// </copyright>

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using SeventySix.Api.Configuration;
using SeventySix.Api.Infrastructure;
using SeventySix.Identity;
using SeventySix.Shared.POCOs;
using Wolverine;

namespace SeventySix.Api.Controllers;

/// <summary>
/// User registration API endpoints.
/// Handles new user registration with email verification.
/// </summary>
/// <param name="messageBus">
/// The Wolverine message bus for CQRS operations.
/// </param>
/// <param name="cookieService">
/// Service for authentication cookie management.
/// </param>
/// <param name="logger">
/// Logger for registration operations.
/// </param>
[ApiController]
[Route(ApiVersionConfig.VersionedRoutePrefix + "/auth/register")]
public sealed class RegistrationController(
	IMessageBus messageBus,
	IAuthCookieService cookieService,
	IOptions<AuthSettings> authSettings,
	ILogger<RegistrationController> logger) : AuthControllerBase(cookieService, authSettings, logger)
{
	/// <summary>
	/// Initiates user registration by creating an unverified account.
	/// </summary>
	/// <remarks>
	/// Creates user record and sends verification email.
	/// User must verify email before account becomes active.
	/// Requires ALTCHA challenge solution for bot protection.
	/// </remarks>
	/// <param name="request">
	/// Registration request with user details and ALTCHA solution.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Success message on registration initiation.
	/// </returns>
	/// <response code="200">Registration initiated, verification email sent.</response>
	/// <response code="400">Validation error or email already registered.</response>
	/// <response code="429">Too many registration attempts.</response>
	[HttpPost("initiate")]
	[EnableRateLimiting(RateLimitPolicyConstants.AuthRegister)]
	[ProducesResponseType(typeof(MessageResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status429TooManyRequests)]
	public async Task<ActionResult<MessageResponse>> InitiateRegistrationAsync(
		[FromBody] InitiateRegistrationRequest request,
		CancellationToken cancellationToken)
	{
		// Handler silently succeeds to prevent email enumeration
		await messageBus.InvokeAsync(
			request,
			cancellationToken);

		return Ok(
			new MessageResponse(
				"Registration initiated. Please check your email to verify your account."));
	}

	/// <summary>
	/// Completes registration by verifying the user's email.
	/// </summary>
	/// <remarks>
	/// Uses token from verification email to activate account.
	/// On success, returns auth tokens for immediate login.
	/// </remarks>
	/// <param name="request">
	/// Complete registration request with verification token.
	/// </param>
	/// <param name="cancellationToken">
	/// Cancellation token.
	/// </param>
	/// <returns>
	/// Access token and sets refresh token cookie.
	/// </returns>
	/// <response code="200">Registration completed, includes auth tokens.</response>
	/// <response code="400">Invalid token, expired token, or already verified.</response>
	[HttpPost("complete")]
	[EnableRateLimiting(RateLimitPolicyConstants.AuthRegister)]
	[ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
	[ProducesResponseType(
		typeof(ProblemDetails),
		StatusCodes.Status400BadRequest)]
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
			return HandleFailedAuthResult(result, "Registration Completion");
		}

		CookieService.SetRefreshTokenCookie(
			result.RefreshToken!,
			rememberMe: false);

		return Ok(
			new AuthResponse(
				AccessToken: result.AccessToken!,
				ExpiresAt: result.ExpiresAt!.Value,
				Email: result.Email!,
				FullName: result.FullName,
				RequiresPasswordChange: false));
	}
}